import asyncio
from sqlalchemy import text
from app.database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Menambahkan kolom end_date ke tabel bookings...")
        try:
            await conn.execute(text("ALTER TABLE bookings ADD COLUMN end_date DATE"))
            
            # Update data harian
            await conn.execute(text("UPDATE bookings SET end_date = booking_date WHERE booking_type = 'hourly'"))
            
            # Update data bulanan (asumsikan +30 hari)
            await conn.execute(text("UPDATE bookings SET end_date = booking_date + interval '30 days' WHERE booking_type = 'monthly'"))
            
            print("Berhasil!")
        except Exception as e:
            print(f"Gagal/Sudah ada: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
