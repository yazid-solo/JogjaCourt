from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.schemas.area import AreaResponse
from app.schemas.user import UserResponse

class VenueBase(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    description: Optional[str] = None
    maps_url: Optional[str] = None
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_id: Optional[UUID] = None
    facilities: Optional[list[str]] = []

class VenueCreate(VenueBase):
    pass

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    maps_url: Optional[str] = None
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    facilities: Optional[list[str]] = None

class VenueResponse(VenueBase):
    id: UUID
    owner_id: Optional[UUID] = None
    owner: Optional[UserResponse] = None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class VenueDetailResponse(VenueResponse):
    area: Optional[AreaResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

from typing import List
class VenuePaginatedResponse(BaseModel):
    total_count: int
    total_pages: int
    current_page: int
    limit: int
    data: List[VenueDetailResponse]
