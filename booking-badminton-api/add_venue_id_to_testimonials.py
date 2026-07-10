import asyncio
from sqlalchemy import text
from app.database import engine

async def add_column():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE testimonials ADD COLUMN venue_id UUID REFERENCES venues(id) ON DELETE CASCADE;"))
            print("Successfully added venue_id to testimonials.")
        except Exception as e:
            print(f"Error (maybe column exists?): {e}")

if __name__ == "__main__":
    asyncio.run(add_column())
