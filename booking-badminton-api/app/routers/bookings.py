from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.booking import Booking, BookingStatusEnum
from app.models.user import RoleEnum
from app.schemas.booking import BookingCreate, BookingResponse, BookingDetailResponse
from app.utils.dependencies import get_current_user, require_admin
from app.services.booking_service import create_booking
from app.models.court import Court
from app.models.venue import Venue
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.get("", response_model=List[BookingDetailResponse])
async def get_bookings(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Daftar booking — customer hanya melihat milik sendiri, admin melihat semua miliknya."""
    stmt = select(Booking).options(selectinload(Booking.court), selectinload(Booking.user)).order_by(Booking.created_at.desc())
    if current_user.role == RoleEnum.customer:
        stmt = stmt.where(Booking.user_id == current_user.id)
    elif current_user.role == RoleEnum.admin:
        stmt = stmt.join(Court).join(Venue).where(Venue.owner_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{booking_id}", response_model=BookingDetailResponse)
async def get_booking(booking_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Detail satu booking."""
    result = await db.execute(
        select(Booking).options(selectinload(Booking.court), selectinload(Booking.user))
        .where(Booking.id == booking_id)
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
    new_booking = await create_booking(db, booking, current_user.id)
    
    # Notifikasi untuk User
    db.add(Notification(
        user_id=current_user.id,
        title="Booking Berhasil Dibuat",
        message=f"Booking Anda untuk tanggal {booking.booking_date} berhasil dibuat. Harap selesaikan pembayaran.",
        related_entity_type="booking",
        related_entity_id=new_booking.id
    ))
    
    # Dapatkan owner lapangan (admin)
    result_court = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == booking.court_id))
    court_data = result_court.scalars().first()
    if court_data and court_data.venue and court_data.venue.owner_id:
        db.add(Notification(
            user_id=court_data.venue.owner_id,
            title="Booking Baru Diterima",
            message=f"Ada booking baru untuk {court_data.name} pada {booking.booking_date}.",
            related_entity_type="booking",
            related_entity_id=new_booking.id
        ))
    
    await db.commit()
    return new_booking

@router.put("/{booking_id}/cancel")
async def cancel_booking(booking_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Batalkan booking yang belum dikonfirmasi."""
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
                related_entity_type="booking",
                related_entity_id=booking.id
            ))
    elif current_user.role in [RoleEnum.admin, RoleEnum.super_admin]:
        # Admin membatalkan, beri tahu user
        db.add(Notification(
            user_id=booking.user_id,
            title="Booking Dibatalkan",
            message=f"Booking Anda untuk tanggal {booking.booking_date} telah dibatalkan oleh admin.",
            related_entity_type="booking",
            related_entity_id=booking.id
        ))

    await db.commit()
    return {"message": "Booking berhasil dibatalkan"}

@router.put("/{booking_id}/confirm", dependencies=[Depends(require_admin)])
async def confirm_booking(booking_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Konfirmasi booking aktif (Admin)."""
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
        related_entity_type="booking",
        related_entity_id=booking.id
    ))
    
    await db.commit()
    return {"message": "Booking berhasil dikonfirmasi"}

@router.put("/{booking_id}/complete", dependencies=[Depends(require_admin)])
async def complete_booking(booking_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Tandai booking selesai (Admin)."""
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
