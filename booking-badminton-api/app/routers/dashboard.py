from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models.booking import Booking, BookingStatusEnum
from app.models.payment import Payment, PaymentStatusEnum
from app.models.court import Court
from app.models.venue import Venue
from app.models.user import User, RoleEnum
from app.schemas.dashboard import DashboardStatsResponse
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Statistik ringkas dashboard (Admin)."""
    today = datetime.utcnow().date()
    is_admin = current_user.role == RoleEnum.admin

    # Total Bookings
    b_stmt = select(func.count(Booking.id)).where(
        func.date(Booking.created_at) == today,
        Booking.status != BookingStatusEnum.cancelled
    )
    if is_admin:
        b_stmt = b_stmt.join(Court, Booking.court_id == Court.id).join(Venue, Court.venue_id == Venue.id).where(Venue.owner_id == current_user.id)
    res_bookings = await db.execute(b_stmt)
    total_bookings = res_bookings.scalar() or 0

    # Total Revenue
    r_stmt = select(func.coalesce(func.sum(Payment.amount), 0)).where(
        func.date(Payment.confirmed_at) == today,
        Payment.status == PaymentStatusEnum.paid
    )
    if is_admin:
        r_stmt = r_stmt.join(Booking, Payment.booking_id == Booking.id).join(Court, Booking.court_id == Court.id).join(Venue, Court.venue_id == Venue.id).where(Venue.owner_id == current_user.id)
    res_revenue = await db.execute(r_stmt)
    total_revenue = float(res_revenue.scalar() or 0)

    # Pending Payments
    p_stmt = select(func.count(Payment.id)).where(Payment.status == PaymentStatusEnum.pending)
    if is_admin:
        p_stmt = p_stmt.join(Booking, Payment.booking_id == Booking.id).join(Court, Booking.court_id == Court.id).join(Venue, Court.venue_id == Venue.id).where(Venue.owner_id == current_user.id)
    res_pending = await db.execute(p_stmt)
    pending_count = res_pending.scalar() or 0

    # Active Courts
    c_stmt = select(func.count(Court.id)).where(Court.is_active == True)
    if is_admin:
        c_stmt = c_stmt.join(Venue, Court.venue_id == Venue.id).where(Venue.owner_id == current_user.id)
    res_courts = await db.execute(c_stmt)
    active_courts = res_courts.scalar() or 0

    return DashboardStatsResponse(
        total_bookings_today=total_bookings,
        total_revenue_today=total_revenue,
        pending_payments_count=pending_count,
        active_courts_count=active_courts
    )

@router.get("/revenue")
async def get_revenue(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Laporan pendapatan per hari — 7 hari terakhir (Admin). Alias: /dashboard/weekly-revenue."""
    today = datetime.utcnow().date()
    result = []
    is_admin = current_user.role == RoleEnum.admin

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        stmt = select(func.coalesce(func.sum(Payment.amount), 0)).where(
            func.date(Payment.confirmed_at) == day,
            Payment.status == PaymentStatusEnum.paid
        )
        if is_admin:
            stmt = stmt.join(Booking, Payment.booking_id == Booking.id).join(Court, Booking.court_id == Court.id).join(Venue, Court.venue_id == Venue.id).where(Venue.owner_id == current_user.id)
        
        res = await db.execute(stmt)
        result.append({"date": day.strftime("%d %b"), "revenue": float(res.scalar() or 0)})
    return result

# Alias untuk kompatibilitas frontend lama
@router.get("/weekly-revenue")
async def get_weekly_revenue_alias(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Alias dari /dashboard/revenue (backward compat)."""
    today = datetime.utcnow().date()
    result = []
    is_admin = current_user.role == RoleEnum.admin

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        stmt = select(func.coalesce(func.sum(Payment.amount), 0)).where(
            func.date(Payment.confirmed_at) == day,
            Payment.status == PaymentStatusEnum.paid
        )
        if is_admin:
            stmt = stmt.join(Booking, Payment.booking_id == Booking.id).join(Court, Booking.court_id == Court.id).join(Venue, Court.venue_id == Venue.id).where(Venue.owner_id == current_user.id)
        
        res = await db.execute(stmt)
        result.append({"date": day.strftime("%a"), "revenue": float(res.scalar() or 0)})
    return result

@router.get("/occupancy")
async def get_occupancy(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Tingkat keterisian lapangan — 7 hari terakhir (Admin)."""
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    is_admin = current_user.role == RoleEnum.admin

    stmt = (
        select(Court.name, func.count(Booking.id).label("total"))
        .outerjoin(Booking, (Booking.court_id == Court.id) & (Booking.booking_date >= week_ago))
        .where(Court.is_active == True)
    )
    if is_admin:
        stmt = stmt.join(Venue, Court.venue_id == Venue.id).where(Venue.owner_id == current_user.id)

    stmt = stmt.group_by(Court.id, Court.name).order_by(func.count(Booking.id).desc()).limit(8)
    res = await db.execute(stmt)
    return [{"court": r[0], "bookings": r[1]} for r in res.all()]

# Alias untuk kompatibilitas frontend lama
@router.get("/court-occupancy")
async def get_court_occupancy_alias(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Alias dari /dashboard/occupancy (backward compat)."""
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    is_admin = current_user.role == RoleEnum.admin

    stmt = (
        select(Court.name, func.count(Booking.id).label("total"))
        .outerjoin(Booking, (Booking.court_id == Court.id) & (Booking.booking_date >= week_ago))
        .where(Court.is_active == True)
    )
    if is_admin:
        stmt = stmt.join(Venue, Court.venue_id == Venue.id).where(Venue.owner_id == current_user.id)

    stmt = stmt.group_by(Court.id, Court.name).order_by(func.count(Booking.id).desc()).limit(8)
    res = await db.execute(stmt)
    return [{"court": r[0], "bookings": r[1]} for r in res.all()]
