from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import date, time, datetime
from decimal import Decimal
from app.models.booking import BookingStatusEnum, BookingTypeEnum
from app.schemas.court import CourtResponse
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
    court: CourtResponse
    user: UserResponse
    
    model_config = ConfigDict(from_attributes=True)
