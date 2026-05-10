from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.area import Area
from app.models.venue import Venue
from app.schemas.area import AreaCreate, AreaUpdate, AreaResponse
from app.schemas.venue import VenueResponse
from app.utils.dependencies import require_super_admin

router = APIRouter(prefix="/areas", tags=["Areas"])

@router.get("", response_model=List[AreaResponse])
async def get_areas(db: AsyncSession = Depends(get_db)):
    """Daftar semua daerah aktif (publik)."""
    result = await db.execute(select(Area).where(Area.is_active == True).order_by(Area.name))
    return result.scalars().all()

@router.get("/{area_id}", response_model=AreaResponse)
async def get_area(area_id: UUID, db: AsyncSession = Depends(get_db)):
    """Detail satu daerah (publik)."""
    result = await db.execute(select(Area).where(Area.id == area_id))
    area = result.scalars().first()
    if not area:
        raise HTTPException(status_code=404, detail="Daerah tidak ditemukan")
    return area

@router.get("/{area_id}/venues", response_model=List[VenueResponse])
async def get_venues_by_area(area_id: UUID, db: AsyncSession = Depends(get_db)):
    """Daftar GOR aktif di suatu daerah (publik)."""
    result = await db.execute(
        select(Venue).where(Venue.area_id == area_id, Venue.is_active == True).order_by(Venue.name)
    )
    return result.scalars().all()

@router.post("", response_model=AreaResponse, dependencies=[Depends(require_super_admin)])
async def create_area(area: AreaCreate, db: AsyncSession = Depends(get_db)):
    """Tambah daerah baru (Super Admin)."""
    db_area = Area(**area.model_dump())
    db.add(db_area)
    await db.commit()
    await db.refresh(db_area)
    return db_area

@router.put("/{area_id}", response_model=AreaResponse, dependencies=[Depends(require_super_admin)])
async def update_area(area_id: UUID, area: AreaUpdate, db: AsyncSession = Depends(get_db)):
    """Update data daerah (Super Admin)."""
    result = await db.execute(select(Area).where(Area.id == area_id))
    db_area = result.scalars().first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Daerah tidak ditemukan")
    for key, value in area.model_dump(exclude_unset=True).items():
        setattr(db_area, key, value)
    await db.commit()
    await db.refresh(db_area)
    return db_area

@router.delete("/{area_id}", dependencies=[Depends(require_super_admin)])
async def delete_area(area_id: UUID, db: AsyncSession = Depends(get_db)):
    """Nonaktifkan daerah (soft delete, Super Admin)."""
    result = await db.execute(select(Area).where(Area.id == area_id))
    db_area = result.scalars().first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Daerah tidak ditemukan")
    db_area.is_active = False
    await db.commit()
    return {"message": "Daerah berhasil dinonaktifkan"}
