from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from datetime import datetime
from uuid import UUID

from app.models.payment import Payment, PaymentStatusEnum
from app.models.booking import Booking, BookingStatusEnum
from app.models.notification import Notification

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
        # Notifikasi Pembayaran Berhasil
        db.add(Notification(
            user_id=booking.user_id,
            title="Pembayaran Berhasil",
            message=f"Pembayaran untuk booking pada {booking.booking_date} telah diverifikasi. Booking dikonfirmasi.",
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
            related_entity_type="payment",
            related_entity_id=payment.id
        ))
        
    payment.confirmed_by = admin_id
    payment.confirmed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(payment)
    await db.refresh(booking)
    
    return payment
