import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class CourtTypeEnum(str, enum.Enum):
    single = "single"
    double = "double"
    mixed = "mixed"

class RentalTypeEnum(str, enum.Enum):
    hourly = "hourly"
    monthly = "monthly"
    both = "both"

class Court(Base):
    __tablename__ = "courts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    court_type = Column(Enum(CourtTypeEnum, name="court_type", create_type=False), nullable=False)
    
    rental_type = Column(Enum(RentalTypeEnum, name="rental_type", create_type=False), default=RentalTypeEnum.both, nullable=False)
    price_regular = Column(Numeric(10, 2), nullable=False) # Harga per jam
    price_peak = Column(Numeric(10, 2), nullable=False)    # Harga peak per jam
    price_monthly = Column(Numeric(10, 2), nullable=True)  # Harga sewa bulanan
    
    peak_hours = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    venue = relationship("Venue", back_populates="courts")
    bookings = relationship("Booking", back_populates="court")
    court_blocks = relationship("CourtBlock", back_populates="court", cascade="all, delete-orphan")
