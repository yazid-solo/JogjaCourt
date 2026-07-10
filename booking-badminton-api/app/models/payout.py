import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class PayoutStatusEnum(str, enum.Enum):
    pending = "pending"
    completed = "completed"

class Payout(Base):
    __tablename__ = "payouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    amount = Column(Numeric(10, 2), nullable=False) # Net income
    platform_fee = Column(Numeric(10, 2), nullable=False)
    gross_revenue = Column(Numeric(10, 2), nullable=False)
    total_bookings = Column(Integer, nullable=False, default=0)
    
    status = Column(String(50), default=PayoutStatusEnum.completed.value, nullable=False)
    
    xendit_disbursement_id = Column(String(100), nullable=True)
    xendit_status = Column(String(50), nullable=True)
    
    processed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    processed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    processor = relationship("User", foreign_keys=[processed_by])
    payments = relationship("Payment", back_populates="payout")
