import asyncio
from app.database import engine
from sqlalchemy import text

async def upgrade():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255);"))
            print("Successfully added profile_image to users table.")
        except Exception as e:
            print(f"Error (maybe already exists?): {e}")

asyncio.run(upgrade())
