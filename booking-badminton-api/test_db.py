import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT current_database(), current_user, version();"))
        row = result.fetchone()
        print(f"Connected to DB: {row[0]}, User: {row[1]}, Version: {row[2][:15]}...")
    await engine.dispose()

asyncio.run(main())