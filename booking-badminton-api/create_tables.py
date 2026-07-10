import asyncio
import sys
import os

# Add current directory to path so 'app' can be resolved
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
import app.models  # Registers all models

async def init_models():
    print("Creating missing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_models())
