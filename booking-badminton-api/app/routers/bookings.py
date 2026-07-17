from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.booking import Booking, BookingStatusEnum
from app.models.user import RoleEnum
from app.schemas.booking import BookingCreate, BookingResponse, BookingDetailResponse, BookingExtendRequest, BookingRecurringCreate, BookingUpdateAdmin, BookingPaginatedResponse

from app.utils.dependencies import get_current_user, require_admin
from app.services.booking_service import create_booking, cancel_booking_service, confirm_booking_service, complete_booking_service, extend_booking_service
from app.services.session_validator import validate_hourly_booking_against_membership, get_user_membership_info
from app.models.court import Court
from app.models.venue import Venue
from app.services.notification_service import send_whatsapp_message, send_email

router = APIRouter(prefix="/bookings", tags=["Bookings"])

from sqlalchemy import func
from datetime import datetime

@router.get("", response_model=BookingPaginatedResponse)
async def get_bookings(
    page: int = 1,
    size: int = 50,
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Daftar booking — customer hanya melihat milik sendiri, admin melihat semua miliknya."""
    # Count total query
    count_stmt = select(func.count(Booking.id))
    
    # Base query for data
    stmt = select(Booking).options(
        selectinload(Booking.court).selectinload(Court.venue).selectinload(Venue.owner),
        selectinload(Booking.user)
    ).order_by(Booking.created_at.desc())

    if current_user.role == RoleEnum.customer:
        count_stmt = count_stmt.where(Booking.user_id == current_user.id)
        stmt = stmt.where(Booking.user_id == current_user.id)
    elif current_user.role == RoleEnum.admin:
        count_stmt = count_stmt.join(Court).join(Venue).where(Venue.owner_id == current_user.id)
        stmt = stmt.join(Court).join(Venue).where(Venue.owner_id == current_user.id)

    # Execute count
    total_count_res = await db.execute(count_stmt)
    total_count = total_count_res.scalar() or 0

    # Apply pagination
    offset = (page - 1) * size
    stmt = stmt.offset(offset).limit(size)

    # Execute data
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
        
    total_pages = (total_count + size - 1) // size
    if total_pages == 0:
        total_pages = 1

    return {
        "total_count": total_count,
        "total_pages": total_pages,
        "current_page": page,
        "limit": size,
        "data": bookings
    }

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
async def make_booking(
    booking: BookingCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Buat booking baru (Customer)."""
    new_booking = await create_booking(db, booking, current_user.id)
    
    # Ambil detail court & venue
    court_res = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == new_booking.court_id))
    court = court_res.scalars().first()
    
    venue_name = court.venue.name if court and court.venue else "Sistem Booking Lapangan"
    court_name = court.name if court else "Lapangan"
    
    # Schedule notifications
    wa_message = (
        f"Halo {current_user.name}!\n\n"
        f"Terima kasih telah melakukan pemesanan di {venue_name} - {court_name}.\n"
        f"Booking ID Anda: {str(new_booking.id)[:8].upper()}\n"
        f"Jadwal: {new_booking.booking_date.strftime('%d %b %Y')} ({new_booking.start_time.strftime('%H:%M')} - {new_booking.end_time.strftime('%H:%M')})\n"
        f"Total: Rp {new_booking.total_price:,.0f}\n\n"
        f"Silakan segera lakukan pembayaran melalui Xendit di aplikasi untuk mengamankan jadwal Anda."
    )
    email_body = wa_message.replace("\n", "<br>")
    
    background_tasks.add_task(send_whatsapp_message, current_user.phone, wa_message)
    background_tasks.add_task(send_email, current_user.email, f"Tagihan Booking {venue_name}", email_body)
    
    return new_booking

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


@router.get("/membership/check/{court_id}")
async def check_membership(
    court_id: UUID,
    booking_date: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Cek apakah user memiliki membership aktif untuk lapangan tertentu pada tanggal tertentu.
    Endpoint ini digunakan frontend untuk menampilkan info membership user.
    """
    try:
        from datetime import datetime
        date_obj = datetime.fromisoformat(booking_date).date()
    except Exception:
        raise HTTPException(status_code=400, detail="Format tanggal tidak valid (gunakan ISO format: YYYY-MM-DD)")
    
    membership_info = await get_user_membership_info(db, current_user.id, court_id, date_obj)
    
    if membership_info:
        return {
            "has_membership": True,
            "membership_info": membership_info
        }
    else:
        return {
            "has_membership": False,
            "membership_info": None
        }


@router.post("/validate-hourly")
async def validate_hourly_booking_endpoint(
    court_id: UUID,
    booking_date: str,
    start_time: str,
    end_time: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Validasi apakah user dengan membership aktif boleh melakukan booking hourly.
    Digunakan oleh frontend sebelum membuat booking.
    """
    try:
        from datetime import datetime, time
        date_obj = datetime.fromisoformat(booking_date).date()
        start_time_obj = datetime.strptime(start_time, "%H:%M:%S").time()
        end_time_obj = datetime.strptime(end_time, "%H:%M:%S").time()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Format tanggal/waktu tidak valid: {str(e)}")
    
    is_allowed, message, membership_info = await validate_hourly_booking_against_membership(
        db, current_user.id, court_id, date_obj, start_time_obj, end_time_obj
    )
    
    return {
        "is_allowed": is_allowed,
        "message": message,
        "membership_info": membership_info
    }
