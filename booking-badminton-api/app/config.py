import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    DEFAULT_ADMIN_EMAIL: str = "admin@jogjacourt.com"
    DEFAULT_ADMIN_PASSWORD: str = "admin123"
    DEFAULT_ADMIN_NAME: str = "Super Admin"

    FRONTEND_URL: str = "http://localhost:3000"

    XENDIT_SECRET_KEY: str = "" # Kunci Rahasia Xendit (contoh: xnd_development_...)
    GOOGLE_CLIENT_ID: str = ""
    
    # WhatsApp Gateway (Fonnte)
    FONNTE_TOKEN: str = ""
    
    # SMTP Email Server
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
