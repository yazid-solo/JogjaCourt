from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
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
    # Optional fields for monthly sessions
    sessions: Optional[List[Dict[str, Any]]] = None
    days_of_week: Optional[List[int]] = None
    is_full_access: Optional[bool] = True

class BookingResponse(BookingBase):
    id: UUID
    user_id: UUID
    total_price: Decimal
    status: BookingStatusEnum
    sessions: Optional[List[Dict[str, Any]]] = None
    days_of_week: Optional[List[int]] = None
    is_full_access: bool = True
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

class BookingPaginatedResponse(BaseModel):
    total_count: int
    total_pages: int
    current_page: int
    limit: int
    data: List[BookingDetailResponse]
