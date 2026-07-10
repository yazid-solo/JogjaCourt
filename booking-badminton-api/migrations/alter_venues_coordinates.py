import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set")

engine = create_async_engine(DATABASE_URL, echo=True)

async def alter_table():
    async with engine.begin() as conn:
        try:
            # Add latitude and longitude columns
            await conn.execute(
                __import__('sqlalchemy').text("ALTER TABLE venues ADD COLUMN latitude FLOAT")
            )
            print("Added latitude column")
        except Exception as e:
            print(f"Latitude column might already exist: {e}")
            
        try:
            await conn.execute(
                __import__('sqlalchemy').text("ALTER TABLE venues ADD COLUMN longitude FLOAT")
            )
            print("Added longitude column")
        except Exception as e:
            print(f"Longitude column might already exist: {e}")
            
        # Set some default coordinates for existing venues to Yogyakarta center
        try:
            await conn.execute(
                __import__('sqlalchemy').text("UPDATE venues SET latitude = -7.797068, longitude = 110.370529 WHERE latitude IS NULL OR longitude IS NULL")
            )
            print("Updated default coordinates for existing venues")
        except Exception as e:
            print(f"Could not update default coordinates: {e}")

if __name__ == "__main__":
    asyncio.run(alter_table())
