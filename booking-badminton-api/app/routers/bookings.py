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

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.get("", response_model=List[BookingDetailResponse])
async def get_bookings(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Daftar booking — customer hanya melihat milik sendiri, admin melihat semua."""
    stmt = select(Booking).options(selectinload(Booking.court), selectinload(Booking.user)).order_by(Booking.created_at.desc())
    if current_user.role == RoleEnum.customer:
        stmt = stmt.where(Booking.user_id == current_user.id)
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
    # Customer hanya boleh akses booking miliknya
    if current_user.role == RoleEnum.customer and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    return booking

@router.post("", response_model=BookingResponse)
async def make_booking(booking: BookingCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Buat booking baru (Customer)."""
    return await create_booking(db, booking, current_user.id)

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
    await db.commit()
    return {"message": "Booking berhasil dibatalkan"}

@router.put("/{booking_id}/confirm", dependencies=[Depends(require_admin)])
async def confirm_booking(booking_id: UUID, db: AsyncSession = Depends(get_db)):
    """Konfirmasi booking aktif (Admin)."""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    if booking.status != BookingStatusEnum.pending:
        raise HTTPException(status_code=400, detail="Hanya booking berstatus pending yang bisa dikonfirmasi")
    booking.status = BookingStatusEnum.confirmed
    await db.commit()
    return {"message": "Booking berhasil dikonfirmasi"}

@router.put("/{booking_id}/complete", dependencies=[Depends(require_admin)])
async def complete_booking(booking_id: UUID, db: AsyncSession = Depends(get_db)):
    """Tandai booking selesai (Admin)."""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    if booking.status != BookingStatusEnum.confirmed:
        raise HTTPException(status_code=400, detail="Hanya booking berstatus confirmed yang bisa diselesaikan")
    booking.status = BookingStatusEnum.completed
    await db.commit()
    return {"message": "Booking ditandai selesai"}
