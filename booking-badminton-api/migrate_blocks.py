import asyncio
from app.database import engine
from sqlalchemy import text

async def main():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS blocked_users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(blocker_id, blocked_id)
                );
            """))
        print('Success creating blocked_users table')
    except Exception as e:
        print('Error:', e)

if __name__ == '__main__':
    asyncio.run(main())
