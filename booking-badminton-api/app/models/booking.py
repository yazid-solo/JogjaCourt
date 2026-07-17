import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Boolean, DateTime, Date, Time, Numeric, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base

class BookingStatusEnum(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"
    expired = "expired"

class BookingTypeEnum(str, enum.Enum):
    hourly = "hourly"
    monthly = "monthly"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    court_id = Column(UUID(as_uuid=True), ForeignKey("courts.id", ondelete="CASCADE"), nullable=False)
    
    booking_type = Column(Enum(BookingTypeEnum, name="booking_type", create_type=False), default=BookingTypeEnum.hourly, nullable=False)
    booking_date = Column(Date, nullable=False) # Jika monthly, ini tanggal mulai bulan itu
    end_date = Column(Date, nullable=True) # Untuk monthly, ini tanggal berakhirnya (30 hari setelah booking_date)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    total_price = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(BookingStatusEnum, name="booking_status", create_type=False), default=BookingStatusEnum.pending, nullable=False)
    
    # Monthly session fields
    sessions = Column(JSONB, default=list, nullable=True)  # Array of session data for monthly bookings
    days_of_week = Column(JSONB, default=list, nullable=True) # [0, 1, 2] dimana 0=Senin, 6=Minggu
    is_full_access = Column(Boolean, default=True, nullable=False)  # True if all 3 sessions selected
    
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True) # 15 menit dari created_at jika pending

    # Relationships
    user = relationship("User", back_populates="bookings")
    court = relationship("Court", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
