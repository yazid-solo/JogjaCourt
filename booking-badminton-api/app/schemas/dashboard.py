from pydantic import BaseModel
from decimal import Decimal
from datetime import date
from typing import Optional
from uuid import UUID

class DashboardStatsResponse(BaseModel):
    total_bookings_today: int
    total_revenue_today: Decimal
    pending_payments_count: int
    active_courts_count: int

class DailyRevenue(BaseModel):
    date: date
    revenue: Decimal

class RevenueReportResponse(BaseModel):
    period: str
    total_revenue: Decimal
    daily_data: list[DailyRevenue]

class CourtOccupancy(BaseModel):
    court_name: str
    venue_name: str
    occupancy_rate: float # Percentage
    total_hours_booked: float

class OccupancyReportResponse(BaseModel):
    period: str
    court_data: list[CourtOccupancy]

class AdminRevenueShare(BaseModel):
    owner_id: Optional[UUID] = None
    owner_name: str
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    total_bookings: int
    hourly_bookings_count: int
    monthly_bookings_count: int
    venues: list[str]
    gross_revenue: Decimal
    platform_fee: Decimal
    net_income: Decimal

class RevenueShareReport(BaseModel):
    items: list[AdminRevenueShare]
    total_gross: Decimal
    total_platform_fee: Decimal
    total_net: Decimal

class LiveBookingInfo(BaseModel):
    booking_id: UUID
    user_name: str
    start_time: str
    end_time: str

class LiveMonitorCourt(BaseModel):
    court_id: UUID
    court_name: str
    venue_name: str
    active_booking: Optional[LiveBookingInfo] = None

