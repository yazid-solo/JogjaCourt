import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Menambahkan kolom days_of_week ke tabel bookings...")
        try:
            await conn.execute(text("ALTER TABLE bookings ADD COLUMN days_of_week JSONB DEFAULT '[]'"))
            print("Berhasil!")
        except Exception as e:
            print(f"Gagal/Sudah ada: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
