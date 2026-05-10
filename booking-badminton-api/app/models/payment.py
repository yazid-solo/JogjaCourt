import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class PaymentMethodEnum(str, enum.Enum):
    transfer = "transfer"
    cash = "cash"
    qris = "qris"

class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    confirmed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(Enum(PaymentMethodEnum, name="payment_method", create_type=False), nullable=False)
    status = Column(Enum(PaymentStatusEnum, name="payment_status", create_type=False), default=PaymentStatusEnum.pending, nullable=False)
    
    proof_image_url = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True) # Tambahan: alasan penolakan
    
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="payment")
    admin = relationship("User", back_populates="confirmed_payments")
