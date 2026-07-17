from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import Optional

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.message import Message
from app.utils.dependencies import require_super_admin, get_current_user
from app.schemas.user import UserResponse, UserBankUpdate, MitraRequest
from app.utils.helpers import upload_image_to_supabase

router = APIRouter(prefix="/users", tags=["Users"])

@router.put("/me/bank-info", response_model=UserResponse)
async def update_my_bank_info(
    payload: UserBankUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update informasi rekening bank milik sendiri (Admin GOR)."""
    current_user.bank_name = payload.bank_name
    current_user.bank_account_number = payload.bank_account_number
    current_user.bank_account_name = payload.bank_account_name
    
    await db.commit()
    await db.refresh(current_user)
    return current_user


class UserListResponse(BaseModel):
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    profile_image: Optional[str] = None
    mitra_status: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserPaginatedResponse(BaseModel):
    total_count: int
    total_pages: int
    current_page: int
    limit: int
    data: List[UserListResponse]

@router.get("/super-admin", response_model=UserListResponse)
async def get_super_admin(db: AsyncSession = Depends(get_db)):
    """Mendapatkan profil Super Admin untuk rujukan chat sentral."""
    result = await db.execute(select(User).where(User.role == RoleEnum.super_admin).limit(1))
    sa = result.scalars().first()
    if not sa:
        raise HTTPException(status_code=404, detail="Super Admin tidak ditemukan")
    return sa

@router.post("/me/mitra-request", response_model=UserResponse)
async def request_mitra_upgrade(
    payload: MitraRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Pengajuan Mitra untuk user yang sudah login."""
    if current_user.role != RoleEnum.customer:
        raise HTTPException(status_code=400, detail="Anda sudah menjadi Admin/Super Admin")
    
    current_user.mitra_status = 'pending'
    current_user.mitra_gor_name = payload.mitra_gor_name
    current_user.mitra_gor_address = payload.mitra_gor_address
    
    await db.commit()
    await db.refresh(current_user)
    
    from app.services.auth_service import notify_super_admins
    await notify_super_admins(
        db,
        title="Pengajuan Mitra Baru (User Terdaftar)",
        message=f"{current_user.name} telah mengajukan permohonan sebagai Mitra. Silakan tinjau pengajuannya.",
        related_type="mitra_request",
        related_id=str(current_user.id)
    )
    
    return current_user

class ContactPayload(BaseModel):
    topic: str
    message: str

@router.post("/contact-us")
async def contact_us(
    payload: ContactPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kirim pesan bantuan ke Super Admin."""
    # Find super admin
    result = await db.execute(select(User).where(User.role == RoleEnum.super_admin).limit(1))
    sa = result.scalars().first()
    
    if not sa:
        raise HTTPException(status_code=500, detail="Tidak ada Super Admin yang bertugas saat ini.")
    
    # Format message
    content = f"[Topik: {payload.topic.title()}] - {payload.message}"
    
    # Create message
    new_message = Message(
        sender_id=current_user.id,
        receiver_id=sa.id,
        content=content,
        message_type="text"
    )
    
    db.add(new_message)
    await db.commit()
    
    # Optionally notify super admin via WebSocket
    try:
        import json
        from app.routers.chat import manager
        msg_json = json.dumps({
            "id": str(new_message.id),
            "sender_id": str(new_message.sender_id),
            "receiver_id": str(new_message.receiver_id),
            "content": new_message.content,
            "message_type": new_message.message_type,
            "attachment_url": new_message.attachment_url,
            "created_at": new_message.created_at.isoformat(),
            "sender_name": current_user.name,
            "sender_role": current_user.role.value if current_user.role else ""
        })
        await manager.send_personal_message(msg_json, str(sa.id))
    except Exception as e:
        print(f"Gagal mengirim ws notifikasi contact: {e}")
        
    return {"status": "success", "message": "Pesan terkirim"}

@router.post("/me/profile-image", response_model=UserResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload gambar profil ke Supabase Storage."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")
        
    try:
        contents = await file.read()
        filename = f"profiles/{uuid.uuid4()}_{file.filename}"
        
        image_url = await upload_image_to_supabase(contents, filename, bucket_name="payments")
        
        current_user.profile_image = image_url
        await db.commit()
        await db.refresh(current_user)
        return current_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/me/profile-image", response_model=UserResponse)
async def delete_profile_image(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hapus gambar profil."""
    if current_user.profile_image:
        # In a complete implementation, we'd delete from Supabase storage as well.
        # But for now, we just remove the reference.
        current_user.profile_image = None
        await db.commit()
        await db.refresh(current_user)
    return current_user

class UserStatusUpdate(BaseModel):
    is_active: bool

class UserRoleUpdate(BaseModel):
    role: str


from sqlalchemy import func

@router.get("", response_model=UserPaginatedResponse, dependencies=[Depends(require_super_admin)])
async def get_all_users(
    page: int = 1,
    size: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Daftar semua pengguna (Super Admin)."""
    count_stmt = select(func.count(User.id))
    total_count_res = await db.execute(count_stmt)
    total_count = total_count_res.scalar() or 0

    offset = (page - 1) * size
    stmt = select(User).order_by(User.role, User.name).offset(offset).limit(size)
    
    result = await db.execute(stmt)
    users = result.scalars().all()

    total_pages = (total_count + size - 1) // size
    if total_pages == 0:
        total_pages = 1

    return {
        "total_count": total_count,
        "total_pages": total_pages,
        "current_page": page,
        "limit": size,
        "data": users
    }


@router.put("/{user_id}/status", response_model=UserListResponse, dependencies=[Depends(require_super_admin)])
async def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Aktifkan / nonaktifkan (banned) akun pengguna (Super Admin)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    if user.role in (RoleEnum.super_admin,):
        raise HTTPException(status_code=400, detail="Tidak dapat menonaktifkan akun Super Admin")
    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)
    return user

@router.put("/{user_id}/role", response_model=UserListResponse, dependencies=[Depends(require_super_admin)])
async def update_user_role(
    user_id: UUID,
    payload: UserRoleUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Ubah peran pengguna (Super Admin)."""
    if payload.role not in [e.value for e in RoleEnum]:
        raise HTTPException(status_code=400, detail="Peran tidak valid")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
        
    if user.role == RoleEnum.super_admin and payload.role != "super_admin":
        raise HTTPException(status_code=400, detail="Tidak dapat merubah peran Super Admin")
        
    user.role = RoleEnum(payload.role)
    if user.role == RoleEnum.admin:
        user.mitra_status = 'approved'
    elif user.role == RoleEnum.customer and user.mitra_status == 'pending':
        user.mitra_status = 'rejected'
        
    await db.commit()
    await db.refresh(user)
    return user
