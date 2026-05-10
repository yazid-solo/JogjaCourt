from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.schemas.area import AreaResponse

class VenueBase(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    maps_url: Optional[str] = None
    image_url: Optional[str] = None
    area_id: UUID

class VenueCreate(VenueBase):
    pass

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    maps_url: Optional[str] = None
    image_url: Optional[str] = None
    area_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class VenueResponse(VenueBase):
    id: UUID
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class VenueDetailResponse(VenueResponse):
    area: AreaResponse
    
    model_config = ConfigDict(from_attributes=True)
