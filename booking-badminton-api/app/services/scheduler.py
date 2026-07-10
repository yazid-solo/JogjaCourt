import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.database import async_session
from app.models.booking import Booking, BookingStatusEnum

async def cancel_expired_bookings():
    """
    Fungsi ini dipanggil secara berkala oleh APScheduler.
    Fungsinya mencari booking yang statusnya pending dan waktu saat ini sudah
    melewati batas expires_at, lalu mengubahnya menjadi expired.
    """
    try:
        async with async_session() as db:
            now = datetime.utcnow()
            
            # Cari booking yang pending dan sudah melewati expires_at
            query = select(Booking).where(
                Booking.status == BookingStatusEnum.pending,
                Booking.expires_at != None,
                Booking.expires_at <= now
            )
            result = await db.execute(query)
            expired_bookings = result.scalars().all()
            
            if expired_bookings:
                # Update status menjadi expired
                booking_ids = [b.id for b in expired_bookings]
                stmt = (
                    update(Booking)
                    .where(Booking.id.in_(booking_ids))
                    .values(status=BookingStatusEnum.expired)
                )
                await db.execute(stmt)
                await db.commit()
                print(f"[{now}] Scheduler: Auto-cancelled {len(booking_ids)} expired bookings.")
    except Exception as e:
        print(f"Scheduler Error: {e}")
