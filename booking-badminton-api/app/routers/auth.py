from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from pydantic import BaseModel
from datetime import timedelta

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, Token, UserUpdate, ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest, GoogleLoginRequest
from app.services.auth_service import create_user, get_user_by_email, update_profile_image, handle_forgot_password, handle_reset_password, handle_verify_email, process_google_login
from app.utils.jwt import verify_password, create_access_token, get_password_hash
from app.utils.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.get("/config")
async def get_auth_config():
    """Mengembalikan konfigurasi publik untuk frontend (seperti Client ID)."""
    return {"google_client_id": settings.GOOGLE_CLIENT_ID}

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    """Register akun customer baru."""
    return await create_user(db, user)

@router.post("/register/mitra", response_model=UserResponse)
async def register_mitra(user: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    """Register akun admin/mitra GOR."""
    from app.models.user import RoleEnum
    return await create_user(db, user, role=RoleEnum.customer, mitra_status='pending')

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    remember: bool = Query(False),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Login dan dapatkan JWT token."""
    user = await get_user_by_email(db, form_data.username)
    if not user or not user.password_hash or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda telah dinonaktifkan. Silakan hubungi administrator.",
        )
        
    expires_delta = timedelta(days=30) if remember else None
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role}, expires_delta=expires_delta)
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/google", response_model=Token)
async def google_login(req: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """Google OAuth2 Login"""
    user = await process_google_login(
        db, 
        req.token, 
        req.is_mitra,
        req.mitra_gor_name,
        req.mitra_gor_address
    )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Akun dinonaktifkan")
        
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role}, expires_delta=timedelta(days=30))
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    """Verify email with token."""
    await handle_verify_email(db, req.token)
    return {"message": "Email berhasil diverifikasi"}

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Minta link reset password."""
    await handle_forgot_password(db, req.email)
    # Always return success to prevent email enumeration
    return {"message": "Jika email terdaftar, link reset telah dikirim."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password dengan token."""
    await handle_reset_password(db, req.token, req.new_password)
    return {"message": "Password berhasil diubah. Silakan login."}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user = Depends(get_current_user)):
    """Profil pengguna yang sedang login."""
    return current_user

@router.post("/me/profile-image", response_model=UserResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload dan update foto profil pengguna."""
    return await update_profile_image(db, current_user, file)

@router.delete("/me/profile-image", response_model=UserResponse)
async def delete_profile_image(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Hapus foto profil pengguna."""
    current_user.profile_image = None
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_users_me(
    req: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update profil pengguna yang sedang login (Nama dan Nomor Telepon)."""
    if req.name is not None:
        current_user.name = req.name
    if req.phone is not None:
        current_user.phone = req.phone
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.put("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Ganti password pengguna yang sedang login."""
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Password lama tidak benar")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password baru minimal 6 karakter")
    current_user.password_hash = get_password_hash(req.new_password)
    await db.commit()
    return {"message": "Password berhasil diubah"}

@router.delete("/me")
async def delete_my_account(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Hapus akun pengguna yang sedang login secara permanen."""
    from app.models.user import RoleEnum
    
    # Keamanan ekstra: cegah penghapusan akun Admin/Super Admin
    if current_user.role in [RoleEnum.admin, RoleEnum.super_admin]:
        raise HTTPException(
            status_code=403, 
            detail="Akun Admin tidak dapat dihapus secara mandiri. Silakan hubungi pusat bantuan."
        )
        
    await db.delete(current_user)
    await db.commit()
    return {"message": "Akun Anda telah berhasil dihapus secara permanen."}
