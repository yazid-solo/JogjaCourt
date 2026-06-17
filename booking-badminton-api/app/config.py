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

    class Config:
        env_file = ".env"

settings = Settings()
