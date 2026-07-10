from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user import User, RoleEnum
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

    class Config:
        from_attributes = True

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


@router.get("", response_model=List[UserListResponse], dependencies=[Depends(require_super_admin)])
async def get_all_users(db: AsyncSession = Depends(get_db)):
    """Daftar semua pengguna (Super Admin)."""
    result = await db.execute(
        select(User).order_by(User.role, User.name)
    )
    return result.scalars().all()


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
