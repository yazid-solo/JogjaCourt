from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
import app.models  # noqa: F401
from app.routers import auth, areas, venues, courts, bookings, payments, dashboard, users, notifications, payouts, settings as sys_settings, testimonials, chat, kyc
from app.services.scheduler import cancel_expired_bookings

app = FastAPI(title="JogjaCourt API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(areas.router)
app.include_router(venues.router)
app.include_router(courts.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(notifications.router)
app.include_router(payouts.router)
app.include_router(sys_settings.router)
app.include_router(testimonials.router)
app.include_router(chat.router)
app.include_router(kyc.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to JogjaCourt API (Serverless)", "docs": "/docs"}

@app.get("/api/cron/cancel-expired")
async def trigger_cancel_expired():
    """Endpoint untuk dipanggil oleh Vercel Cron atau cron-job.org setiap menit"""
    await cancel_expired_bookings()
    return {"message": "Cron job executed: Expired bookings cancelled"}
