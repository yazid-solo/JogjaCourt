"""
Seed data untuk JogjaCourt — jalankan SEKALI untuk mengisi database awal.
Buat: 1 Super Admin, 1 Admin, 1 Customer, 3 Daerah, 4 Venue, 8 Lapangan.

Cara pakai:
  cd booking-badminton-api
  python seed_data.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from passlib.context import CryptContext
from dotenv import load_dotenv
import uuid

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL tidak ditemukan di .env")
    sys.exit(1)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"statement_cache_size": 0}
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Import models
from app.models.user import User, RoleEnum
from app.models.area import Area
from app.models.venue import Venue
from app.models.court import Court, CourtTypeEnum, RentalTypeEnum

async def seed():
    async with AsyncSessionLocal() as db:
        print("🌱 Mulai seed data JogjaCourt...\n")

        # ──────────────────────────────────────────────
        # 1. USERS
        # ──────────────────────────────────────────────
        users_data = [
            {
                "name": "Super Admin",
                "email": "superadmin@jogjacourt.com",
                "password": "superadmin_2026!",
                "phone": "081200000001",
                "role": RoleEnum.super_admin
            },
            {
                "name": "Admin Operasional",
                "email": "admin@jogjacourt.com",
                "password": "admin_arena_2026!",
                "phone": "081200000002",
                "role": RoleEnum.admin
            },
            {
                "name": "Budi Santoso",
                "email": "budi@gmail.com",
                "password": "budi123456",
                "phone": "082111222333",
                "role": RoleEnum.customer
            },
        ]

        created_users = {}
        for u in users_data:
            existing = await db.execute(select(User).where(User.email == u["email"]))
            if existing.scalars().first():
                print(f"  ⏭  User '{u['email']}' sudah ada, skip.")
                continue
            user = User(
                name=u["name"],
                email=u["email"],
                password_hash=pwd_context.hash(u["password"]),
                phone=u["phone"],
                role=u["role"],
                is_active=True
            )
            db.add(user)
            await db.flush()
            created_users[u["email"]] = user
            print(f"  ✅ User '{u['name']}' ({u['role'].value}) dibuat.")

        # ──────────────────────────────────────────────
        # 2. AREAS
        # ──────────────────────────────────────────────
        areas_data = [
            {"name": "Kota Yogyakarta", "province": "D.I. Yogyakarta", "description": "Pusat kebudayaan Jawa dengan banyak fasilitas olahraga modern."},
            {"name": "Sleman", "province": "D.I. Yogyakarta", "description": "Kabupaten yang berkembang pesat dengan banyak GOR berstandar tinggi."},
            {"name": "Kota Semarang", "province": "Jawa Tengah", "description": "Ibukota Jawa Tengah dengan komunitas bulutangkis yang aktif."},
        ]

        created_areas = {}
        for a in areas_data:
            existing = await db.execute(select(Area).where(Area.name == a["name"]))
            if existing.scalars().first():
                print(f"  ⏭  Area '{a['name']}' sudah ada, skip.")
                res = await db.execute(select(Area).where(Area.name == a["name"]))
                created_areas[a["name"]] = res.scalars().first()
                continue
            area = Area(**a, is_active=True)
            db.add(area)
            await db.flush()
            created_areas[a["name"]] = area
            print(f"  ✅ Daerah '{a['name']}' dibuat.")

        # ──────────────────────────────────────────────
        # 3. VENUES
        # ──────────────────────────────────────────────
        venues_data = [
            {
                "area_name": "Kota Yogyakarta",
                "name": "GOR Kridosono",
                "address": "Jl. Faridan M. Noto No.7, Kotabaru, Gondokusuman, Yogyakarta",
                "phone": "0274-562346",
                "description": "GOR bersejarah di tengah kota Yogyakarta dengan fasilitas lengkap dan lapangan berstandar internasional.",
                "maps_url": "https://maps.google.com/?q=GOR+Kridosono+Yogyakarta",
            },
            {
                "area_name": "Kota Yogyakarta",
                "name": "Arena Badminton Gejayan",
                "address": "Jl. Gejayan No.45, Sleman, Yogyakarta",
                "phone": "0812-3456-7890",
                "description": "GOR modern dengan pencahayaan LED premium dan lantai vinyl anti-slip.",
                "maps_url": None,
            },
            {
                "area_name": "Sleman",
                "name": "GOR Condong Catur",
                "address": "Jl. Manggis No.1, Condongcatur, Depok, Sleman",
                "phone": "0274-887766",
                "description": "GOR luas di kawasan Condong Catur dengan 6 lapangan indoor dan parkir luas.",
                "maps_url": "https://maps.google.com/?q=GOR+Condong+Catur",
            },
            {
                "area_name": "Kota Semarang",
                "name": "Semarang Badminton Hall",
                "address": "Jl. Majapahit No.12, Semarang Selatan",
                "phone": "024-76543210",
                "description": "GOR terbesar di Semarang dengan fasilitas kelas dunia dan AC central.",
                "maps_url": None,
            },
        ]

        created_venues = {}
        for v in venues_data:
            area = created_areas.get(v["area_name"])
            if not area:
                print(f"  ⚠️  Daerah '{v['area_name']}' tidak ditemukan, skip venue '{v['name']}'.")
                continue
            existing = await db.execute(select(Venue).where(Venue.name == v["name"]))
            if existing.scalars().first():
                print(f"  ⏭  Venue '{v['name']}' sudah ada, skip.")
                res = await db.execute(select(Venue).where(Venue.name == v["name"]))
                created_venues[v["name"]] = res.scalars().first()
                continue
            venue = Venue(
                area_id=area.id,
                name=v["name"],
                address=v["address"],
                phone=v["phone"],
                maps_url=v.get("maps_url"),
                is_active=True
            )
            db.add(venue)
            await db.flush()
            created_venues[v["name"]] = venue
            print(f"  ✅ Venue '{v['name']}' dibuat.")

        # ──────────────────────────────────────────────
        # 4. COURTS
        # ──────────────────────────────────────────────
        courts_data = [
            # GOR Kridosono — 2 lapangan
            {"venue_name": "GOR Kridosono", "name": "Lapangan A - Kridosono", "court_type": "single", "price_regular": 40000, "price_peak": 65000, "peak_hours": "17:00-21:00"},
            {"venue_name": "GOR Kridosono", "name": "Lapangan B - Kridosono", "court_type": "double", "price_regular": 40000, "price_peak": 65000, "peak_hours": "17:00-21:00"},
            # Arena Gejayan — 2 lapangan
            {"venue_name": "Arena Badminton Gejayan", "name": "Lapangan 1 - Gejayan", "court_type": "single", "price_regular": 35000, "price_peak": 55000, "peak_hours": "18:00-22:00"},
            {"venue_name": "Arena Badminton Gejayan", "name": "Lapangan 2 - Gejayan", "court_type": "mixed",  "price_regular": 45000, "price_peak": 70000, "peak_hours": "18:00-22:00"},
            # GOR Condong Catur — 2 lapangan
            {"venue_name": "GOR Condong Catur", "name": "Lapangan Utama - Condong", "court_type": "single", "price_regular": 50000, "price_peak": 80000, "peak_hours": "17:00-21:00"},
            {"venue_name": "GOR Condong Catur", "name": "Lapangan Samping - Condong", "court_type": "double", "price_regular": 35000, "price_peak": 55000, "peak_hours": "17:00-21:00"},
            # Semarang — 2 lapangan
            {"venue_name": "Semarang Badminton Hall", "name": "Court 1 - Semarang", "court_type": "single", "price_regular": 60000, "price_peak": 90000, "peak_hours": "18:00-22:00"},
            {"venue_name": "Semarang Badminton Hall", "name": "Court 2 - Semarang", "court_type": "mixed",  "price_regular": 60000, "price_peak": 90000, "peak_hours": "18:00-22:00"},
        ]

        type_map = {
            "single": CourtTypeEnum.single,
            "double": CourtTypeEnum.double,
            "mixed":  CourtTypeEnum.mixed,
        }

        for c in courts_data:
            venue = created_venues.get(c["venue_name"])
            if not venue:
                print(f"  ⚠️  Venue '{c['venue_name']}' tidak ditemukan, skip court '{c['name']}'.")
                continue
            existing = await db.execute(select(Court).where(Court.name == c["name"], Court.venue_id == venue.id))
            if existing.scalars().first():
                print(f"  ⏭  Court '{c['name']}' sudah ada, skip.")
                continue
            court = Court(
                venue_id=venue.id,
                name=c["name"],
                court_type=type_map[c["court_type"]],
                rental_type=RentalTypeEnum.hourly,
                price_regular=c["price_regular"],
                price_peak=c["price_peak"],
                peak_hours=c.get("peak_hours"),
                is_active=True
            )
            db.add(court)
            print(f"  ✅ Lapangan '{c['name']}' dibuat.")

        await db.commit()
        print("\n🎉 Selesai! Seed data berhasil dimasukkan ke database.")
        print("\n📋 Akun yang tersedia:")
        print("  Super Admin: superadmin@jogjacourt.com / superadmin_2026!")
        print("  Admin:       admin@jogjacourt.com / admin_arena_2026!")
        print("  Customer:    budi@gmail.com / budi123456")

if __name__ == "__main__":
    asyncio.run(seed())
