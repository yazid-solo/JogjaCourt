import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base

class Venue(Base):
    __tablename__ = "venues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    area_id = Column(UUID(as_uuid=True), ForeignKey("areas.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    address = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    maps_url = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    facilities = Column(JSONB, default=list, server_default='[]')
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="venues")
    area = relationship("Area", back_populates="venues")
    courts = relationship("Court", back_populates="venue", cascade="all, delete-orphan")
