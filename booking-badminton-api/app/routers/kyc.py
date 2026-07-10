from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.kyc_request import KycRequest
from app.models.user import User, RoleEnum
from app.models.venue import Venue
from app.models.court import Court
from app.schemas.kyc import KycRequestCreate, KycRequestResponse, KycReject
from app.utils.dependencies import get_current_user
from app.utils.jwt import get_password_hash

router = APIRouter(prefix="/kyc-requests", tags=["KYC"])

@router.post("", response_model=KycRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_kyc_request(req: KycRequestCreate, db: AsyncSession = Depends(get_db)):
    """Submit a new KYC verification request (Public)."""
    # Check if email is already used in KycRequests or Users
    existing_user_query = await db.execute(select(User).filter(User.email == req.email))
    if existing_user_query.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email sudah terdaftar sebagai pengguna.")
        
    existing_kyc_query = await db.execute(select(KycRequest).filter(KycRequest.email == req.email))
    if existing_kyc_query.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email ini sudah memiliki pengajuan KYC yang sedang diproses.")

    import os
    import base64
    import uuid

    saved_foto_paths = []
    
    if req.foto_gor:
        upload_dir = "app/static/uploads/kyc"
        os.makedirs(upload_dir, exist_ok=True)
        
        for foto_b64 in req.foto_gor:
            try:
                # Format base64 dari frontend: "data:image/png;base64,iVBORw0KGgo..."
                if "," in foto_b64:
                    header, encoded = foto_b64.split(",", 1)
                else:
                    encoded = foto_b64
                
                # Coba decode base64
                file_data = base64.b64decode(encoded)
                filename = f"{uuid.uuid4().hex}.png"
                file_path = os.path.join(upload_dir, filename)
                
                with open(file_path, "wb") as f:
                    f.write(file_data)
                
                # Simpan URL relatif yang bisa diakses via static route
                saved_foto_paths.append(f"/uploads/kyc/{filename}")
            except Exception as e:
                print(f"Gagal menyimpan foto KYC: {e}")

    kyc_req = KycRequest(
        email=req.email,
        password_hash=get_password_hash(req.password),
        nama_gor=req.nama_gor,
        alamat_gor=req.alamat_gor,
        no_telp_gor=req.no_telp_gor,
        nama_pemilik=req.nama_pemilik,
        nik=req.nik,
        bank=req.bank,
        no_rek=req.no_rek,
        jml_lapangan=req.jml_lapangan,
        harga=req.harga,
        jam_buka=req.jam_buka,
        jam_tutup=req.jam_tutup,
        fasilitas=req.fasilitas,
        foto_gor=saved_foto_paths,
        status="pending"
    )
    db.add(kyc_req)
    
    # Create user immediately as player so they can login while waiting
    new_user = User(
        email=req.email,
        password_hash=get_password_hash(req.password),
        name=req.nama_pemilik,
        phone=req.no_telp_gor,
        role=RoleEnum.customer,
        is_active=True
    )
    db.add(new_user)
    await db.flush() # flush to get new_user.id
    
    # Notifikasi ke Super Admin
    from app.models.notification import Notification
    super_admins_result = await db.execute(select(User).filter(User.role == RoleEnum.super_admin))
    super_admins = super_admins_result.scalars().all()
    for sa in super_admins:
        notif = Notification(
            user_id=sa.id,
            title="Pengajuan Mitra GOR Baru",
            message=f"{req.nama_pemilik} telah mengajukan pendaftaran untuk {req.nama_gor}.",
            target_role=RoleEnum.super_admin,
            related_entity_type="kyc",
            related_entity_id=kyc_req.id
        )
        db.add(notif)
    
    await db.commit()
    await db.refresh(kyc_req)
    return kyc_req

@router.get("", response_model=List[KycRequestResponse])
async def list_kyc_requests(
    status: str = "pending", 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """List KYC requests (Super Admin only)."""
    if current_user.role != RoleEnum.super_admin:
        raise HTTPException(status_code=403, detail="Hanya Super Admin yang dapat melihat data ini.")
        
    result = await db.execute(select(KycRequest).filter(KycRequest.status == status))
    return result.scalars().all()

@router.post("/{kyc_id}/approve")
async def approve_kyc_request(
    kyc_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve a KYC request and create the User, Venue, and Courts."""
    if current_user.role != RoleEnum.super_admin:
        raise HTTPException(status_code=403, detail="Akses ditolak.")
        
    result = await db.execute(select(KycRequest).filter(KycRequest.id == kyc_id))
    kyc_req = result.scalar_one_or_none()
    
    if not kyc_req:
        raise HTTPException(status_code=404, detail="Data KYC tidak ditemukan.")
    if kyc_req.status != "pending":
        raise HTTPException(status_code=400, detail=f"KYC ini sudah berstatus {kyc_req.status}")

    # 1. Update User to Admin (User was created as player during submit)
    user = await db.execute(select(User).filter(User.email == kyc_req.email))
    user = user.scalar_one_or_none()
    
    if user:
        user.role = RoleEnum.admin
    else:
        # Fallback if user somehow doesn't exist
        user = User(
            email=kyc_req.email,
            password_hash=kyc_req.password_hash,
            name=kyc_req.nama_pemilik,
            phone=kyc_req.no_telp_gor,
            role=RoleEnum.admin,
            is_active=True
        )
        db.add(user)
    
    await db.flush() # flush to get user ID if new
    
    # 2. Get default Area (assuming an area exists, or handle accordingly)
    from app.models.area import Area
    area_result = await db.execute(select(Area).limit(1))
    area = area_result.scalar_one_or_none()
    if not area:
        # Create a dummy area if none exist
        area = Area(name="Umum")
        db.add(area)
        await db.flush()
        
    # 3. Create Venue
    new_venue = Venue(
        owner_id=user.id,
        area_id=area.id,
        name=kyc_req.nama_gor,
        address=kyc_req.alamat_gor,
        phone=kyc_req.no_telp_gor,
        is_active=True,
        facilities=kyc_req.fasilitas,
        description=f"Bank: {kyc_req.bank}, No. Rek: {kyc_req.no_rek}, NIK: {kyc_req.nik}, Operasional: {kyc_req.jam_buka}-{kyc_req.jam_tutup}"
    )
    db.add(new_venue)
    await db.flush()
    
    # 4. Create Courts
    for i in range(kyc_req.jml_lapangan):
        new_court = Court(
            venue_id=new_venue.id,
            name=f"Lapangan {i+1}",
            court_type="double",
            rental_type="both",
            price_regular=kyc_req.harga,
            price_peak=kyc_req.harga
        )
        db.add(new_court)

    # 5. Update KYC status
    kyc_req.status = "approved"
    
    # 6. Notifikasi ke Customer/Admin
    from app.models.notification import Notification
    notif = Notification(
        user_id=user.id,
        title="Pendaftaran Mitra Disetujui",
        message=f"Selamat! Pendaftaran GOR {kyc_req.nama_gor} telah disetujui. Sekarang Anda memiliki akses ke Dashboard Admin.",
        target_role=RoleEnum.admin,
        related_entity_type="kyc",
        related_entity_id=kyc_req.id
    )
    db.add(notif)
    
    await db.commit()
    return {"message": "Pengajuan berhasil disetujui, akun mitra dan GOR telah dibuat."}

@router.post("/{kyc_id}/reject")
async def reject_kyc_request(
    kyc_id: UUID,
    payload: KycReject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a KYC request."""
    if current_user.role != RoleEnum.super_admin:
        raise HTTPException(status_code=403, detail="Akses ditolak.")
        
    result = await db.execute(select(KycRequest).filter(KycRequest.id == kyc_id))
    kyc_req = result.scalar_one_or_none()
    
    if not kyc_req:
        raise HTTPException(status_code=404, detail="Data KYC tidak ditemukan.")
    if kyc_req.status != "pending":
        raise HTTPException(status_code=400, detail=f"KYC ini sudah berstatus {kyc_req.status}")

    kyc_req.status = "rejected"
    kyc_req.reject_reason = payload.reason
    
    # Notifikasi ke Customer
    from app.models.notification import Notification
    user_query = await db.execute(select(User).filter(User.email == kyc_req.email))
    user = user_query.scalar_one_or_none()
    if user:
        notif = Notification(
            user_id=user.id,
            title="Pendaftaran Mitra Ditolak",
            message=f"Maaf, pendaftaran GOR {kyc_req.nama_gor} ditolak. Alasan: {payload.reason}",
            target_role=RoleEnum.customer,
            related_entity_type="kyc",
            related_entity_id=kyc_req.id
        )
        db.add(notif)
    
    await db.commit()
    return {"message": f"Pengajuan ditolak. Alasan: {payload.reason}"}
