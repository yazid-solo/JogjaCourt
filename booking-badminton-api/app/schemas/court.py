from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import date, time
from decimal import Decimal
from app.models.court import CourtTypeEnum, RentalTypeEnum
from app.schemas.venue import VenueResponse

class CourtBase(BaseModel):
    name: str
    court_type: CourtTypeEnum = CourtTypeEnum.double
    rental_type: RentalTypeEnum = RentalTypeEnum.both
    price_regular: Decimal
    price_peak: Decimal
    price_monthly: Optional[Decimal] = None
    peak_hours: Optional[str] = None
    venue_id: UUID

class CourtCreate(CourtBase):
    pass

class CourtUpdate(BaseModel):
    name: Optional[str] = None
    court_type: Optional[CourtTypeEnum] = None
    rental_type: Optional[RentalTypeEnum] = None
    price_regular: Optional[Decimal] = None
    price_peak: Optional[Decimal] = None
    price_monthly: Optional[Decimal] = None
    peak_hours: Optional[str] = None
    venue_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class CourtResponse(CourtBase):
    id: UUID
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

class CourtDetailResponse(CourtResponse):
    venue: VenueResponse
    
    model_config = ConfigDict(from_attributes=True)

class TimeSlot(BaseModel):
    start_time: time
    end_time: time
    is_available: bool
    price: Decimal
    is_peak: bool

class CourtAvailability(BaseModel):
    date: date
    slots: list[TimeSlot]
