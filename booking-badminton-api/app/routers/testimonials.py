from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.testimonial import Testimonial
from app.models.user import User, RoleEnum
from app.models.venue import Venue
from app.schemas.testimonial import TestimonialCreate, TestimonialOut, TestimonialReply
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/testimonials",
    tags=["Testimonials"],
)

def format_testimonial(testim: Testimonial) -> dict:
    return {
        "id": testim.id,
        "user_id": testim.user_id,
        "user_name": testim.user.name if testim.user else "Anonim",
        "user_profile_image": testim.user.profile_image if testim.user else None,
        "rating": testim.rating,
        "content": testim.content,
        "is_approved": testim.is_approved,
        "admin_reply": testim.admin_reply,
        "created_at": testim.created_at,
        "venue_id": testim.venue_id,
        "venue_name": testim.venue.name if testim.venue else None
    }

@router.post("/", response_model=TestimonialOut, status_code=status.HTTP_201_CREATED)
async def create_testimonial(
    data: TestimonialCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if user already submitted recently? For simplicity, just allow.
    new_testimonial = Testimonial(
        user_id=current_user.id,
        venue_id=data.venue_id if hasattr(data, 'venue_id') else None,
        rating=data.rating,
        content=data.content,
        is_approved=True # Auto-approve so it shows immediately
    )
    db.add(new_testimonial)
    await db.commit()
    await db.refresh(new_testimonial)
    
    # Load user and venue relationships for response
    stmt = (
        select(Testimonial)
        .options(selectinload(Testimonial.user))
        .options(selectinload(Testimonial.venue))
        .where(Testimonial.id == new_testimonial.id)
    )
    res = await db.execute(stmt)
    testim = res.scalars().first()
    
    return format_testimonial(testim)

@router.get("/public", response_model=List[TestimonialOut])
async def get_public_testimonials(db: AsyncSession = Depends(get_db)):
    # General platform testimonials (no venue)
    stmt = (
        select(Testimonial)
        .options(selectinload(Testimonial.user))
        .options(selectinload(Testimonial.venue))
        .where(Testimonial.is_approved == True)
        .where(Testimonial.venue_id == None)
        .order_by(desc(Testimonial.created_at))
        .limit(20)
    )
    result = await db.execute(stmt)
    testimonials = result.scalars().all()
    return [format_testimonial(t) for t in testimonials]

@router.get("/venue/{venue_id}", response_model=List[TestimonialOut])
async def get_venue_testimonials(venue_id: UUID, db: AsyncSession = Depends(get_db)):
    # Testimonials specific to a venue
    stmt = (
        select(Testimonial)
        .options(selectinload(Testimonial.user))
        .options(selectinload(Testimonial.venue))
        .where(Testimonial.is_approved == True)
        .where(Testimonial.venue_id == venue_id)
        .order_by(desc(Testimonial.created_at))
        .limit(50)
    )
    result = await db.execute(stmt)
    testimonials = result.scalars().all()
    return [format_testimonial(t) for t in testimonials]

@router.get("/admin", response_model=List[TestimonialOut])
async def get_admin_testimonials(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Akses ditolak")
        
    stmt = (
        select(Testimonial)
        .options(selectinload(Testimonial.user))
        .options(selectinload(Testimonial.venue))
        .order_by(Testimonial.is_approved.asc(), desc(Testimonial.created_at))
    )

    if current_user.role == RoleEnum.admin:
        # Get admin's venues
        venue_stmt = select(Venue).where(Venue.owner_id == current_user.id)
        venue_res = await db.execute(venue_stmt)
        admin_venues = venue_res.scalars().all()
        venue_ids = [v.id for v in admin_venues]
        stmt = stmt.where(Testimonial.venue_id.in_(venue_ids))

    result = await db.execute(stmt)
    testimonials = result.scalars().all()
    return [format_testimonial(t) for t in testimonials]

@router.put("/admin/{id}/approve", response_model=TestimonialOut)
async def approve_testimonial(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != RoleEnum.super_admin:
        raise HTTPException(status_code=403, detail="Hanya Super Admin yang dapat menyetujui")
        
    stmt = (
        select(Testimonial)
        .options(selectinload(Testimonial.user))
        .options(selectinload(Testimonial.venue))
        .where(Testimonial.id == id)
    )
    result = await db.execute(stmt)
    testim = result.scalars().first()
    
    if not testim:
        raise HTTPException(status_code=404, detail="Testimoni tidak ditemukan")
        
    testim.is_approved = True
    await db.commit()
    await db.refresh(testim)
    return format_testimonial(testim)

@router.put("/admin/{id}/reply", response_model=TestimonialOut)
async def reply_testimonial(
    id: UUID,
    data: TestimonialReply,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in [RoleEnum.super_admin, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Hanya Admin yang dapat membalas")
        
    stmt = (
        select(Testimonial)
        .options(selectinload(Testimonial.user))
        .options(selectinload(Testimonial.venue))
        .where(Testimonial.id == id)
    )
    result = await db.execute(stmt)
    testim = result.scalars().first()
    
    if not testim:
        raise HTTPException(status_code=404, detail="Testimoni tidak ditemukan")

    if current_user.role == RoleEnum.admin:
        # Check if this testimonial belongs to a venue owned by this admin
        venue_stmt = select(Venue).where(Venue.owner_id == current_user.id, Venue.id == testim.venue_id)
        venue_res = await db.execute(venue_stmt)
        if not venue_res.scalars().first():
            raise HTTPException(status_code=403, detail="Anda tidak berhak membalas ulasan ini")

    testim.admin_reply = data.reply
    # Optional: also auto-approve if they reply
    testim.is_approved = True
    await db.commit()
    await db.refresh(testim)
    return format_testimonial(testim)

@router.delete("/admin/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testimonial(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != RoleEnum.super_admin:
        raise HTTPException(status_code=403, detail="Hanya Super Admin yang dapat menghapus")
        
    stmt = select(Testimonial).where(Testimonial.id == id)
    result = await db.execute(stmt)
    testim = result.scalars().first()
    
    if not testim:
        raise HTTPException(status_code=404, detail="Testimoni tidak ditemukan")
        
    await db.delete(testim)
    await db.commit()
