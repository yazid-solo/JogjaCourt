from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
import uuid
from fastapi import UploadFile, File
from app.utils.helpers import upload_image_to_supabase

from app.database import get_db
from app.models.venue import Venue
from app.models.court import Court
from app.schemas.venue import VenueCreate, VenueUpdate, VenueResponse, VenueDetailResponse
from app.schemas.court import CourtResponse
from app.utils.dependencies import require_super_admin, require_admin, get_optional_user, get_current_user
from app.models.user import RoleEnum

router = APIRouter(prefix="/venues", tags=["Venues"])

@router.get("", response_model=List[VenueResponse])
async def get_venues(area_id: UUID = None, db: AsyncSession = Depends(get_db), current_user = Depends(get_optional_user)):
    """Daftar GOR aktif. Jika dipanggil Admin, hanya tampilkan miliknya."""
    stmt = select(Venue)
    
    if current_user and current_user.role == RoleEnum.admin:
        # Regular admin sees their own venues (even if inactive, maybe? For now let's just show all theirs)
        stmt = stmt.where(Venue.owner_id == current_user.id)
    else:
        # Public / Super Admin sees active venues. Super Admin could see all, but let's keep it simple.
        stmt = stmt.where(Venue.is_active == True)

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

@router.post("", response_model=VenueResponse, dependencies=[Depends(require_admin)])
async def create_venue(venue: VenueCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Tambah GOR baru (Admin / Super Admin)."""
    db_venue = Venue(**venue.model_dump())
    
    if current_user.role == RoleEnum.admin:
        db_venue.owner_id = current_user.id
        
    db.add(db_venue)
    await db.commit()
    await db.refresh(db_venue)
    return db_venue

@router.post("/upload-image", dependencies=[Depends(require_admin)])
async def upload_venue_image(file: UploadFile = File(...)):
    """Upload gambar GOR ke Supabase Storage (Admin / Super Admin)."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")
        
    try:
        contents = await file.read()
        filename = f"venues/{uuid.uuid4()}_{file.filename}"
        
        # Menggunakan bucket payments sebagai default storage
        image_url = await upload_image_to_supabase(contents, filename, bucket_name="payments")
        return {"image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{venue_id}", response_model=VenueResponse, dependencies=[Depends(require_admin)])
async def update_venue(venue_id: UUID, venue: VenueUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Update data GOR (Admin / Super Admin)."""
    result = await db.execute(select(Venue).where(Venue.id == venue_id))
    db_venue = result.scalars().first()
    if not db_venue:
        raise HTTPException(status_code=404, detail="GOR tidak ditemukan")
        
    if current_user.role == RoleEnum.admin and db_venue.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Anda bukan pemilik GOR ini")

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
