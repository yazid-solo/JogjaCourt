from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models.booking import Booking, BookingStatusEnum
from app.models.payment import Payment, PaymentStatusEnum
from app.models.court import Court
from app.schemas.dashboard import DashboardStatsResponse
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse, dependencies=[Depends(require_admin)])
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Statistik ringkas dashboard (Admin)."""
    today = datetime.utcnow().date()

    res_bookings = await db.execute(
        select(func.count(Booking.id)).where(
            func.date(Booking.created_at) == today,
            Booking.status != BookingStatusEnum.cancelled
        )
    )
    total_bookings = res_bookings.scalar() or 0

    res_revenue = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            func.date(Payment.confirmed_at) == today,
            Payment.status == PaymentStatusEnum.paid
        )
    )
    total_revenue = float(res_revenue.scalar() or 0)

    res_pending = await db.execute(
        select(func.count(Payment.id)).where(Payment.status == PaymentStatusEnum.pending)
    )
    pending_count = res_pending.scalar() or 0

    res_courts = await db.execute(
        select(func.count(Court.id)).where(Court.is_active == True)
    )
    active_courts = res_courts.scalar() or 0

    return DashboardStatsResponse(
        total_bookings_today=total_bookings,
        total_revenue_today=total_revenue,
        pending_payments_count=pending_count,
        active_courts_count=active_courts
    )

@router.get("/revenue", dependencies=[Depends(require_admin)])
async def get_revenue(db: AsyncSession = Depends(get_db)):
    """Laporan pendapatan per hari — 7 hari terakhir (Admin). Alias: /dashboard/weekly-revenue."""
    today = datetime.utcnow().date()
    result = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        res = await db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                func.date(Payment.confirmed_at) == day,
                Payment.status == PaymentStatusEnum.paid
            )
        )
        result.append({"date": day.strftime("%d %b"), "revenue": float(res.scalar() or 0)})
    return result

# Alias untuk kompatibilitas frontend lama
@router.get("/weekly-revenue", dependencies=[Depends(require_admin)])
async def get_weekly_revenue_alias(db: AsyncSession = Depends(get_db)):
    """Alias dari /dashboard/revenue (backward compat)."""
    today = datetime.utcnow().date()
    result = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        res = await db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                func.date(Payment.confirmed_at) == day,
                Payment.status == PaymentStatusEnum.paid
            )
        )
        result.append({"date": day.strftime("%a"), "revenue": float(res.scalar() or 0)})
    return result

@router.get("/occupancy", dependencies=[Depends(require_admin)])
async def get_occupancy(db: AsyncSession = Depends(get_db)):
    """Tingkat keterisian lapangan — 7 hari terakhir (Admin)."""
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    stmt = (
        select(Court.name, func.count(Booking.id).label("total"))
        .outerjoin(Booking, (Booking.court_id == Court.id) & (Booking.booking_date >= week_ago))
        .where(Court.is_active == True)
        .group_by(Court.id, Court.name)
        .order_by(func.count(Booking.id).desc())
        .limit(8)
    )
    res = await db.execute(stmt)
    return [{"court": r[0], "bookings": r[1]} for r in res.all()]

# Alias untuk kompatibilitas frontend lama
@router.get("/court-occupancy", dependencies=[Depends(require_admin)])
async def get_court_occupancy_alias(db: AsyncSession = Depends(get_db)):
    """Alias dari /dashboard/occupancy (backward compat)."""
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    stmt = (
        select(Court.name, func.count(Booking.id).label("total"))
        .outerjoin(Booking, (Booking.court_id == Court.id) & (Booking.booking_date >= week_ago))
        .where(Court.is_active == True)
        .group_by(Court.id, Court.name)
        .order_by(func.count(Booking.id).desc())
        .limit(8)
    )
    res = await db.execute(stmt)
    return [{"court": r[0], "bookings": r[1]} for r in res.all()]
