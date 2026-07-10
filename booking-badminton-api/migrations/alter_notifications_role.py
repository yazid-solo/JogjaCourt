import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

async def run():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE notifications ADD COLUMN target_role VARCHAR(50);"))
            print("Successfully added 'target_role' column to notifications table.")
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate column' in str(e).lower():
                print("Column 'target_role' already exists.")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
