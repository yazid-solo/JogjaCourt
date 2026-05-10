from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

from app.database import get_db
from app.models.payment import Payment, PaymentStatusEnum, PaymentMethodEnum
from app.models.booking import Booking, BookingStatusEnum
from app.models.user import RoleEnum
from app.schemas.payment import PaymentResponse, PaymentDetailResponse
from app.utils.dependencies import get_current_user, require_admin
from app.utils.helpers import upload_image_to_supabase
from app.services.payment_service import confirm_payment

router = APIRouter(prefix="/payments", tags=["Payments"])

class RejectRequest(BaseModel):
    rejection_reason: Optional[str] = None

@router.get("", response_model=List[PaymentDetailResponse])
async def get_payments(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Daftar pembayaran — customer hanya melihat milik sendiri."""
    stmt = select(Payment).options(
        selectinload(Payment.booking),
        selectinload(Payment.admin)
    ).order_by(Payment.created_at.desc())

    if current_user.role == RoleEnum.customer:
        stmt = stmt.join(Booking).where(Booking.user_id == current_user.id)

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
    b_result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = b_result.scalars().first()

    if not booking or booking.user_id != current_user.id:
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
        await db.commit()
        await db.refresh(db_payment)
        return db_payment

@router.put("/{payment_id}/confirm", response_model=PaymentResponse, dependencies=[Depends(require_admin)])
async def verify_payment(
    payment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Konfirmasi pembayaran valid (Admin)."""
    return await confirm_payment(db, payment_id, current_user.id, is_approved=True)

@router.put("/{payment_id}/reject", response_model=PaymentResponse, dependencies=[Depends(require_admin)])
async def reject_payment(
    payment_id: UUID,
    req: RejectRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Tolak bukti pembayaran (Admin)."""
    return await confirm_payment(db, payment_id, current_user.id, is_approved=False, rejection_reason=req.rejection_reason)
