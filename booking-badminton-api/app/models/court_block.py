import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Date, Time, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class CourtBlock(Base):
    __tablename__ = "court_blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    court_id = Column(UUID(as_uuid=True), ForeignKey("courts.id", ondelete="CASCADE"), nullable=False)
    blocked_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    block_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    reason = Column(Text, nullable=True) # e.g., "Maintenance", "Tournament"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    court = relationship("Court", back_populates="court_blocks")
    admin = relationship("User", back_populates="court_blocks")
