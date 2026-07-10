from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class KycRequestCreate(BaseModel):
    email: EmailStr
    password: str
    nama_gor: str
    alamat_gor: str
    no_telp_gor: str
    nama_pemilik: str
    nik: str
    bank: str
    no_rek: str
    jml_lapangan: int
    harga: float
    jam_buka: str
    jam_tutup: str
    fasilitas: List[str]
    foto_gor: List[str] = []

class KycRequestResponse(BaseModel):
    id: UUID
    email: EmailStr
    nama_gor: str
    alamat_gor: str
    no_telp_gor: str
    nama_pemilik: str
    nik: str
    bank: str
    no_rek: str
    jml_lapangan: int
    harga: float
    jam_buka: str
    jam_tutup: str
    fasilitas: List[str]
    foto_gor: List[str] = []
    status: str
    reject_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class KycReject(BaseModel):
    reason: str
