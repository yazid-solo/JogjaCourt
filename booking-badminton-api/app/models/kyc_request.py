import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base

class KycRequest(Base):
    __tablename__ = "kyc_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    
    nama_gor = Column(String(150), nullable=False)
    alamat_gor = Column(Text, nullable=False)
    no_telp_gor = Column(String(20), nullable=False)
    
    nama_pemilik = Column(String(100), nullable=False)
    nik = Column(String(20), nullable=False)
    bank = Column(String(50), nullable=False)
    no_rek = Column(String(50), nullable=False)
    
    jml_lapangan = Column(Integer, nullable=False)
    harga = Column(Float, nullable=False)
    jam_buka = Column(String(10), nullable=False)
    jam_tutup = Column(String(10), nullable=False)
    
    fasilitas = Column(JSONB, default=list, server_default='[]')
    foto_gor = Column(JSONB, default=list, server_default='[]')
    
    # 'pending', 'approved', 'rejected'
    status = Column(String(20), default="pending", nullable=False)
    reject_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
