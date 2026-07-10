import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class RoleEnum(str, enum.Enum):
    customer = "customer"
    admin = "admin"
    super_admin = "super_admin"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(Text, nullable=True) # Nullable for Google Login
    role = Column(Enum(RoleEnum, name="user_role", create_type=False), nullable=False, default=RoleEnum.customer)
    profile_image = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    mitra_status = Column(String(50), nullable=True, default=None)
    mitra_gor_name = Column(String(255), nullable=True, default=None)
    mitra_gor_address = Column(Text, nullable=True, default=None)
    
    # Modern Auth Fields
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    is_email_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True, index=True)
    reset_password_token = Column(String(255), nullable=True, index=True)
    reset_password_expires = Column(DateTime, nullable=True)

    # Bank Info (Untuk Payout)
    bank_name = Column(String(100), nullable=True)
    bank_account_number = Column(String(100), nullable=True)
    bank_account_name = Column(String(150), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    venues = relationship("Venue", back_populates="owner", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    push_subscriptions = relationship("PushSubscription", back_populates="user", cascade="all, delete-orphan")
    confirmed_payments = relationship("Payment", back_populates="admin")
    court_blocks = relationship("CourtBlock", back_populates="admin")
