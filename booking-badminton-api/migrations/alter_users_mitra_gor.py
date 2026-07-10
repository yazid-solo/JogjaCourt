import asyncio
from sqlalchemy import text
from app.database import engine

async def alter_table():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE users ADD COLUMN mitra_gor_name VARCHAR(255);"))
            print("Added mitra_gor_name")
    except Exception as e:
        print("Error adding mitra_gor_name (maybe exists?):", e)
        
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE users ADD COLUMN mitra_gor_address TEXT;"))
            print("Added mitra_gor_address")
    except Exception as e:
        print("Error adding mitra_gor_address (maybe exists?):", e)

if __name__ == "__main__":
    asyncio.run(alter_table())
