import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.future import select
from app.config import settings
from app.models.user import User, RoleEnum
from app.utils.jwt import get_password_hash

async def setup_admin():
    engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as db:
        # Cek apakah user admin@arenabooking.com sudah ada
        result = await db.execute(select(User).where(User.email == settings.DEFAULT_ADMIN_EMAIL))
        admin = result.scalars().first()
        
        if admin:
            print(f"User {settings.DEFAULT_ADMIN_EMAIL} sudah ada.")
            # Update passwordnya sesuai di .env agar pasti bisa login
            admin.password_hash = get_password_hash(settings.DEFAULT_ADMIN_PASSWORD)
            await db.commit()
            print(f"✅ Password berhasil di-reset menjadi: {settings.DEFAULT_ADMIN_PASSWORD}")
        else:
            print("Membuat Super Admin baru...")
            new_admin = User(
                name=settings.DEFAULT_ADMIN_NAME,
                email=settings.DEFAULT_ADMIN_EMAIL,
                password_hash=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
                role=RoleEnum.super_admin,
                phone="080000000000"
            )
            db.add(new_admin)
            await db.commit()
            print(f"✅ Super Admin berhasil dibuat!\nEmail: {settings.DEFAULT_ADMIN_EMAIL}\nPassword: {settings.DEFAULT_ADMIN_PASSWORD}")

if __name__ == "__main__":
    asyncio.run(setup_admin())
