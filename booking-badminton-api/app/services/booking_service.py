from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from fastapi import HTTPException
from datetime import datetime, timedelta, time, timezone
from decimal import Decimal
from uuid import UUID

from app.models.booking import Booking, BookingStatusEnum, BookingTypeEnum
from app.models.court import Court
from app.models.court_block import CourtBlock
from app.schemas.booking import BookingCreate

async def check_availability(db: AsyncSession, court_id: UUID, booking_date, start_time: time, end_time: time):
    # Check conflicting bookings (pending or confirmed)
    # Pending bookings that are expired are ignored
    current_time = datetime.utcnow()
    
    # 1. Check existing bookings
    stmt = select(Booking).where(
        Booking.court_id == court_id,
        Booking.booking_date == booking_date,
        Booking.status.in_([BookingStatusEnum.confirmed, BookingStatusEnum.pending]),
        # Overlap logic: (StartA < EndB) and (EndA > StartB)
        Booking.start_time < end_time,
        Booking.end_time > start_time
    )
    result = await db.execute(stmt)
    conflicting_bookings = result.scalars().all()
    
    for b in conflicting_bookings:
        if b.status == BookingStatusEnum.pending:
            if b.expires_at:
                exp = b.expires_at.replace(tzinfo=None) if b.expires_at.tzinfo else b.expires_at
                if exp < current_time:
                    # Expired pending booking, safe to ignore
                    continue
                else:
                    return False, "Jadwal ini sedang dalam proses pemesanan oleh orang lain (locked)."
        return False, "Jadwal sudah di-booking."
        
    # 2. Check court blocks (maintenance, etc)
    stmt_blocks = select(CourtBlock).where(
        CourtBlock.court_id == court_id,
        CourtBlock.block_date == booking_date,
        CourtBlock.start_time < end_time,
        CourtBlock.end_time > start_time
    )
    result_blocks = await db.execute(stmt_blocks)
    if result_blocks.scalars().first():
        return False, "Lapangan ditutup/diblokir pada jadwal ini."
        
    return True, "Available"

async def calculate_price(db: AsyncSession, court_id: UUID, booking_type: BookingTypeEnum, start_time: time, end_time: time):
    # Fetch court details
    result = await db.execute(select(Court).where(Court.id == court_id))
    court = result.scalars().first()
    
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
        
    end_dt = datetime.combine(datetime.min, end_time)
    start_dt = datetime.combine(datetime.min, start_time)
    
    if end_time == time(23, 59):
        end_dt += timedelta(minutes=1) # Treat as exactly 24:00 (1 full hour)
        
    duration_hours = (end_dt - start_dt).seconds / 3600
    
    if booking_type == BookingTypeEnum.monthly:
        if not court.price_monthly:
            raise HTTPException(status_code=400, detail="Sewa bulanan tidak tersedia untuk lapangan ini")
        return Decimal(float(court.price_monthly) * duration_hours)
        
    # Calculate hourly price
    
    price_per_hour = float(court.price_regular)
    
    # Very basic peak hour check (if any part of booking is >= 18:00, charge peak)
    # This is a simplification.
    if court.peak_hours:
        try:
            peak_start_str, peak_end_str = court.peak_hours.split("-")
            peak_start = datetime.strptime(peak_start_str.strip(), "%H:%M").time()
            # If booking end > peak start AND booking start < peak end
            if end_time > peak_start:
                price_per_hour = float(court.price_peak)
        except Exception:
            pass # ignore parse error, fallback to regular
            
    total = Decimal(price_per_hour * duration_hours)
    return total

async def create_booking(db: AsyncSession, booking: BookingCreate, user_id: UUID):
    # 1. Check availability
    is_available, msg = await check_availability(
        db, booking.court_id, booking.booking_date, booking.start_time, booking.end_time
    )
    
    if not is_available:
        raise HTTPException(status_code=400, detail=msg)
        
    # 2. Calculate price
    total_price = await calculate_price(
        db, booking.court_id, booking.booking_type, booking.start_time, booking.end_time
    )
    
    # 3. Create booking with 15 mins lock
    expires = datetime.utcnow() + timedelta(minutes=15)
    
    db_booking = Booking(
        user_id=user_id,
        court_id=booking.court_id,
        booking_type=booking.booking_type,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        total_price=total_price,
        status=BookingStatusEnum.pending,
        expires_at=expires
    )
    
    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)
    
    return db_booking
