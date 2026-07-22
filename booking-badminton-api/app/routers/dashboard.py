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
from app.models.system_setting import SystemSetting
from app.models.user import User, RoleEnum
from app.schemas.dashboard import DashboardStatsResponse, RevenueShareReport, AdminRevenueShare
from app.models.booking import BookingTypeEnum
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
    period: str = "all",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Laporan pendapatan dinamis berdasarkan period."""
    now_date = datetime.utcnow().date()
    is_admin = current_user.role == RoleEnum.admin

    stmt = select(Payment.confirmed_at, Payment.amount).where(
        Payment.status == PaymentStatusEnum.paid,
        Payment.confirmed_at != None
    )

    if is_admin:
        stmt = stmt.join(Booking, Payment.booking_id == Booking.id).join(Court, Booking.court_id == Court.id).join(Venue, Court.venue_id == Venue.id).where(Venue.owner_id == current_user.id)

    if period == "today":
        stmt = stmt.where(func.date(Payment.confirmed_at) == now_date)
    elif period == "this_month":
        first_day = now_date.replace(day=1)
        stmt = stmt.where(func.date(Payment.confirmed_at) >= first_day)
    elif period == "last_month":
        first_day_this_month = now_date.replace(day=1)
        last_day_last_month = first_day_this_month - timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)
        stmt = stmt.where(func.date(Payment.confirmed_at) >= first_day_last_month, func.date(Payment.confirmed_at) <= last_day_last_month)

    res = await db.execute(stmt)
    rows = res.all()

    if period == "today":
        data_map = {f"{i:02d}:00": 0 for i in range(24)}
        for confirmed_at, amount in rows:
            data_map[f"{confirmed_at.hour:02d}:00"] += float(amount)
        return [{"date": k, "revenue": v} for k, v in sorted(data_map.items())]

    elif period in ["this_month", "last_month"]:
        grouped = {}
        for confirmed_at, amount in rows:
            d = confirmed_at.date()
            if d not in grouped: grouped[d] = 0
            grouped[d] += float(amount)
        return [{"date": k.strftime("%d %b"), "revenue": v} for k, v in sorted(grouped.items())]

    else:
        grouped = {}
        for confirmed_at, amount in rows:
            sort_key = confirmed_at.strftime("%Y-%m")
            if sort_key not in grouped:
                grouped[sort_key] = {"label": confirmed_at.strftime("%b %Y"), "val": 0}
            grouped[sort_key]["val"] += float(amount)
        return [{"date": v["label"], "revenue": v["val"]} for k, v in sorted(grouped.items())]

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
    period: str = "all",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Tingkat keterisian lapangan dinamis berdasarkan period."""
    now_date = datetime.utcnow().date()
    is_admin = current_user.role == RoleEnum.admin

    stmt = select(Court.name, func.count(Booking.id).label("total")).select_from(Court)
    booking_cond = Booking.court_id == Court.id

    if period == "today":
        booking_cond = booking_cond & (Booking.booking_date == now_date)
    elif period == "this_month":
        first_day = now_date.replace(day=1)
        booking_cond = booking_cond & (Booking.booking_date >= first_day)
    elif period == "last_month":
        first_day_this_month = now_date.replace(day=1)
        last_day_last_month = first_day_this_month - timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)
        booking_cond = booking_cond & (Booking.booking_date >= first_day_last_month) & (Booking.booking_date <= last_day_last_month)
    
    stmt = stmt.outerjoin(Booking, booking_cond).where(Court.is_active == True)

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

@router.get("/revenue-share", response_model=RevenueShareReport)
async def get_revenue_share(
    period: str = "all",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Rekap pembagian pendapatan per Admin GOR (Super Admin melihat semua, Admin GOR melihat miliknya sendiri)."""
    # Ambil semua pembayaran yang sukses beserta data terkait
    stmt = (
        select(Payment, Booking, Venue, User)
        .join(Booking, Payment.booking_id == Booking.id)
        .join(Court, Booking.court_id == Court.id)
        .join(Venue, Court.venue_id == Venue.id)
        .outerjoin(User, Venue.owner_id == User.id)
        .where(Payment.status == PaymentStatusEnum.paid)
    )
    
    # Filter tanggal berdasarkan period
    now_date = datetime.utcnow().date()
    if period == "today":
        stmt = stmt.where(func.date(Payment.confirmed_at) == now_date)
    elif period == "this_month":
        first_day = now_date.replace(day=1)
        stmt = stmt.where(func.date(Payment.confirmed_at) >= first_day)
    elif period == "last_month":
        first_day_this_month = now_date.replace(day=1)
        last_day_last_month = first_day_this_month - timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)
        stmt = stmt.where(func.date(Payment.confirmed_at) >= first_day_last_month, func.date(Payment.confirmed_at) <= last_day_last_month)
    
    if current_user.role == RoleEnum.admin:
        stmt = stmt.where(Venue.owner_id == current_user.id)
        
    stmt = stmt.limit(5000)
    res = await db.execute(stmt)
    rows = res.all()

    # Ambil fee dari DB
    setting_res = await db.execute(select(SystemSetting))
    settings_db = {s.key: s.value for s in setting_res.scalars().all()}
    monthly_fee_val = int(settings_db.get('platform_fee_monthly', 15000))
    hourly_fee_val = int(settings_db.get('platform_fee_hourly', 5000))

    # Grup berdasarkan owner_id
    owner_stats = {}
    
    total_gross = 0
    total_platform_fee = 0
    total_net = 0

    for payment, booking, venue, owner in rows:
        o_id = owner.id if owner else None
        o_name = owner.name if owner else "Admin Tidak Diketahui (GOR: " + venue.name + ")"
        
        if o_id not in owner_stats:
            owner_stats[o_id] = {
                "owner_id": o_id,
                "owner_name": o_name,
                "bank_name": owner.bank_name if owner else None,
                "bank_account_number": owner.bank_account_number if owner else None,
                "bank_account_name": owner.bank_account_name if owner else None,
                "total_bookings": 0,
                "hourly_bookings_count": 0,
                "monthly_bookings_count": 0,
                "venues": set(),
                "gross_revenue": 0,
                "platform_fee": 0,
                "net_income": 0
            }
            
        stats = owner_stats[o_id]
        stats["venues"].add(venue.name)
        
        # Hitung fee per transaksi booking
        if booking.booking_type == BookingTypeEnum.monthly:
            fee = monthly_fee_val
            stats["monthly_bookings_count"] += 1
        else:
            fee = hourly_fee_val
            stats["hourly_bookings_count"] += 1
            
        amount = float(payment.amount)
        
        # Cegah fee lebih besar dari pendapatan
        if fee > amount:
            fee = amount
            
        stats["total_bookings"] += 1
        
        # Gross dan Platform Fee selalu dihitung seumur hidup (berdasarkan filter periode)
        stats["gross_revenue"] += amount
        stats["platform_fee"] += fee
        
        total_gross += amount
        total_platform_fee += fee
        
        # HANYA hitung net_income (saldo tersedia) JIKA belum dicairkan (payout_id == None)
        if payment.payout_id is None:
            stats["net_income"] += (amount - fee)
            total_net += (amount - fee)

    items = []
    for stats in owner_stats.values():
        stats["venues"] = list(stats["venues"]) # Convert set to list
        items.append(AdminRevenueShare(**stats))
    # Urutkan berdasarkan pendapatan terbesar
    items.sort(key=lambda x: x.gross_revenue, reverse=True)

    return RevenueShareReport(
        items=items,
        total_gross=total_gross,
        total_platform_fee=total_platform_fee,
        total_net=total_net
    )

@router.get("/live-monitor", response_model=list[dict])
async def get_live_monitor(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Mendapatkan status real-time lapangan (Live Monitor) untuk TV GOR."""
    now = datetime.utcnow()
    now_time = now.time()
    now_date = now.date()

    # Ambil semua lapangan milik admin
    stmt_courts = select(Court, Venue).join(Venue, Court.venue_id == Venue.id).where(Court.is_active == True)
    if current_user.role == RoleEnum.admin:
        stmt_courts = stmt_courts.where(Venue.owner_id == current_user.id)
    
    stmt_courts = stmt_courts.limit(200)
    res_courts = await db.execute(stmt_courts)
    courts_data = res_courts.all()

    # Ambil semua booking yang aktif hari ini
    stmt_bookings = (
        select(Booking, User)
        .join(User, Booking.user_id == User.id)
        .join(Court, Booking.court_id == Court.id)
        .join(Venue, Court.venue_id == Venue.id)
        .where(
            Booking.booking_date == now_date,
            Booking.status.in_([BookingStatusEnum.confirmed, BookingStatusEnum.completed])
        )
    )
    if current_user.role == RoleEnum.admin:
        stmt_bookings = stmt_bookings.where(Venue.owner_id == current_user.id)
    
    stmt_bookings = stmt_bookings.limit(1000)
    res_bookings = await db.execute(stmt_bookings)
    today_bookings = res_bookings.all()

    monitor_data = []
    for court, venue in courts_data:
        # Cari booking yang sedang berlangsung atau akan datang dalam waktu dekat (misal hari ini)
        # Tapi yang paling penting adalah booking yang sedang aktif SEKARANG
        active_b = None
        for b, u in today_bookings:
            if b.court_id == court.id:
                if b.start_time <= now_time <= b.end_time:
                    active_b = {
                        "booking_id": str(b.id),
                        "user_name": u.name,
                        "start_time": b.start_time.strftime("%H:%M"),
                        "end_time": b.end_time.strftime("%H:%M")
                    }
                    break

        monitor_data.append({
            "court_id": str(court.id),
            "court_name": court.name,
            "venue_name": venue.name,
            "active_booking": active_b
        })

    # Sortir berdasarkan nama GOR lalu nama Lapangan
    monitor_data.sort(key=lambda x: (x["venue_name"], x["court_name"]))
    return monitor_data

