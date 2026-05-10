from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.payment import PaymentMethodEnum, PaymentStatusEnum
from app.schemas.booking import BookingResponse
from app.schemas.user import UserResponse

class PaymentBase(BaseModel):
    booking_id: UUID
    amount: Decimal
    method: PaymentMethodEnum

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: UUID
    status: PaymentStatusEnum
    proof_image_url: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    confirmed_by: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)

class PaymentDetailResponse(PaymentResponse):
    booking: BookingResponse
    admin: Optional[UserResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class PaymentConfirmRequest(BaseModel):
    status: PaymentStatusEnum
    rejection_reason: Optional[str] = None
