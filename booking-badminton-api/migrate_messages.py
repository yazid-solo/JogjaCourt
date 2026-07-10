import asyncio
from app.database import engine
from sqlalchemy import text

async def main():
    try:
        async with engine.begin() as conn:
            await conn.execute(text('ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT \'text\';'))
            await conn.execute(text('ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;'))
            await conn.execute(text('ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;'))
        print('Success updating messages table')
    except Exception as e:
        print('Error:', e)

if __name__ == '__main__':
    asyncio.run(main())
