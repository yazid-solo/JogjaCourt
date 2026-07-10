from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.payment import Payment, PaymentStatusEnum
from app.models.booking import Booking, BookingTypeEnum
from app.models.court import Court
from app.models.venue import Venue
from app.models.payout import Payout, PayoutStatusEnum
from app.models.notification import Notification
from app.models.system_setting import SystemSetting
from app.utils.dependencies import require_super_admin

def format_rupiah_manual(amount):
    return f"Rp {amount:,.0f}".replace(",", ".")

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

import httpx
import base64
import uuid
from app.config import settings

def normalize_bank_code(bank_name: str) -> str:
    """Menerjemahkan input nama bank dari Admin menjadi kode resmi Midtrans Iris."""
    if not bank_name:
        return ""
    name = bank_name.lower().strip()
    if "bca" in name: return "bca"
    if "mandiri" in name: return "mandiri"
    if "bri" in name: return "bri"
    if "bni" in name: return "bni"
    if "cimb" in name: return "cimb"
    if "permata" in name: return "permata"
    return name.replace(" ", "")

@router.post("/revenue-share/payout/{owner_id}", dependencies=[Depends(require_super_admin)])
async def create_payout(
    owner_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Proses pencairan dana untuk GOR tertentu via Midtrans Iris."""
    
    # 0. Ambil data Admin GOR (Rekening Bank)
    owner_res = await db.execute(select(User).where(User.id == owner_id))
    owner = owner_res.scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="Admin GOR tidak ditemukan.")
        
    if not owner.bank_name or not owner.bank_account_number or not owner.bank_account_name:
        raise HTTPException(
            status_code=400, 
            detail="Pencairan gagal. Admin GOR belum mengatur Rekening Bank lengkap di Pengaturan."
        )

    bank_code = normalize_bank_code(owner.bank_name)

    # 1. Cari semua payment milik owner ini yang belum dicairkan
    stmt = (
        select(Payment, Booking)
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Court, Booking.court_id == Court.id)
        .join(Venue, Court.venue_id == Venue.id)
        .where(
            Venue.owner_id == owner_id,
            Payment.status == PaymentStatusEnum.paid,
            Payment.payout_id == None
        )
    )
    
    res = await db.execute(stmt)
    rows = res.all()
    
    if not rows:
        raise HTTPException(status_code=400, detail="Tidak ada dana yang bisa dicairkan untuk Admin ini.")
        
    # Ambil fee dari DB
    setting_res = await db.execute(select(SystemSetting))
    settings_db = {s.key: s.value for s in setting_res.scalars().all()}
    monthly_fee_val = int(settings_db.get('platform_fee_monthly', 15000))
    hourly_fee_val = int(settings_db.get('platform_fee_hourly', 5000))

    total_gross = 0
    total_platform_fee = 0
    total_bookings = len(rows)
    
    for payment, booking in rows:
        amount = float(payment.amount)
        if booking.booking_type == BookingTypeEnum.monthly:
            fee = monthly_fee_val
        else:
            fee = hourly_fee_val
            
        if fee > amount:
            fee = amount
            
        total_gross += amount
        total_platform_fee += fee
        
    total_net = total_gross - total_platform_fee
    
    # 2. PANGGIL XENDIT API (REAL MODE JIKA ADA KUNCI)
    xendit_ref = ""
    xendit_status = "pending"

    if not settings.XENDIT_SECRET_KEY:
        raise HTTPException(
            status_code=500, 
            detail="Kunci rahasia Xendit (API Key) belum dikonfigurasi di server. Pencairan otomatis dibatalkan demi keamanan produksi."
        )

    xendit_url = "https://api.xendit.co/disbursements"
    auth_string = base64.b64encode(f"{settings.XENDIT_SECRET_KEY}:".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_string}",
        "Content-Type": "application/json"
    }
    
    external_id = f"payout_{uuid.uuid4().hex[:8]}"
    
    payload = {
        "external_id": external_id,
        "bank_code": bank_code.upper(),
        "account_holder_name": owner.bank_account_name,
        "account_number": owner.bank_account_number,
        "description": f"Pencairan Pendapatan JogjaCourt - {total_bookings} Trx",
        "amount": int(total_net)
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(xendit_url, json=payload, headers=headers, timeout=15.0)
            if response.status_code in [201, 200]:
                resp_data = response.json()
                xendit_ref = resp_data.get("id", "") # Xendit returns 'id'
                xendit_status = resp_data.get("status", "PENDING")
            else:
                err_msg = response.text
                print("XENDIT ERROR:", err_msg)
                raise HTTPException(
                    status_code=400, 
                    detail=f"Transaksi ditolak oleh gerbang pembayaran (Xendit). Pastikan saldo platform mencukupi dan data rekening tujuan valid. Respon: {err_msg[:100]}"
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail="Gagal terhubung ke Server Xendit. Pastikan server memiliki akses internet yang stabil.")

    # 3. Buat record Payout
    payout = Payout(
        owner_id=owner_id,
        amount=total_net,
        platform_fee=total_platform_fee,
        gross_revenue=total_gross,
        total_bookings=total_bookings,
        status=PayoutStatusEnum.completed.value,
        xendit_disbursement_id=xendit_ref,
        xendit_status=xendit_status,
        processed_by=current_user.id
    )
    
    db.add(payout)
    await db.flush() # Flush to get payout.id
    
    # 4. Update semua payments dengan payout_id ini
    for payment, _ in rows:
        payment.payout_id = payout.id
        
    # 5. Buat Notifikasi untuk Admin GOR
    formatted_amount = format_rupiah_manual(total_net)
    notif = Notification(
        user_id=owner_id,
        title="Dana Berhasil Dicairkan! 💸",
        message=f"Pencairan otomatis sebesar {formatted_amount} sedang dikirim ke rekening {owner.bank_name.upper()} Anda via Xendit.",
        target_role="admin",
        related_entity_type="payout",
        related_entity_id=payout.id
    )
    db.add(notif)
        
    await db.commit()
    await db.refresh(payout)
    
    return {"message": "Pencairan otomatis berhasil diproses.", "payout_id": payout.id, "amount_transferred": total_net, "xendit_status": xendit_status}
