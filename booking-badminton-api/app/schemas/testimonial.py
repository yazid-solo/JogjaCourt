from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class TestimonialCreate(BaseModel):
    venue_id: Optional[UUID] = None
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    content: str = Field(..., min_length=5, max_length=1000, description="Testimonial text")

class TestimonialOut(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_profile_image: Optional[str] = None
    rating: int
    content: str
    is_approved: bool
    admin_reply: Optional[str] = None
    created_at: datetime
    venue_id: Optional[UUID] = None
    venue_name: Optional[str] = None

    class Config:
        orm_mode = True

class TestimonialReply(BaseModel):
    reply: str = Field(..., max_length=1000, description="Balasan dari Admin")
