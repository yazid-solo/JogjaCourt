import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres.uceoowllzdpvpituzigj:badminton_yazid_123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

async def main():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(150);"))
            print("Columns added successfully!")
        except Exception as e:
            print("Error:", e)
    await engine.dispose()

asyncio.run(main())