import asyncio
import sys
import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from passlib.context import CryptContext
from app.config import settings
from app.models.user import User, RoleEnum

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_super_admin():
    async with AsyncSessionLocal() as db:
        email = settings.DEFAULT_ADMIN_EMAIL
        pwd = settings.DEFAULT_ADMIN_PASSWORD
        name = settings.DEFAULT_ADMIN_NAME
        
        existing = await db.execute(select(User).where(User.email == email))
        user = existing.scalars().first()
        
        if user:
            user.role = RoleEnum.super_admin
            user.password_hash = pwd_context.hash(pwd)
            print(f"User {email} diupdate menjadi Super Admin.")
        else:
            user = User(
                name=name,
                email=email,
                password_hash=pwd_context.hash(pwd),
                phone="08000000000",
                role=RoleEnum.super_admin,
                is_active=True
            )
            db.add(user)
            print(f"User {email} berhasil dibuat sebagai Super Admin.")
            
        await db.commit()

if __name__ == "__main__":
    asyncio.run(create_super_admin())
