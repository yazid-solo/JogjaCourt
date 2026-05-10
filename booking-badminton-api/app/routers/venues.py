from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.venue import Venue
from app.models.court import Court
from app.schemas.venue import VenueCreate, VenueUpdate, VenueResponse, VenueDetailResponse
from app.schemas.court import CourtResponse
from app.utils.dependencies import require_super_admin, require_admin

router = APIRouter(prefix="/venues", tags=["Venues"])

@router.get("", response_model=List[VenueResponse])
async def get_venues(area_id: UUID = None, db: AsyncSession = Depends(get_db)):
    """Daftar semua GOR aktif, opsional filter by area_id (publik)."""
    stmt = select(Venue).where(Venue.is_active == True)
    if area_id:
        stmt = stmt.where(Venue.area_id == area_id)
    stmt = stmt.order_by(Venue.name)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{venue_id}", response_model=VenueDetailResponse)
async def get_venue(venue_id: UUID, db: AsyncSession = Depends(get_db)):
    """Detail satu GOR beserta info daerahnya (publik)."""
    result = await db.execute(
        select(Venue).options(selectinload(Venue.area)).where(Venue.id == venue_id)
    )
    venue = result.scalars().first()
    if not venue:
        raise HTTPException(status_code=404, detail="GOR tidak ditemukan")
    return venue

@router.get("/{venue_id}/courts", response_model=List[CourtResponse])
async def get_courts_by_venue(venue_id: UUID, db: AsyncSession = Depends(get_db)):
    """Daftar lapangan aktif di suatu GOR (publik)."""
    result = await db.execute(
        select(Court).where(Court.venue_id == venue_id, Court.is_active == True).order_by(Court.name)
    )
    return result.scalars().all()

@router.post("", response_model=VenueResponse, dependencies=[Depends(require_super_admin)])
async def create_venue(venue: VenueCreate, db: AsyncSession = Depends(get_db)):
    """Tambah GOR baru (Super Admin)."""
    db_venue = Venue(**venue.model_dump())
    db.add(db_venue)
    await db.commit()
    await db.refresh(db_venue)
    return db_venue

@router.put("/{venue_id}", response_model=VenueResponse, dependencies=[Depends(require_admin)])
async def update_venue(venue_id: UUID, venue: VenueUpdate, db: AsyncSession = Depends(get_db)):
    """Update data GOR (Admin / Super Admin)."""
    result = await db.execute(select(Venue).where(Venue.id == venue_id))
    db_venue = result.scalars().first()
    if not db_venue:
        raise HTTPException(status_code=404, detail="GOR tidak ditemukan")
    for key, value in venue.model_dump(exclude_unset=True).items():
        setattr(db_venue, key, value)
    await db.commit()
    await db.refresh(db_venue)
    return db_venue

@router.delete("/{venue_id}", dependencies=[Depends(require_super_admin)])
async def delete_venue(venue_id: UUID, db: AsyncSession = Depends(get_db)):
    """Nonaktifkan GOR (soft delete, Super Admin)."""
    result = await db.execute(select(Venue).where(Venue.id == venue_id))
    db_venue = result.scalars().first()
    if not db_venue:
        raise HTTPException(status_code=404, detail="GOR tidak ditemukan")
    db_venue.is_active = False
    await db.commit()
    return {"message": "GOR berhasil dinonaktifkan"}
