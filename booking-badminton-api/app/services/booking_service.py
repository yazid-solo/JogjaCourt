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
from app.models.notification import Notification
from app.models.user import RoleEnum
from app.schemas.booking import BookingCreate
from sqlalchemy.orm import selectinload

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
        
    if booking_type == BookingTypeEnum.monthly:
        # Sewa bulanan = flat fee per bulan, bukan dikalikan durasi jam
        if not court.price_monthly:
            raise HTTPException(status_code=400, detail="Sewa bulanan tidak tersedia untuk lapangan ini. Admin belum mengatur harga bulanan.")
        return Decimal(str(court.price_monthly))
        
    # Hitung harga per jam (hourly)
    end_dt = datetime.combine(datetime.min, end_time)
    start_dt = datetime.combine(datetime.min, start_time)
    
    if end_time == time(23, 59):
        end_dt += timedelta(minutes=1)
        
    duration_hours = (end_dt - start_dt).seconds / 3600
    
    price_per_hour = float(court.price_regular)
    
    # Cek peak hour: jika booking melewati jam peak, gunakan harga peak
    if court.peak_hours:
        try:
            peak_start_str, peak_end_str = court.peak_hours.split("-")
            peak_start = datetime.strptime(peak_start_str.strip(), "%H:%M").time()
            if end_time > peak_start:
                price_per_hour = float(court.price_peak)
        except Exception:
            pass # fallback ke harga regular
            
    total = Decimal(str(round(price_per_hour * duration_hours, 2)))
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
    await db.flush() # Flush to get booking ID for notifications
    
    # Label tipe booking untuk notifikasi
    booking_type_label = "Sewa Bulanan (Member)" if booking.booking_type == BookingTypeEnum.monthly else "Per Jam"
    
    # Notifikasi untuk User
    db.add(Notification(
        user_id=user_id,
        title="Booking Berhasil Dibuat",
        message=f"Booking {booking_type_label} Anda untuk tanggal {booking.booking_date} berhasil dibuat. Harap selesaikan pembayaran dalam 15 menit.",
        target_role="customer",
        related_entity_type="booking",
        related_entity_id=db_booking.id
    ))
    
    # Dapatkan owner lapangan (admin)
    result_court = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == booking.court_id))
    court_data = result_court.scalars().first()
    if court_data and court_data.venue and court_data.venue.owner_id:
        db.add(Notification(
            user_id=court_data.venue.owner_id,
            title="🎉 Booking Baru Diterima",
            message=f"Ada booking {booking_type_label} baru untuk {court_data.name} mulai {booking.booking_date}. Segera konfirmasi setelah pembayaran masuk.",
            target_role="admin",
            related_entity_type="booking",
            related_entity_id=db_booking.id
        ))
    
    await db.commit()
    await db.refresh(db_booking)
    
    return db_booking

async def cancel_booking_service(db: AsyncSession, booking_id: UUID, current_user):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    if current_user.role == RoleEnum.customer and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    if booking.status not in [BookingStatusEnum.pending, BookingStatusEnum.confirmed]:
        raise HTTPException(status_code=400, detail="Booking ini tidak bisa dibatalkan")
        
    booking.status = BookingStatusEnum.cancelled
    
    # Notifikasi
    if current_user.role == RoleEnum.customer:
        # User membatalkan, beri tahu admin (owner venue)
        result_court = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == booking.court_id))
        court_data = result_court.scalars().first()
        if court_data and court_data.venue and court_data.venue.owner_id:
            db.add(Notification(
                user_id=court_data.venue.owner_id,
                title="Booking Dibatalkan",
                message=f"Booking untuk {court_data.name} dibatalkan oleh user.",
                target_role="admin",
                related_entity_type="booking",
                related_entity_id=booking.id
            ))
    elif current_user.role in [RoleEnum.admin, RoleEnum.super_admin]:
        # Admin membatalkan, beri tahu user
        db.add(Notification(
            user_id=booking.user_id,
            title="Booking Dibatalkan",
            message=f"Booking Anda untuk tanggal {booking.booking_date} telah dibatalkan oleh admin.",
            target_role="customer",
            related_entity_type="booking",
            related_entity_id=booking.id
        ))

    await db.commit()
    return {"message": "Booking berhasil dibatalkan"}

async def confirm_booking_service(db: AsyncSession, booking_id: UUID, current_user):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
        
    if current_user.role == RoleEnum.admin:
        court_res = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == booking.court_id))
        c = court_res.scalars().first()
        if not c or c.venue.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")

    if booking.status != BookingStatusEnum.pending:
        raise HTTPException(status_code=400, detail="Hanya booking berstatus pending yang bisa dikonfirmasi")
    booking.status = BookingStatusEnum.confirmed
    
    # Notifikasi untuk User
    db.add(Notification(
        user_id=booking.user_id,
        title="Booking Dikonfirmasi",
        message=f"Booking Anda untuk tanggal {booking.booking_date} telah dikonfirmasi.",
        target_role="customer",
        related_entity_type="booking",
        related_entity_id=booking.id
    ))
    
    await db.commit()
    return {"message": "Booking berhasil dikonfirmasi"}

async def complete_booking_service(db: AsyncSession, booking_id: UUID, current_user):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
        
    if current_user.role == RoleEnum.admin:
        court_res = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == booking.court_id))
        c = court_res.scalars().first()
        if not c or c.venue.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")

    if booking.status != BookingStatusEnum.confirmed:
        raise HTTPException(status_code=400, detail="Hanya booking berstatus confirmed yang bisa diselesaikan")
    booking.status = BookingStatusEnum.completed
    await db.commit()
    return {"message": "Booking ditandai selesai"}

async def extend_booking_service(db: AsyncSession, booking_id: UUID, current_user, hours_to_add: int = 1):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
        
    if current_user.role == RoleEnum.admin:
        court_res = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == booking.court_id))
        c = court_res.scalars().first()
        if not c or c.venue.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")

    if booking.status not in [BookingStatusEnum.confirmed, BookingStatusEnum.completed]:
        raise HTTPException(status_code=400, detail="Hanya booking aktif yang bisa di-extend")
        
    # Check availability for the next `hours_to_add`
    new_end_time = (datetime.combine(datetime.min, booking.end_time) + timedelta(hours=hours_to_add)).time()
    if new_end_time < booking.end_time: # Overflow to next day not supported yet
        raise HTTPException(status_code=400, detail="Tidak bisa melebihi jam 24:00")
        
    is_available, msg = await check_availability(
        db, booking.court_id, booking.booking_date, booking.end_time, new_end_time
    )
    if not is_available:
        raise HTTPException(status_code=400, detail=msg)
        
    # Calculate additional price
    additional_price = await calculate_price(
        db, booking.court_id, booking.booking_type, booking.end_time, new_end_time
    )
    
    # Update booking
    booking.end_time = new_end_time
    booking.total_price = float(booking.total_price) + float(additional_price)
    
    # Set back to confirmed if it was completed by the announcer earlier
    if booking.status == BookingStatusEnum.completed:
        booking.status = BookingStatusEnum.confirmed
        
    await db.commit()
    return {"message": f"Waktu berhasil ditambah {hours_to_add} jam", "new_end_time": new_end_time.strftime("%H:%M")}

