from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, text
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

async def check_availability(
    db: AsyncSession, 
    court_id: UUID, 
    booking_date, 
    start_time: time, 
    end_time: time,
    booking_type: BookingTypeEnum = BookingTypeEnum.hourly,
    sessions: list = None,
    is_full_access: bool = False,
    days_of_week: list = None
):
    current_time = datetime.utcnow()
    
    from datetime import date
    if isinstance(booking_date, str):
        b_date = datetime.strptime(booking_date, "%Y-%m-%d").date()
    elif isinstance(booking_date, datetime):
        b_date = booking_date.date()
    else:
        b_date = booking_date
    
    requested_intervals = []
    if booking_type == BookingTypeEnum.monthly:
        if is_full_access:
            requested_intervals.append((time(8, 0), time(23, 0))) 
        elif sessions:
            for s in sessions:
                tr = s.get("time_range")
                if tr:
                    try:
                        s_str, e_str = tr.split(" - ")
                        requested_intervals.append((
                            datetime.strptime(s_str.strip(), "%H:%M").time(),
                            datetime.strptime(e_str.strip(), "%H:%M").time()
                        ))
                    except Exception:
                        pass
        if not requested_intervals:
            requested_intervals.append((start_time, end_time))
    else:
        requested_intervals.append((start_time, end_time))

    def is_overlap(s1, e1, s2, e2):
        return s1 < e2 and e1 > s2

    if booking_type == BookingTypeEnum.hourly:
        stmt_blocks = select(CourtBlock).where(
            CourtBlock.court_id == court_id,
            CourtBlock.block_date == b_date,
            CourtBlock.start_time < end_time,
            CourtBlock.end_time > start_time
        )
        result_blocks = await db.execute(stmt_blocks)
        if result_blocks.scalars().first():
            return False, "Lapangan ditutup/diblokir pada jadwal ini."
            
        stmt_hourly = select(Booking).where(
            Booking.court_id == court_id,
            Booking.booking_date == b_date,
            Booking.booking_type == BookingTypeEnum.hourly,
            Booking.status.in_([BookingStatusEnum.confirmed, BookingStatusEnum.pending]),
            Booking.start_time < end_time,
            Booking.end_time > start_time
        )
        result_hourly = await db.execute(stmt_hourly)
        conflicting_hourly = result_hourly.scalars().all()
        for b in conflicting_hourly:
            if b.status == BookingStatusEnum.pending and b.expires_at:
                exp = b.expires_at.replace(tzinfo=None) if b.expires_at.tzinfo else b.expires_at
                if exp < current_time: continue
                return False, "Jadwal ini sedang dalam proses pemesanan oleh orang lain (locked)."
            return False, "Jadwal sudah di-booking."
            
        stmt_monthly = select(Booking).where(
            Booking.court_id == court_id,
            Booking.booking_type == BookingTypeEnum.monthly,
            Booking.status.in_([BookingStatusEnum.confirmed, BookingStatusEnum.pending]),
            Booking.booking_date <= b_date,
            Booking.end_date >= b_date
        )
        result_monthly = await db.execute(stmt_monthly)
        monthly_bookings = result_monthly.scalars().all()
        
        for mb in monthly_bookings:
            if mb.status == BookingStatusEnum.pending and mb.expires_at:
                exp = mb.expires_at.replace(tzinfo=None) if mb.expires_at.tzinfo else mb.expires_at
                if exp < current_time: continue
                
            # Cek jika hari booking harian ini masuk dalam hari booking bulanan
            if mb.days_of_week and b_date.weekday() not in mb.days_of_week:
                continue # Tidak tabrakan karena beda hari
                
            if mb.is_full_access:
                return False, "Jadwal ini sudah di-booking penuh secara bulanan."
            if mb.sessions:
                for s in mb.sessions:
                    tr = s.get("time_range")
                    if tr:
                        try:
                            s_str, e_str = tr.split(" - ")
                            s_time = datetime.strptime(s_str.strip(), "%H:%M").time()
                            e_time = datetime.strptime(e_str.strip(), "%H:%M").time()
                            if is_overlap(start_time, end_time, s_time, e_time):
                                return False, f"Jadwal ini bertabrakan dengan member bulanan ({s.get('session_name')})."
                        except Exception:
                            pass

    else:
        end_date_monthly = b_date + timedelta(days=30)
        
        stmt_monthly = select(Booking).where(
            Booking.court_id == court_id,
            Booking.booking_type == BookingTypeEnum.monthly,
            Booking.status.in_([BookingStatusEnum.confirmed, BookingStatusEnum.pending]),
            Booking.booking_date <= end_date_monthly,
            Booking.end_date >= b_date
        )
        result_monthly = await db.execute(stmt_monthly)
        monthly_bookings = result_monthly.scalars().all()
        
        for mb in monthly_bookings:
            if mb.status == BookingStatusEnum.pending and mb.expires_at:
                exp = mb.expires_at.replace(tzinfo=None) if mb.expires_at.tzinfo else mb.expires_at
                if exp < current_time: continue
                
            # Cek apakah ada irisan hari antara kedua booking bulanan
            has_day_overlap = False
            if mb.days_of_week and days_of_week:
                has_day_overlap = any(d in mb.days_of_week for d in days_of_week)
            else:
                has_day_overlap = True # Jika salah satu tidak menspesifikasikan hari (dianggap tiap hari)
                
            if not has_day_overlap:
                continue
            
            if mb.is_full_access or is_full_access:
                return False, "Sudah ada booking bulanan yang aktif/tabrakan di bulan ini pada hari yang sama."
            
            if mb.sessions and sessions:
                for s1 in mb.sessions:
                    for s2 in sessions:
                        if s1.get('session_id') == s2.get('session_id'):
                            return False, f"Sesi bulanan {s2.get('session_name')} sudah di-booking oleh member lain pada hari yang sama."

        stmt_hourly = select(Booking).where(
            Booking.court_id == court_id,
            Booking.booking_type == BookingTypeEnum.hourly,
            Booking.status.in_([BookingStatusEnum.confirmed, BookingStatusEnum.pending]),
            Booking.booking_date >= b_date,
            Booking.booking_date <= end_date_monthly
        )
        result_hourly = await db.execute(stmt_hourly)
        conflicting_hourly = result_hourly.scalars().all()
        
        for b in conflicting_hourly:
            if b.status == BookingStatusEnum.pending and b.expires_at:
                exp = b.expires_at.replace(tzinfo=None) if b.expires_at.tzinfo else b.expires_at
                if exp < current_time: continue
                
            # Cek jika hari booking harian ini tidak masuk dalam pilihan hari member bulanan
            if days_of_week and b.booking_date.weekday() not in days_of_week:
                continue
            
            for r_s, r_e in requested_intervals:
                if is_overlap(b.start_time, b.end_time, r_s, r_e):
                    return False, f"Tidak bisa menyewa bulanan karena ada jadwal harian yang sudah di-booking pada tanggal {b.booking_date.strftime('%d-%m-%Y')} jam {b.start_time.strftime('%H:%M')}-{b.end_time.strftime('%H:%M')}."

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
    # Handle monthly sessions data
    sessions_data = None
    is_full_access = True
    days_of_week = None
    
    if booking.booking_type == BookingTypeEnum.monthly and booking.sessions:
        sessions_data = booking.sessions
        is_full_access = booking.is_full_access if booking.is_full_access is not None else (len(sessions_data) == 3)
        days_of_week = booking.days_of_week

    # ═══════════════════════════════════════════════════════════
    # ROW LOCKING: Kunci baris court ini di database selama proses.
    # Jika ada 2 user memesan lapangan yang sama di waktu bersamaan,
    # request ke-2 akan MENUNGGU sampai request ke-1 selesai.
    # Ini mencegah double booking secara total.
    # ═══════════════════════════════════════════════════════════
    lock_result = await db.execute(
        select(Court).where(Court.id == booking.court_id).with_for_update()
    )
    locked_court = lock_result.scalars().first()
    if not locked_court:
        raise HTTPException(status_code=404, detail="Lapangan tidak ditemukan.")

    # 1. Check availability (setelah lock, data sudah konsisten)
    is_available, msg = await check_availability(
        db, booking.court_id, booking.booking_date, booking.start_time, booking.end_time,
        booking_type=booking.booking_type,
        sessions=sessions_data,
        is_full_access=is_full_access,
        days_of_week=days_of_week
    )
    
    if not is_available:
        raise HTTPException(status_code=400, detail=msg)
        
    # 2. Calculate price
    total_price = await calculate_price(
        db, booking.court_id, booking.booking_type, booking.start_time, booking.end_time
    )
    
    # 3. Create booking with 15 mins lock
    expires = datetime.utcnow() + timedelta(minutes=15)
    
    if booking.booking_type == BookingTypeEnum.monthly:
        end_date = booking.booking_date + timedelta(days=30)
    else:
        end_date = booking.booking_date
    
    db_booking = Booking(
        user_id=user_id,
        court_id=booking.court_id,
        booking_type=booking.booking_type,
        booking_date=booking.booking_date,
        end_date=end_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        total_price=total_price,
        status=BookingStatusEnum.pending,
        expires_at=expires,
        sessions=sessions_data,  # Automatically save sessions
        days_of_week=days_of_week, # Save days
        is_full_access=is_full_access  # Automatically save full access flag
    )
    
    db.add(db_booking)
    await db.flush() # Flush to get booking ID for notifications
    
    # Label tipe booking untuk notifikasi
    if booking.booking_type == BookingTypeEnum.monthly:
        if is_full_access:
            booking_type_label = "Sewa Bulanan (Full Access)"
        else:
            session_count = len(sessions_data) if sessions_data else 0
            booking_type_label = f"Sewa Bulanan ({session_count} Sesi)"
    else:
        booking_type_label = "Per Jam"
    
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

