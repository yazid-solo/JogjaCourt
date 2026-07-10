import asyncio
from app.database import engine
from sqlalchemy import text

async def main():
    try:
        async with engine.begin() as conn:
            await conn.execute(text('ALTER TABLE testimonials ADD COLUMN admin_reply TEXT;'))
        print('Success')
    except Exception as e:
        print('Error:', e)

if __name__ == '__main__':
    asyncio.run(main())
