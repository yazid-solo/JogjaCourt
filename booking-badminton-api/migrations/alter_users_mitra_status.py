import asyncio
from app.database import engine
from sqlalchemy import text

async def alter_table():
    async with engine.begin() as conn:
        try:
            # Add mitra_status
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS mitra_status VARCHAR(50)"))
            print("Successfully added mitra_status to users table.")
        except Exception as e:
            print(f"Error altering table: {e}")

if __name__ == "__main__":
    asyncio.run(alter_table())
