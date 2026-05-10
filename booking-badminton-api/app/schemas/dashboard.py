from pydantic import BaseModel
from decimal import Decimal
from datetime import date
from typing import Optional

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
