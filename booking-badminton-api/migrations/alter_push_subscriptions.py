import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set")

engine = create_async_engine(DATABASE_URL, echo=True)

async def create_table():
    async with engine.begin() as conn:
        try:
            await conn.execute(
                __import__('sqlalchemy').text('''
                CREATE TABLE IF NOT EXISTS push_subscriptions (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    endpoint TEXT NOT NULL UNIQUE,
                    p256dh VARCHAR(100) NOT NULL,
                    auth VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                ''')
            )
            print("Created push_subscriptions table")
        except Exception as e:
            print(f"Error creating table: {e}")

if __name__ == "__main__":
    asyncio.run(create_table())
