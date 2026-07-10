import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

DATABASE_URL = settings.DATABASE_URL

async def migrate():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE kyc_requests ADD COLUMN foto_gor JSONB DEFAULT '[]'::jsonb;"))
            print("Successfully added foto_gor column")
        except Exception as e:
            print("Error or already exists:", e)

if __name__ == "__main__":
    asyncio.run(migrate())
