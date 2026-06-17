from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user import User, RoleEnum
from app.utils.dependencies import require_super_admin

router = APIRouter(prefix="/users", tags=["Users"])


class UserListResponse(BaseModel):
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True


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
    await db.commit()
    await db.refresh(user)
    return user
