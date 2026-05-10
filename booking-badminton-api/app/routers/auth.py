from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from pydantic import BaseModel

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, Token, UserUpdate
from app.services.auth_service import create_user, get_user_by_email
from app.utils.jwt import verify_password, create_access_token, get_password_hash
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    """Register akun customer baru."""
    return await create_user(db, user)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)) -> Any:
    """Login dan dapatkan JWT token."""
    user = await get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
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
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user = Depends(get_current_user)):
    """Profil pengguna yang sedang login."""
    return current_user

from fastapi import UploadFile, File
from app.utils.helpers import upload_image_to_supabase

@router.post("/me/profile-image", response_model=UserResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload dan update foto profil pengguna."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")
        
    try:
        contents = await file.read()
        filename = f"profiles/{current_user.id}_{file.filename}"
        
        # Simpan di bucket "payments" (karena bucket itu sudah pasti ada) atau bisa ubah ke bucket "profiles" jika ada.
        # Di sini pakai "payments" sebagai default Supabase Storage bucket.
        image_url = await upload_image_to_supabase(contents, filename, bucket_name="payments")
        
        current_user.profile_image = image_url
        await db.commit()
        await db.refresh(current_user)
        return current_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
