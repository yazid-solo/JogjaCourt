from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import date, time, datetime
from decimal import Decimal
from app.models.booking import BookingStatusEnum, BookingTypeEnum
from app.schemas.court import CourtResponse, CourtDetailResponse
from app.schemas.user import UserResponse

class BookingBase(BaseModel):
    court_id: UUID
    booking_type: BookingTypeEnum = BookingTypeEnum.hourly
    booking_date: date
    start_time: time
    end_time: time

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    id: UUID
    user_id: UUID
    total_price: Decimal
    status: BookingStatusEnum
    created_at: datetime
    expires_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class BookingDetailResponse(BookingResponse):
    court: CourtDetailResponse
    user: UserResponse
    
    model_config = ConfigDict(from_attributes=True)

class BookingExtendRequest(BaseModel):
    hours_to_add: int = 1


class BookingRecurringCreate(BaseModel):
    user_email: str
    court_id: UUID
    start_date: date
    end_date: date
    day_of_week: int # 0=Monday, 6=Sunday
    start_time: time
    end_time: time

class BookingUpdateAdmin(BaseModel):
    status: Optional[BookingStatusEnum] = None
    total_price: Optional[Decimal] = None

