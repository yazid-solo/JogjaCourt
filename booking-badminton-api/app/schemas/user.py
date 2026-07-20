from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import RoleEnum

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    mitra_gor_name: Optional[str] = None
    mitra_gor_address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    profile_image: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    role: RoleEnum
    profile_image: Optional[str] = None
    is_active: bool
    mitra_status: Optional[str] = None
    mitra_gor_name: Optional[str] = None
    mitra_gor_address: Optional[str] = None
    is_email_verified: bool
    google_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserBankUpdate(BaseModel):
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None

class MitraRequest(BaseModel):
    mitra_gor_name: str
    mitra_gor_address: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class GoogleLoginRequest(BaseModel):
    token: str # Google OAuth2 token / ID
    is_mitra: bool = False
    mitra_gor_name: Optional[str] = None
    mitra_gor_address: Optional[str] = None

class VerifyEmailRequest(BaseModel):
    token: str
