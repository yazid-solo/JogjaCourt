import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE venues ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;"))
            print("Successfully added owner_id to venues table.")
        except Exception as e:
            print(f"Migration failed or already applied: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
