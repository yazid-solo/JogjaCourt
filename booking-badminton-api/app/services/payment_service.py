from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from fastapi import HTTPException
from datetime import datetime
from uuid import UUID

from app.models.payment import Payment, PaymentStatusEnum, PaymentMethodEnum
from app.models.booking import Booking, BookingStatusEnum
from app.models.notification import Notification
from app.models.court import Court
from app.models.venue import Venue
from sqlalchemy.orm import selectinload
from fastapi import UploadFile
from app.utils.helpers import upload_image_to_supabase

async def confirm_payment(db: AsyncSession, payment_id: UUID, admin_id: UUID, is_approved: bool, rejection_reason: str = None):
    # Fetch payment with related booking
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalars().first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    if payment.status != PaymentStatusEnum.pending:
        raise HTTPException(status_code=400, detail=f"Payment already processed (status: {payment.status})")
        
    # Fetch booking
    b_result = await db.execute(select(Booking).where(Booking.id == payment.booking_id))
    booking = b_result.scalars().first()
    
    if is_approved:
        payment.status = PaymentStatusEnum.paid
        booking.status = BookingStatusEnum.confirmed
        
        # Update Notifikasi user agar tidak disuruh bayar lagi
        await db.execute(update(Notification).where(
            Notification.related_entity_type == "booking",
            Notification.related_entity_id == booking.id,
            Notification.target_role == "customer"
        ).values(
            title="Pembayaran Diverifikasi 🎉",
            message=f"Pembayaran untuk booking pada {booking.booking_date} telah diverifikasi. Jadwal Anda berstatus CONFIRMED.",
            is_read=False
        ))
        
        # Notifikasi Pembayaran Berhasil (Tambahan untuk history)
        db.add(Notification(
            user_id=booking.user_id,
            title="Pembayaran Berhasil",
            message=f"Pembayaran manual untuk booking pada {booking.booking_date} telah disetujui admin.",
            target_role="customer",
            related_entity_type="payment",
            related_entity_id=payment.id
        ))
    else:
        payment.status = PaymentStatusEnum.failed
        payment.rejection_reason = rejection_reason
        booking.status = BookingStatusEnum.cancelled
        # Notifikasi Pembayaran Ditolak
        db.add(Notification(
            user_id=booking.user_id,
            title="Pembayaran Ditolak",
            message=f"Pembayaran untuk booking pada {booking.booking_date} ditolak. Alasan: {rejection_reason}. Booking dibatalkan.",
            target_role="customer",
            related_entity_type="payment",
            related_entity_id=payment.id
        ))
        
    payment.confirmed_by = admin_id
    payment.confirmed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(payment)
    await db.refresh(booking)
    
    return payment

async def process_upload_proof(
    db: AsyncSession, 
    booking_id: UUID, 
    user_id: UUID, 
    method: PaymentMethodEnum, 
    amount: float, 
    file: UploadFile
):
    b_result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = b_result.scalars().first()

    if not booking or booking.user_id != user_id:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan atau bukan milik Anda")
    if booking.status != BookingStatusEnum.pending:
        raise HTTPException(status_code=400, detail="Booking ini sudah tidak dalam status pending")

    p_result = await db.execute(select(Payment).where(Payment.booking_id == booking_id))
    existing_payment = p_result.scalars().first()
    if existing_payment and existing_payment.status not in [PaymentStatusEnum.failed, PaymentStatusEnum.pending]:
        raise HTTPException(status_code=400, detail="Pembayaran sudah diproses")

    image_url = None
    if file and file.filename:
        file_bytes = await file.read()
        filename = f"proof_{booking_id}_{file.filename}"
        try:
            image_url = await upload_image_to_supabase(file_bytes, filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal upload bukti: {str(e)}")

    if existing_payment:
        existing_payment.method = method
        existing_payment.amount = amount
        existing_payment.proof_image_url = image_url or existing_payment.proof_image_url
        existing_payment.status = PaymentStatusEnum.pending
        
        # Ambil owner (admin) dari lapangan
        result_court = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == booking.court_id))
        court_data = result_court.scalars().first()
        if court_data and court_data.venue and court_data.venue.owner_id:
            db.add(Notification(
                user_id=court_data.venue.owner_id,
                title="Bukti Pembayaran Diunggah",
                message=f"Customer telah mengunggah bukti pembayaran untuk booking pada {booking.booking_date}.",
                target_role="admin",
                related_entity_type="payment",
                related_entity_id=existing_payment.id
            ))
            
        await db.commit()
        await db.refresh(existing_payment)
        return existing_payment
    else:
        db_payment = Payment(
            booking_id=booking_id,
            amount=amount,
            method=method,
            proof_image_url=image_url,
            status=PaymentStatusEnum.pending
        )
        db.add(db_payment)
        await db.flush() # flush to get id for notification
        
        # Ambil owner (admin) dari lapangan
        result_court = await db.execute(select(Court).options(selectinload(Court.venue)).where(Court.id == booking.court_id))
        court_data = result_court.scalars().first()
        if court_data and court_data.venue and court_data.venue.owner_id:
            db.add(Notification(
                user_id=court_data.venue.owner_id,
                title="Bukti Pembayaran Diunggah",
                message=f"Customer telah mengunggah bukti pembayaran untuk booking pada {booking.booking_date}.",
                target_role="admin",
                related_entity_type="payment",
                related_entity_id=db_payment.id
            ))
            
        await db.commit()
        await db.refresh(db_payment)
        return db_payment

