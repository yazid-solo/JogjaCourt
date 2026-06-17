from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
import app.models  # noqa: F401 — registers all ORM models with Base.metadata
from app.routers import auth, areas, venues, courts, bookings, payments, dashboard, users, notifications
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup database tables on startup
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # WARNING: DROPS ALL DATA
        await conn.run_sync(Base.metadata.create_all)
        
    yield
    # Cleanup on shutdown

app = FastAPI(title="JogjaCourt API", version="1.0.0", lifespan=lifespan)

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

@app.get("/")
def read_root():
    return {"message": "Welcome to JogjaCourt API", "docs": "/docs"}
