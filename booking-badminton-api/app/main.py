from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
import app.models  # noqa: F401 — registers all ORM models with Base.metadata
from app.routers import auth, areas, venues, courts, bookings, payments, dashboard, users, notifications, payouts, settings as sys_settings, testimonials, chat, kyc
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.scheduler import cancel_expired_bookings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup scheduler
    scheduler = AsyncIOScheduler()
    scheduler.add_job(cancel_expired_bookings, 'interval', minutes=1)
    scheduler.start()
    print("Scheduler started.")
    
    yield
    
    # Cleanup on shutdown
    scheduler.shutdown()
    print("Scheduler shutdown.")

app = FastAPI(title="JogjaCourt API", version="1.0.0", lifespan=lifespan)

# Mount static files for uploads
import os
os.makedirs("app/static/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="app/static/uploads"), name="uploads")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this to frontend domain
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
    return {"message": "Welcome to JogjaCourt API", "docs": "/docs"}
