from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.booking import Booking, BookingStatusEnum
from app.models.user import RoleEnum
from app.schemas.booking import BookingCreate, BookingResponse, BookingDetailResponse, BookingExtendRequest, BookingRecurringCreate, BookingUpdateAdmin

from app.utils.dependencies import get_current_user, require_admin
from app.services.booking_service import create_booking, cancel_booking_service, confirm_booking_service, complete_booking_service, extend_booking_service
from app.models.court import Court
from app.models.venue import Venue

router = APIRouter(prefix="/bookings", tags=["Bookings"])

from datetime import datetime
@router.get("", response_model=List[BookingDetailResponse])
async def get_bookings(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Daftar booking — customer hanya melihat milik sendiri, admin melihat semua miliknya."""
    stmt = select(Booking).options(
        selectinload(Booking.court).selectinload(Court.venue).selectinload(Venue.owner),
        selectinload(Booking.user)
    ).order_by(Booking.created_at.desc())
    if current_user.role == RoleEnum.customer:
        stmt = stmt.where(Booking.user_id == current_user.id)
    elif current_user.role == RoleEnum.admin:
        stmt = stmt.join(Court).join(Venue).where(Venue.owner_id == current_user.id)
    result = await db.execute(stmt)
    bookings = result.scalars().all()
    
    now = datetime.now()
    updated = False
    for b in bookings:
        if b.status == BookingStatusEnum.confirmed:
            # combine date and end_time
            booking_dt = datetime.combine(b.booking_date, b.end_time)
            if booking_dt < now:
                b.status = BookingStatusEnum.completed
                updated = True
                
    if updated:
        await db.commit()
        
    return bookings

@router.get("/{booking_id}", response_model=BookingDetailResponse)
async def get_booking(booking_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Detail satu booking."""
    result = await db.execute(
        select(Booking).options(
            selectinload(Booking.court).selectinload(Court.venue).selectinload(Venue.owner),
            selectinload(Booking.user)
        ).where(Booking.id == booking_id)
    )
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
        
    if current_user.role == RoleEnum.customer and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
        
    if current_user.role == RoleEnum.admin:
        court_res = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == booking.court_id))
        c = court_res.scalars().first()
        if not c or c.venue.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")
            
    return booking

@router.post("", response_model=BookingResponse)
async def make_booking(booking: BookingCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Buat booking baru (Customer)."""
    return await create_booking(db, booking, current_user.id)

@router.put("/{booking_id}/cancel")
async def cancel_booking(booking_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Batalkan booking yang belum dikonfirmasi."""
    return await cancel_booking_service(db, booking_id, current_user)

@router.put("/{booking_id}/confirm", dependencies=[Depends(require_admin)])
async def confirm_booking(booking_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Konfirmasi booking aktif (Admin)."""
    return await confirm_booking_service(db, booking_id, current_user)

@router.put("/{booking_id}/complete", dependencies=[Depends(require_admin)])
async def complete_booking(booking_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Tandai booking selesai (Admin)."""
    return await complete_booking_service(db, booking_id, current_user)

@router.post("/{booking_id}/extend", dependencies=[Depends(require_admin)])
async def extend_booking(booking_id: UUID, req: BookingExtendRequest, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Tambah durasi booking (Admin)."""
    return await extend_booking_service(db, booking_id, current_user, req.hours_to_add)



from datetime import timedelta
from app.models.user import User

@router.post("/recurring", response_model=List[BookingResponse], dependencies=[Depends(require_admin)])
async def create_recurring_booking(req: BookingRecurringCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Buat booking langganan bulanan/mingguan secara massal (Admin)."""
    # 1. Cari user
    res_user = await db.execute(select(User).where(User.email == req.user_email))
    user = res_user.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Email user tidak ditemukan. Pastikan pelanggan sudah terdaftar.")
        
    # 2. Validasi rentang tanggal
    delta = req.end_date - req.start_date
    if delta.days <= 0 or delta.days > 365:
        raise HTTPException(status_code=400, detail="Rentang tanggal tidak valid (maksimal 1 tahun).")
        
    # 3. Kumpulkan tanggal yang cocok dengan day_of_week
    target_dates = []
    curr_date = req.start_date
    while curr_date <= req.end_date:
        if curr_date.weekday() == req.day_of_week:
            target_dates.append(curr_date)
        curr_date += timedelta(days=1)
        
    if not target_dates:
        raise HTTPException(status_code=400, detail="Tidak ada hari yang cocok dalam rentang tanggal tersebut.")
        
    # 4. Cek ketersediaan seluruh tanggal
    for d in target_dates:
        is_avail, msg = await check_availability(db, req.court_id, d, req.start_time, req.end_time)
        if not is_avail:
            raise HTTPException(status_code=400, detail=f"Jadwal bentrok pada tanggal {d}: {msg}")
            
    # 5. Buat semua booking
    created_bookings = []
    
    # Hitung harga bulanan jika ada, atau gunakan harga reguler
    court_res = await db.execute(select(Court).where(Court.id == req.court_id))
    court = court_res.scalars().first()
    
    # Simple logic: calculate price per session
    for d in target_dates:
        price = await calculate_price(db, req.court_id, BookingTypeEnum.hourly, req.start_time, req.end_time)
        new_booking = Booking(
            user_id=user.id,
            court_id=req.court_id,
            booking_type=BookingTypeEnum.monthly,
            booking_date=d,
            start_time=req.start_time,
            end_time=req.end_time,
            total_price=price,
            status=BookingStatusEnum.confirmed # Admin bypass pending
        )
        db.add(new_booking)
        created_bookings.append(new_booking)
        
    await db.commit()
    for b in created_bookings:
        await db.refresh(b)
        
    return created_bookings

@router.put("/{booking_id}/admin", response_model=BookingResponse, dependencies=[Depends(require_admin)])
async def update_booking_admin(booking_id: UUID, req: BookingUpdateAdmin, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Mengedit harga atau status pesanan secara manual oleh Super Admin/Admin."""
    stmt = select(Booking).where(Booking.id == booking_id)
    res = await db.execute(stmt)
    booking = res.scalars().first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
        
    # Jika Admin mitra, pastikan booking itu miliknya
    if current_user.role == RoleEnum.admin:
        court_res = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == booking.court_id))
        c = court_res.scalars().first()
        if not c or c.venue.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")
            
    if req.status is not None:
        booking.status = req.status
    if req.total_price is not None:
        booking.total_price = req.total_price
        
    await db.commit()
    await db.refresh(booking)
    return booking
