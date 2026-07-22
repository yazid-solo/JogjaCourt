from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from fastapi import Request
import httpx
import base64
import hashlib
from datetime import datetime

from app.config import settings

from app.database import get_db
from app.models.payment import Payment, PaymentStatusEnum, PaymentMethodEnum
from app.models.booking import Booking, BookingStatusEnum, BookingTypeEnum
from app.models.user import RoleEnum
from app.schemas.payment import PaymentResponse, PaymentDetailResponse
from app.utils.dependencies import get_current_user, require_admin
from app.services.payment_service import confirm_payment, process_upload_proof
from app.models.court import Court
from app.models.venue import Venue
from app.models.notification import Notification
from app.services.notification_service import send_whatsapp_message, send_email
from sqlalchemy import update

router = APIRouter(prefix="/payments", tags=["Payments"])

class RejectRequest(BaseModel):
    rejection_reason: Optional[str] = None

@router.get("", response_model=List[PaymentDetailResponse])
async def get_payments(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Daftar pembayaran — customer hanya melihat milik sendiri."""
    stmt = select(Payment).options(
        selectinload(Payment.booking).selectinload(Booking.user),
        selectinload(Payment.booking).selectinload(Booking.court).selectinload(Court.venue).selectinload(Venue.owner),
        selectinload(Payment.admin)
    ).order_by(Payment.created_at.desc())

    if current_user.role == RoleEnum.customer:
        stmt = stmt.join(Booking).where(Booking.user_id == current_user.id)
    elif current_user.role == RoleEnum.admin:
        stmt = stmt.join(Booking).join(Court).join(Venue).where(Venue.owner_id == current_user.id)

    stmt = stmt.limit(200)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/{booking_id}/upload-proof", response_model=PaymentResponse)
async def upload_payment_proof(
    booking_id: UUID,
    method: PaymentMethodEnum = Form(...),
    amount: float = Form(...),
    file: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload bukti pembayaran (Customer)."""
    return await process_upload_proof(db, booking_id, current_user.id, method, amount, file)

@router.put("/{payment_id}/confirm", response_model=PaymentResponse, dependencies=[Depends(require_admin)])
async def verify_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Konfirmasi pembayaran valid (Admin)."""
    if current_user.role == RoleEnum.admin:
        result = await db.execute(select(Payment).options(selectinload(Payment.booking).selectinload(Booking.court).selectinload(Court.venue)).where(Payment.id == payment_id))
        payment = result.scalars().first()
        if not payment or payment.booking.court.venue.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")
            
    return await confirm_payment(db, payment_id, current_user.id, is_approved=True)

@router.put("/{payment_id}/reject", response_model=PaymentResponse, dependencies=[Depends(require_admin)])
async def reject_payment(
    payment_id: UUID,
    req: RejectRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Tolak bukti pembayaran (Admin)."""
    if current_user.role == RoleEnum.admin:
        result = await db.execute(select(Payment).options(selectinload(Payment.booking).selectinload(Booking.court).selectinload(Court.venue)).where(Payment.id == payment_id))
        payment = result.scalars().first()
        if not payment or payment.booking.court.venue.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Akses ditolak")
            
    return await confirm_payment(db, payment_id, current_user.id, is_approved=False, rejection_reason=req.rejection_reason)

@router.post("/{booking_id}/xendit-invoice")
async def create_xendit_invoice(
    booking_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mendapatkan link Invoice Xendit untuk Booking tertentu."""
    b_result = await db.execute(select(Booking).options(selectinload(Booking.court)).where(Booking.id == booking_id))
    booking = b_result.scalars().first()

    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan atau bukan milik Anda")
    if booking.status != BookingStatusEnum.pending:
        raise HTTPException(status_code=400, detail="Booking sudah tidak pending")

    p_result = await db.execute(select(Payment).where(Payment.booking_id == booking_id))
    payment = p_result.scalars().first()

    if not payment:
        payment = Payment(
            booking_id=booking_id,
            amount=booking.total_price,
            method=PaymentMethodEnum.transfer, # Placeholder for online methods
            status=PaymentStatusEnum.pending
        )
        db.add(payment)
        await db.commit()
        await db.refresh(payment)
    elif payment.status not in [PaymentStatusEnum.pending, PaymentStatusEnum.failed]:
        raise HTTPException(status_code=400, detail="Pembayaran sudah diproses")

    # Enforce realistic payment - No Simulation/Demo allowed
    if not settings.XENDIT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gateway pembayaran Xendit belum dikonfigurasi oleh Super Admin. Transaksi tidak dapat diproses secara realistis."
        )

    # Siapkan request ke Xendit Invoices API
    xendit_url = "https://api.xendit.co/v2/invoices"
    auth_string = base64.b64encode(f"{settings.XENDIT_SECRET_KEY}:".encode('utf-8')).decode('utf-8')
    headers = {
        "Authorization": f"Basic {auth_string}",
        "Content-Type": "application/json"
    }
    
    unique_order_id = f"{payment.id}-{int(datetime.utcnow().timestamp())}"

    origin_url = request.headers.get("origin") or "http://localhost:5173"
    
    desc = f"Sewa {booking.court.name} - {booking.booking_date.strftime('%d %b %Y')}"
    if booking.booking_type == BookingTypeEnum.monthly:
        desc = f"Member {booking.court.name} - {booking.booking_date.strftime('%d %b %Y')} s/d {booking.end_date.strftime('%d %b %Y')}"
    
    payload = {
        "external_id": unique_order_id,
        "amount": int(payment.amount),
        "payer_email": current_user.email,
        "description": desc,
        "customer": {
            "given_names": current_user.name,
            "email": current_user.email
        },
        "success_redirect_url": f"{origin_url}/my-bookings",
        "failure_redirect_url": f"{origin_url}/my-bookings"
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(xendit_url, json=payload, headers=headers)
        if resp.status_code != 200 and resp.status_code != 201:
            raise HTTPException(status_code=500, detail=f"Gagal mendapatkan Invoice Xendit: {resp.text}")
        
        data = resp.json()
        return {"invoice_url": data.get("invoice_url")}

@router.post("/xendit/webhook")
async def xendit_webhook(request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Webhook untuk menerima notifikasi dari Xendit Invoices."""
    payload = await request.json()
    
    external_id = payload.get("external_id")
    status = payload.get("status")
    
    if not external_id:
        return {"status": "ignored"}

    # external_id format: "uuid-timestamp"
    try:
        payment_uuid_str = external_id[:36] # UUID length is 36
        payment_uuid = UUID(payment_uuid_str)
    except:
        return {"status": "ignored"}

    p_result = await db.execute(select(Payment).options(selectinload(Payment.booking)).where(Payment.id == payment_uuid))
    payment = p_result.scalars().first()

    if not payment:
        return {"status": "payment not found"}

    if status == 'PAID' or status == 'SETTLED':
        payment.status = PaymentStatusEnum.paid
        payment.booking.status = BookingStatusEnum.confirmed
        
        # Load user and venue data for notification
        b_res = await db.execute(select(Booking).options(
            selectinload(Booking.user),
            selectinload(Booking.court).selectinload(Court.venue)
        ).where(Booking.id == payment.booking_id))
        b = b_res.scalars().first()
        
        if b and b.user:
            venue_name = b.court.venue.name if b.court and b.court.venue else "Sistem Booking Lapangan"
            court_name = b.court.name if b.court else "Lapangan"
            
            waktu_str = f"{b.booking_date.strftime('%d %b %Y')} ({b.start_time.strftime('%H:%M')} - {b.end_time.strftime('%H:%M')})"
            if b.booking_type == BookingTypeEnum.monthly:
                waktu_str = f"{b.booking_date.strftime('%d %b %Y')} s/d {b.end_date.strftime('%d %b %Y')}"

            wa_message = (
                f"🎉 HOREE! Pembayaran Berhasil!\n\n"
                f"Halo {b.user.name},\n"
                f"Pembayaran Xendit Anda sebesar Rp {payment.amount:,.0f} telah kami terima.\n\n"
                f"Jadwal {court_name} di {venue_name} sudah diamankan!\n"
                f"Waktu: {waktu_str}\n"
                f"Status: CONFIRMED ✅\n\n"
                f"Sampai jumpa di lapangan! Selamat berolahraga."
            )
            email_body = wa_message.replace("\n", "<br>")
            
            background_tasks.add_task(send_whatsapp_message, b.user.phone, wa_message)
            background_tasks.add_task(send_email, b.user.email, f"E-Tiket: Konfirmasi Pembayaran {venue_name}", email_body)
            
            # Update Notifikasi user agar tidak disuruh bayar lagi
            await db.execute(update(Notification).where(
                Notification.related_entity_type == "booking",
                Notification.related_entity_id == b.id,
                Notification.target_role == "customer"
            ).values(
                title="Pembayaran Berhasil 🎉",
                message=f"Pembayaran Anda untuk jadwal {court_name} di {venue_name} telah kami terima. Jadwal Anda berstatus CONFIRMED.",
                is_read=False
            ))
            
            # Update Notifikasi admin (jika ada owner_id)
            if b.court and b.court.venue and b.court.venue.owner_id:
                await db.execute(update(Notification).where(
                    Notification.related_entity_type == "booking",
                    Notification.related_entity_id == b.id,
                    Notification.target_role == "admin"
                ).values(
                    title="Pembayaran Diterima 💰",
                    message=f"Pembayaran untuk booking di {court_name} ({waktu_str}) telah diterima dan otomatis dikonfirmasi.",
                    is_read=False
                ))
            
    elif status == 'EXPIRED':
        payment.status = PaymentStatusEnum.failed
        
    await db.commit()
    return {"status": "ok"}
