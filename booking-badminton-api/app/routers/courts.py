from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
from datetime import date, time, datetime
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.court import Court
from app.models.court_block import CourtBlock
from app.models.venue import Venue
from app.models.user import RoleEnum
from app.schemas.court import CourtCreate, CourtUpdate, CourtResponse, CourtDetailResponse, CourtAvailability, TimeSlot
from app.utils.dependencies import require_admin, require_super_admin, get_current_user, get_optional_user
from app.services.booking_service import check_availability, calculate_price
from app.models.booking import BookingTypeEnum, Booking, BookingStatusEnum

router = APIRouter(prefix="/courts", tags=["Courts"])

# ─── Schemas lokal untuk Court Blocks ─────────────────────────────────────────

class CourtBlockCreate(BaseModel):
    block_date: date
    start_time: time
    end_time: time
    reason: Optional[str] = None

class CourtBlockResponse(BaseModel):
    id: UUID
    court_id: UUID
    block_date: date
    start_time: time
    end_time: time
    reason: Optional[str] = None

    class Config:
        from_attributes = True

# ─── Courts ───────────────────────────────────────────────────────────────────

@router.get("", response_model=List[CourtResponse])
async def get_courts(venue_id: UUID = None, db: AsyncSession = Depends(get_db), current_user = Depends(get_optional_user)):
    """Daftar lapangan aktif. Admin hanya melihat miliknya."""
    stmt = select(Court).where(Court.is_active == True)
    
    if current_user and current_user.role == RoleEnum.admin:
        stmt = stmt.join(Venue).where(Venue.owner_id == current_user.id)

    if venue_id:
        stmt = stmt.where(Court.venue_id == venue_id)
        
    stmt = stmt.order_by(Court.name).limit(200)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{court_id}", response_model=CourtDetailResponse)
async def get_court(court_id: UUID, db: AsyncSession = Depends(get_db)):
    """Detail satu lapangan (publik)."""
    result = await db.execute(
        select(Court).options(selectinload(Court.venue).selectinload(Venue.owner)).where(Court.id == court_id)
    )
    court = result.scalars().first()
    if not court:
        raise HTTPException(status_code=404, detail="Lapangan tidak ditemukan")
    return court

@router.get("/{court_id}/availability", response_model=CourtAvailability)
async def check_court_availability(court_id: UUID, date_req: date, db: AsyncSession = Depends(get_db)):
    """Cek slot tersedia per tanggal (publik) dengan Bulk Query (O(1) query)."""
    court_result = await db.execute(select(Court).where(Court.id == court_id))
    court = court_result.scalars().first()
    if not court:
        raise HTTPException(status_code=404, detail="Lapangan tidak ditemukan")

    # 1. Bulk ambil CourtBlocks
    blocks_res = await db.execute(select(CourtBlock).where(
        CourtBlock.court_id == court_id,
        CourtBlock.block_date == date_req
    ))
    blocks = blocks_res.scalars().all()
    
    # 2. Bulk ambil Hourly Bookings
    hourly_res = await db.execute(select(Booking).where(
        Booking.court_id == court_id,
        Booking.booking_date == date_req,
        Booking.booking_type == BookingTypeEnum.hourly,
        Booking.status.in_([BookingStatusEnum.confirmed, BookingStatusEnum.pending])
    ))
    hourly_bookings = hourly_res.scalars().all()
    
    # 3. Bulk ambil Monthly Bookings (aktif pada tanggal ini)
    monthly_res = await db.execute(select(Booking).where(
        Booking.court_id == court_id,
        Booking.booking_type == BookingTypeEnum.monthly,
        Booking.status.in_([BookingStatusEnum.confirmed, BookingStatusEnum.pending]),
        Booking.booking_date <= date_req,
        Booking.end_date >= date_req
    ))
    monthly_bookings = monthly_res.scalars().all()

    current_time = datetime.utcnow()
    
    def is_overlap(s1, e1, s2, e2):
        return s1 < e2 and e1 > s2

    slots = []
    # Loop dari jam 06:00 sampai 24:00 (18 jam)
    for h in range(6, 24):
        s_time = time(h, 0)
        e_time = time(23, 59) if h == 23 else time(h + 1, 0)
        is_avail = True
        
        # Cek Block
        for blk in blocks:
            if is_overlap(blk.start_time, blk.end_time, s_time, e_time):
                is_avail = False; break
        
        # Cek Hourly
        if is_avail:
            for b in hourly_bookings:
                if b.status == BookingStatusEnum.pending and b.expires_at:
                    exp = b.expires_at.replace(tzinfo=None) if b.expires_at.tzinfo else b.expires_at
                    if exp < current_time: continue
                if is_overlap(b.start_time, b.end_time, s_time, e_time):
                    is_avail = False; break
                    
        # Cek Monthly
        if is_avail:
            for mb in monthly_bookings:
                if mb.status == BookingStatusEnum.pending and mb.expires_at:
                    exp = mb.expires_at.replace(tzinfo=None) if mb.expires_at.tzinfo else mb.expires_at
                    if exp < current_time: continue
                
                if mb.days_of_week and date_req.weekday() not in mb.days_of_week:
                    continue
                    
                if mb.is_full_access:
                    is_avail = False; break
                    
                if mb.sessions:
                    for s in mb.sessions:
                        tr = s.get("time_range")
                        if tr:
                            try:
                                s_str, e_str = tr.split(" - ")
                                ms_time = datetime.strptime(s_str.strip(), "%H:%M").time()
                                me_time = datetime.strptime(e_str.strip(), "%H:%M").time()
                                if is_overlap(s_time, e_time, ms_time, me_time):
                                    is_avail = False
                                    break
                            except Exception:
                                pass
                    if not is_avail: break

        # Hitung harga (simulasi dari calculate_price tanpa hit DB)
        price = court.price_regular
        if court.peak_hours:
            try:
                peak_start_str, peak_end_str = court.peak_hours.split("-")
                peak_start = datetime.strptime(peak_start_str.strip(), "%H:%M").time()
                if e_time > peak_start:
                    price = court.price_peak
            except: pass
            
        slots.append(TimeSlot(
            start_time=s_time,
            end_time=e_time,
            is_available=is_avail,
            price=price,
            is_peak=(float(price) == float(court.price_peak))
        ))
        
    return CourtAvailability(date=date_req, slots=slots)


@router.post("", response_model=CourtResponse, dependencies=[Depends(require_admin)])
async def create_court(court: CourtCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Tambah lapangan baru (Admin / Super Admin)."""
    if current_user.role == RoleEnum.admin:
        venue_result = await db.execute(select(Venue).where(Venue.id == court.venue_id))
        venue = venue_result.scalars().first()
        if not venue or venue.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Anda bukan pemilik GOR ini")

    db_court = Court(**court.model_dump())
    db.add(db_court)
    await db.commit()
    await db.refresh(db_court)
    return db_court

@router.put("/{court_id}", response_model=CourtResponse, dependencies=[Depends(require_admin)])
async def update_court(court_id: UUID, court: CourtUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Update data lapangan (Admin)."""
    result = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == court_id))
    db_court = result.scalars().first()
    if not db_court:
        raise HTTPException(status_code=404, detail="Lapangan tidak ditemukan")
        
    if current_user.role == RoleEnum.admin and db_court.venue.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Anda tidak berhak mengubah lapangan ini")
    for key, value in court.model_dump(exclude_unset=True).items():
        setattr(db_court, key, value)
    await db.commit()
    await db.refresh(db_court)
    return db_court

@router.delete("/{court_id}", dependencies=[Depends(require_admin)])
async def delete_court(court_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Nonaktifkan lapangan (soft delete, Admin)."""
    result = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == court_id))
    db_court = result.scalars().first()
    if not db_court:
        raise HTTPException(status_code=404, detail="Lapangan tidak ditemukan")
        
    if current_user.role == RoleEnum.admin and db_court.venue.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Anda tidak berhak menghapus lapangan ini")
    db_court.is_active = False
    await db.commit()
    return {"message": "Lapangan berhasil dinonaktifkan"}

# ─── Court Blocks ─────────────────────────────────────────────────────────────

@router.get("/{court_id}/blocks", response_model=List[CourtBlockResponse], dependencies=[Depends(require_admin)])
async def get_court_blocks(court_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Daftar blokir lapangan (Admin)."""
    if current_user.role == RoleEnum.admin:
        court = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == court_id))
        c = court.scalars().first()
        if not c or c.venue.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")
            
    result = await db.execute(
        select(CourtBlock)
        .where(CourtBlock.court_id == court_id)
        .order_by(CourtBlock.block_date, CourtBlock.start_time)
        .limit(200)
    )
    return result.scalars().all()

@router.post("/{court_id}/blocks", response_model=CourtBlockResponse, dependencies=[Depends(require_admin)])
async def create_court_block(court_id: UUID, block: CourtBlockCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Blokir lapangan untuk maintenance/event (Admin)."""
    court_result = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == court_id))
    court = court_result.scalars().first()
    if not court:
        raise HTTPException(status_code=404, detail="Lapangan tidak ditemukan")
        
    if current_user.role == RoleEnum.admin and court.venue.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    db_block = CourtBlock(
        court_id=court_id,
        blocked_by=current_user.id,
        block_date=block.block_date,
        start_time=block.start_time,
        end_time=block.end_time,
        reason=block.reason
    )
    db.add(db_block)
    await db.commit()
    await db.refresh(db_block)
    return db_block

@router.delete("/{court_id}/blocks/{block_id}", dependencies=[Depends(require_admin)])
async def delete_court_block(court_id: UUID, block_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Hapus blokir lapangan (Admin)."""
    if current_user.role == RoleEnum.admin:
        court_res = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == court_id))
        c = court_res.scalars().first()
        if not c or c.venue.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")

    result = await db.execute(
        select(CourtBlock).where(CourtBlock.id == block_id, CourtBlock.court_id == court_id)
    )
    db_block = result.scalars().first()
    if not db_block:
        raise HTTPException(status_code=404, detail="Blokir tidak ditemukan")
    await db.delete(db_block)
    await db.commit()
    return {"message": "Blokir lapangan berhasil dihapus"}
