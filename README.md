# 🏸 JogjaCourt — Sistem Booking Lapangan Badminton

Platform manajemen dan pemesanan lapangan badminton berbasis web untuk wilayah D.I. Yogyakarta. Dibangun menggunakan arsitektur REST API dengan backend FastAPI (Python) dan frontend React.js (Vite + Tailwind CSS). Sistem ini menyediakan solusi lengkap mulai dari pencarian GOR, pemesanan slot waktu secara real-time, pembayaran, hingga pengelolaan operasional GOR untuk admin — semuanya dalam satu platform terintegrasi.

---

## Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Role Pengguna](#-role-pengguna)
- [Teknologi](#-teknologi-yang-digunakan)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Cara Menjalankan](#-cara-menjalankan-proyek-secara-lokal)
- [Struktur Direktori](#-struktur-direktori-proyek)
- [Daftar Endpoint API](#-daftar-endpoint-api)
- [Skema Database](#-skema-database)
- [Keamanan](#-keamanan)
- [Screenshot](#-screenshot)

---

## ✨ Fitur Utama

### Untuk Pemain (Customer)
- **Pencarian Bertahap** — Cari lapangan berdasarkan daerah → GOR → lapangan dalam alur yang intuitif
- **Ketersediaan Real-time** — Lihat slot waktu yang masih kosong per tanggal dalam format grid visual (jam 08:00–23:00)
- **Lock Slot 15 Menit** — Saat checkout, slot waktu langsung dikunci selama 15 menit untuk mencegah double-booking. Jika tidak dibayar dalam waktu tersebut, slot otomatis terbuka kembali
- **Upload Bukti Pembayaran** — Unggah foto bukti transfer langsung dari browser
- **Riwayat Pesanan** — Pantau status booking secara real-time (Pending → Confirmed → Completed)
- **Profil Pengguna** — Edit profil, upload foto, dan ganti password
- **Notifikasi** — Pemberitahuan in-app saat pembayaran dikonfirmasi/ditolak atau booking kedaluwarsa

### Untuk Pengelola GOR (Admin)
- **Dashboard Operasional** — Statistik harian (total booking, pendapatan, pembayaran pending) dan grafik tren 7 hari
- **Manajemen GOR & Lapangan** — CRUD data GOR dan lapangan dengan pengaturan harga reguler/peak hour/bulanan
- **Verifikasi Pembayaran** — Preview bukti transfer, setujui atau tolak dengan alasan
- **Blokir Jadwal** — Blokir slot waktu untuk maintenance atau event (otomatis tidak bisa dipesan customer)
- **Multi-Tenant** — Data terisolasi per admin. Admin A tidak bisa melihat data GOR, lapangan, maupun pendapatan milik Admin B

### Untuk Pemilik Platform (Super Admin)
- **Kontrol Penuh** — Akses semua fitur admin di seluruh GOR tanpa batasan
- **Manajemen Pengguna** — Lihat daftar semua akun, ubah role (Customer ↔ Admin), aktifkan/nonaktifkan akun
- **Manajemen Daerah** — Tambah, edit, atau nonaktifkan wilayah operasi
- **Rekap Pembagian Pendapatan** — Laporan pendapatan per admin GOR lengkap dengan potongan biaya platform:
  - Sewa per jam: potongan Rp 5.000/transaksi
  - Sewa per bulan: potongan Rp 15.000/transaksi

### 🌟 Fitur Enterprise / v2.0 (Terbaru)
- **Otentikasi Akun Google (Social Login)** — Login instan menggunakan akun Google tanpa perlu mengetik email dan password, langsung mendapatkan token JWT yang aman.
- **Sistem Live Chat (WebSocket)** — Fitur pesan instan dua arah (*real-time*) antara pemain dan pengelola GOR di dalam aplikasi (tanpa perlu reload halaman).
- **Auto-Cancel Scheduler (Background Jobs)** — Robot penjadwalan (*cron job*) menggunakan `APScheduler` yang aktif memantau database setiap 1 menit. Jika ada pesanan yang *pending* melewati batas waktu 15 menit, sistem otomatis mengubahnya menjadi `expired` tanpa campur tangan manusia.
- **Push Notifications (Web Push)** — Kesiapan API backend untuk mengirimkan notifikasi pop-up langsung ke layar *smartphone* (Android/iOS) atau PC pengguna.

---

## 👥 Role Pengguna

Sistem menerapkan **Role-Based Access Control (RBAC)** dengan tiga level:

### 1. Customer (Pemain)
Role default saat mendaftar akun baru melalui halaman registrasi.

| Hak Akses | Keterangan |
|-----------|------------|
| Cari & Lihat | Melihat daftar daerah, GOR, lapangan, dan ketersediaan slot |
| Booking | Membuat pesanan baru dengan mekanisme lock 15 menit |
| Pembayaran | Mengunggah bukti pembayaran |
| Riwayat | Melihat dan membatalkan pesanan milik sendiri |
| Profil | Mengedit nama, nomor HP, foto profil, dan password |

### 2. Admin (Pengelola GOR)
Ditetapkan oleh Super Admin melalui menu manajemen pengguna.

| Hak Akses | Keterangan |
|-----------|------------|
| Dashboard | Statistik operasional khusus GOR miliknya |
| GOR & Lapangan | CRUD data GOR dan lapangan yang menjadi miliknya |
| Transaksi | Melihat dan memverifikasi booking & pembayaran yang masuk ke GOR miliknya |
| Blokir Jadwal | Mengatur jadwal blokir lapangan miliknya |
| Isolasi Data | **Tidak bisa** melihat data GOR, lapangan, atau pendapatan milik admin lain |

### 3. Super Admin (Pemilik Platform)
Dibuat melalui script `create_admin.py` di backend.

| Hak Akses | Keterangan |
|-----------|------------|
| Semua Akses Admin | Dapat mengakses dan mengelola data di seluruh GOR |
| Manajemen Pengguna | Melihat daftar semua akun, mengubah role, mengaktifkan/menonaktifkan akun |
| Manajemen Daerah | CRUD data daerah/wilayah operasi |
| Rekap Pendapatan | Melihat laporan pembagian pendapatan semua admin GOR |

---

## 🛠️ Teknologi yang Digunakan

### Backend (`booking-badminton-api/`)

| Komponen | Teknologi | Versi | Keterangan |
|----------|-----------|-------|------------|
| Framework | FastAPI | 0.115 | Web framework async untuk Python |
| Runtime | Python | 3.13 | |
| Database | PostgreSQL | 15 | Di-hosting di Supabase |
| ORM | SQLAlchemy | 2.0 | Mode asyncio dengan asyncpg driver |
| Validasi | Pydantic | 2.11 | Schema validation untuk request/response |
| Autentikasi | python-jose | 3.3.0 | JWT token generation & verification |
| Hashing | passlib + bcrypt | 1.7.4 / 4.0.1 | Password hashing |
| HTTP Client | httpx | 0.28 | Untuk komunikasi ke Supabase Storage API |
| Image Processing | Pillow | 11.0+ | Pengolahan gambar (resize, transparansi) |
| File Upload | python-multipart | 0.0.20 | Parsing multipart form data |
| Config | pydantic-settings | 2.9 | Environment variable management |
| Server | Uvicorn | 0.34 | ASGI server dengan hot-reload |

### Frontend (`frontend/`)

| Komponen | Teknologi | Keterangan |
|----------|-----------|------------|
| Core Framework | React.js | UI Library berbasis komponen |
| Build Tool | Vite | Module bundler & dev server ultra-cepat |
| Routing | React Router v6 | Manajemen navigasi Single Page Application (SPA) |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Ikon | Lucide React | Lightweight icon library untuk komponen React |
| HTTP Client | Axios / Fetch API | Komunikasi REST API dengan backend FastAPI |
| Desain | Dark Mode + Glassmorphism | Tema gelap premium dengan aksen kuning keemasan (#D4AF37) |

---

## 🏗️ Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────────────┐
│                          BROWSER (CLIENT)                            │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  Login   │  │  Cari &  │  │  Booking │  │    Admin Panel       │ │
│  │Register  │  │  Browse  │  │ Checkout │  │ (Dashboard, CRUD,    │ │
│  │          │  │  GOR     │  │          │  │  Verifikasi, Rekap)  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────────┘ │
│       │              │              │                 │               │
│       └──────────────┴──────────────┴─────────────────┘               │
│                              │                                        │
│                    js/api.js │  (fetch + JWT token)                   │
│                              │                                        │
└──────────────────────────────┼────────────────────────────────────────┘
                               │ HTTP REST API
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       FASTAPI SERVER (:8000)                         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                     MIDDLEWARE LAYER                           │  │
│  │  CORS │ Error Handling │ Request Logging                      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                      ROUTER LAYER                             │  │
│  │  /auth │ /areas │ /venues │ /courts │ /bookings │ /payments   │  │
│  │  /dashboard │ /users │ /notifications                         │  │
│  └───────────────────────────┬────────────────────────────────────┘  │
│                              │                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                     SERVICE LAYER                             │  │
│  │  auth_service │ booking_service │ payment_service             │  │
│  │  (Business logic: cek slot, hitung harga, lock, verifikasi)  │  │
│  └───────────────────────────┬────────────────────────────────────┘  │
│                              │                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                  UTILS & DEPENDENCIES                         │  │
│  │  JWT (create/verify token) │ RBAC (require_admin, etc.)       │  │
│  │  Supabase Storage upload   │ Pydantic config                  │  │
│  └───────────────────────────┬────────────────────────────────────┘  │
│                              │                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    DATA ACCESS LAYER                          │  │
│  │  SQLAlchemy ORM (Async) │ Pydantic Schemas │ 8 Models         │  │
│  └───────────────────────────┬────────────────────────────────────┘  │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ asyncpg (async PostgreSQL driver)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Cloud)                                   │
│                                                                      │
│  ┌────────────────────┐    ┌────────────────────┐                   │
│  │  PostgreSQL 15     │    │  Supabase Storage   │                   │
│  │  (via PgBouncer)   │    │  (Bukti bayar,      │                   │
│  │                    │    │   foto profil,       │                   │
│  │  8 tabel           │    │   gambar GOR)        │                   │
│  │  7 enum types      │    │                      │                   │
│  └────────────────────┘    └────────────────────┘                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Prinsip arsitektur:**
- Frontend **tidak pernah** mengakses database secara langsung — semua komunikasi melalui REST API
- Backend menggunakan pola **layered architecture**: Router → Service → ORM → Database
- Autentikasi menggunakan **stateless JWT** — server tidak menyimpan session
- Multi-tenancy diimplementasikan di **application level** (bukan database level) untuk fleksibilitas

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

### Prasyarat
- Python 3.9 atau lebih baru
- Akun Supabase (gratis) — untuk database PostgreSQL dan file storage
- Web browser modern (Chrome, Firefox, Edge)

### 1. Setup Backend (API Server)

```bash
# Masuk ke folder backend
cd booking-badminton-api

# Buat virtual environment
python -m venv venv

# Aktifkan virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Buat file `.env` di dalam folder `booking-badminton-api/` dengan isi berikut:

```env
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>:<port>/<database>
SECRET_KEY=<random-string-32-karakter>
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_KEY=<supabase-anon-key>
```

> **Catatan:** Ganti placeholder `<...>` dengan credential Supabase project Anda. Connection string PostgreSQL bisa didapatkan dari menu Supabase → Settings → Database → Connection string (gunakan mode Session/Transaction pooling).

Jalankan server:

```bash
uvicorn app.main:app --reload
```

Server akan berjalan di `http://localhost:8000`. Dokumentasi API interaktif (Swagger UI) tersedia di `http://localhost:8000/docs`.

### 2. Setup Database (Opsional — Otomatis)

Tabel database akan **otomatis dibuat** saat server pertama kali dijalankan (melalui `Base.metadata.create_all()` di `main.py`). Jika ingin mengisi data awal, jalankan:

```bash
# Buat akun Super Admin
python create_admin.py

# Isi data contoh (daerah, GOR, lapangan)
python seed_data.py
```

### 3. Setup Frontend (Web Client)

Frontend dibangun menggunakan **React.js** dan dibundel dengan **Vite**. Pastikan Anda telah menginstal **Node.js**.

```bash
# Masuk ke folder frontend
cd frontend

# Install dependencies NPM (React, Tailwind, dll)
npm install

# Jalankan server pengembangan (Hot Module Replacement)
npm run dev
```

Buka browser dan akses URL lokal yang diberikan oleh Vite (biasanya `http://localhost:5173`).

> **Penting:** Pastikan backend API (`localhost:8000`) sudah berjalan sebelum membuka frontend, karena frontend mengambil semua data dari API.

---

## 📂 Struktur Direktori Proyek

```
Sistem Booking Lap.Badminton/
│
├── booking-badminton-api/          # ── BACKEND (Python FastAPI) ──
│   │
│   ├── app/                        # Kode sumber utama aplikasi
│   │   ├── models/                 # ORM model classes (8 model)
│   │   │   ├── user.py             #   User, RoleEnum
│   │   │   ├── area.py             #   Area (daerah)
│   │   │   ├── venue.py            #   Venue / GOR
│   │   │   ├── court.py            #   Court (lapangan), CourtTypeEnum, RentalTypeEnum
│   │   │   ├── court_block.py      #   CourtBlock (jadwal blokir)
│   │   │   ├── booking.py          #   Booking, BookingStatusEnum, BookingTypeEnum
│   │   │   ├── payment.py          #   Payment, PaymentMethodEnum, PaymentStatusEnum
│   │   │   └── notification.py     #   Notification
│   │   │
│   │   ├── schemas/                # Pydantic validation schemas
│   │   │   ├── user.py             #   UserCreate, UserResponse, dll.
│   │   │   ├── area.py             #   AreaCreate, AreaResponse, dll.
│   │   │   ├── venue.py            #   VenueCreate, VenueResponse, VenueDetailResponse
│   │   │   ├── court.py            #   CourtCreate, CourtResponse, CourtAvailability, TimeSlot
│   │   │   ├── booking.py          #   BookingCreate, BookingResponse, BookingDetailResponse
│   │   │   ├── payment.py          #   PaymentResponse, PaymentDetailResponse
│   │   │   ├── dashboard.py        #   DashboardStatsResponse, RevenueShareReport
│   │   │   └── notification.py     #   NotificationResponse
│   │   │
│   │   ├── routers/                # API route handlers (13 router)
│   │   │   ├── auth.py             #   /auth — register, login, profil, google login
│   │   │   ├── areas.py            #   /areas — CRUD daerah
│   │   │   ├── venues.py           #   /venues — CRUD GOR
│   │   │   ├── courts.py           #   /courts — CRUD lapangan + ketersediaan slot
│   │   │   ├── bookings.py         #   /bookings — buat, konfirmasi, batalkan, selesaikan
│   │   │   ├── payments.py         #   /payments — upload bukti, konfirmasi, tolak
│   │   │   ├── dashboard.py        #   /dashboard — statistik, grafik, rekap pendapatan
│   │   │   ├── users.py            #   /users — manajemen akun (Super Admin)
│   │   │   ├── notifications.py    #   /notifications — notifikasi pop-up pengguna
│   │   │   ├── chat.py             #   /chat — WebSocket untuk sistem live chat
│   │   │   ├── payouts.py          #   /payouts — Manajemen pencairan dana admin
│   │   │   ├── settings.py         #   /settings — Pengaturan sistem & aplikasi
│   │   │   └── testimonials.py     #   /testimonials — Ulasan & rating pengguna
│   │   │
│   │   ├── services/               # Business logic layer
│   │   │   ├── auth_service.py     #   Registrasi, pencarian user, validasi token
│   │   │   ├── booking_service.py  #   Cek slot, hitung harga, lock, konfirmasi, batal
│   │   │   ├── payment_service.py  #   Upload bukti, konfirmasi/tolak pembayaran
│   │   │   └── scheduler.py        #   Robot auto-cancel pesanan kadaluarsa
│   │   │
│   │   ├── utils/                  # Utility functions
│   │   │   ├── jwt.py              #   Create & verify JWT token
│   │   │   ├── dependencies.py     #   Auth dependencies (require_admin, require_super_admin)
│   │   │   └── helpers.py          #   Upload file ke Supabase Storage
│   │   │
│   │   ├── config.py               # Pydantic Settings (membaca .env)
│   │   ├── database.py             # AsyncEngine & session factory
│   │   └── main.py                 # FastAPI app entry point
│   │
│   ├── .env                        # Environment variables (DATABASE_URL, SECRET_KEY, dll.)
│   ├── requirements.txt            # Python dependencies
│   ├── create_admin.py             # Script untuk membuat akun Admin / Super Admin
│   ├── seed_data.py                # Script untuk mengisi data awal
│   └── migrate.py                  # Script migrasi database manual
│
├── frontend/                       # ── FRONTEND (React.js + Vite + Tailwind CSS) ──
│   │
│   ├── public/                     # Aset publik statis
│   │   └── bg-badminton.png        #   Background lapangan badminton
│   │
│   ├── src/                        # Source code utama aplikasi React
│   │   ├── components/             #   Komponen UI reusable (Navbar, Footer, Input, Card)
│   │   ├── context/                #   State management global (AuthContext, dll)
│   │   ├── pages/                  #   Komponen Halaman (Home, Login, Admin Dashboard)
│   │   ├── utils/                  #   Fungsi utilitas (api.js, formater harga, date helper)
│   │   ├── App.jsx                 #   Konfigurasi Routing (React Router v6)
│   │   ├── index.css               #   Global CSS dan Tailwind directives
│   │   └── main.jsx                #   Titik masuk (Entry point) aplikasi React
│   │
│   ├── package.json                # Daftar dependencies NPM dan script (dev, build)
│   ├── tailwind.config.js          # Konfigurasi custom Tailwind (warna, font)
│   └── vite.config.js              # Konfigurasi server Vite bundler
│
├── LAPORAN_PROGRESS.md             # Laporan progress pengembangan 5 minggu
├── README.md                       # Dokumentasi proyek (file ini)
└── .gitignore                      # Git ignore rules
```

---

## 📡 Daftar Endpoint API

### Autentikasi (`/auth`)

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| POST | `/auth/register` | Publik | Registrasi akun baru (default role: customer) |
| POST | `/auth/login` | Publik | Login, mengembalikan JWT access token |
| GET | `/auth/me` | Login | Mengambil data profil user yang sedang login |
| PUT | `/auth/me` | Login | Update nama dan nomor HP |
| PUT | `/auth/change-password` | Login | Ganti password (wajib input password lama) |
| POST | `/auth/me/profile-image` | Login | Upload foto profil ke Supabase Storage |

### Daerah (`/areas`)

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/areas` | Publik | Daftar semua daerah aktif |
| GET | `/areas/{id}/venues` | Publik | Daftar GOR dalam suatu daerah |
| POST | `/areas` | Super Admin | Tambah daerah baru |
| PUT | `/areas/{id}` | Super Admin | Edit data daerah |
| DELETE | `/areas/{id}` | Super Admin | Soft delete (nonaktifkan) daerah |

### GOR / Venue (`/venues`)

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/venues` | Publik / Admin | Daftar GOR (admin: hanya miliknya) |
| GET | `/venues/{id}` | Publik | Detail satu GOR beserta info daerah |
| GET | `/venues/{id}/courts` | Publik | Daftar lapangan aktif di GOR tertentu |
| POST | `/venues` | Admin | Tambah GOR baru (otomatis jadi milik admin) |
| POST | `/venues/upload-image` | Admin | Upload gambar GOR |
| PUT | `/venues/{id}` | Admin (pemilik) | Edit data GOR |
| DELETE | `/venues/{id}` | Super Admin | Nonaktifkan GOR |

### Lapangan (`/courts`)

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/courts` | Publik / Admin | Daftar lapangan (admin: hanya GOR miliknya) |
| GET | `/courts/{id}` | Publik | Detail lapangan beserta info GOR |
| GET | `/courts/{id}/availability?date_req=YYYY-MM-DD` | Publik | Cek ketersediaan slot per tanggal |
| POST | `/courts` | Admin | Tambah lapangan baru |
| PUT | `/courts/{id}` | Admin | Edit data lapangan |
| DELETE | `/courts/{id}` | Admin | Nonaktifkan lapangan |
| POST | `/courts/{id}/blocks` | Admin | Blokir slot waktu (maintenance/event) |
| GET | `/courts/{id}/blocks` | Admin | Daftar jadwal blokir per lapangan |
| DELETE | `/courts/blocks/{id}` | Admin | Hapus jadwal blokir |

### Booking (`/bookings`)

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/bookings` | Login | Daftar booking (customer: miliknya, admin: GOR-nya) |
| GET | `/bookings/{id}` | Login | Detail satu booking |
| POST | `/bookings` | Customer | Buat booking baru (lock slot 15 menit) |
| PUT | `/bookings/{id}/confirm` | Admin | Konfirmasi booking |
| PUT | `/bookings/{id}/cancel` | Login | Batalkan booking |
| PUT | `/bookings/{id}/complete` | Admin | Tandai booking selesai |

### Pembayaran (`/payments`)

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/payments` | Login | Daftar pembayaran (filtered by role) |
| POST | `/payments/{booking_id}/upload-proof` | Customer | Upload bukti bayar (foto + metode + jumlah) |
| PUT | `/payments/{id}/confirm` | Admin | Setujui pembayaran → status booking jadi `confirmed` |
| PUT | `/payments/{id}/reject` | Admin | Tolak pembayaran dengan alasan |

### Dashboard (`/dashboard`)

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/dashboard/stats` | Admin | Statistik harian (booking, revenue, pending, courts) |
| GET | `/dashboard/revenue` | Admin | Pendapatan per hari (7 hari terakhir) |
| GET | `/dashboard/weekly-revenue` | Admin | Alias dari `/revenue` (format hari) |
| GET | `/dashboard/occupancy` | Admin | Keterisian lapangan (7 hari terakhir) |
| GET | `/dashboard/court-occupancy` | Admin | Alias dari `/occupancy` |
| GET | `/dashboard/revenue-share?period=all` | Admin | Rekap pembagian pendapatan per admin |

### Pengguna (`/users`)

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/users` | Super Admin | Daftar seluruh pengguna terdaftar |
| PUT | `/users/{id}/role` | Super Admin | Ubah role pengguna (customer ↔ admin) |
| PUT | `/users/{id}/toggle` | Super Admin | Aktifkan/nonaktifkan akun pengguna |

### Notifikasi (`/notifications`)

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/notifications` | Login | Daftar notifikasi milik user |
| PUT | `/notifications/{id}/read` | Login | Tandai satu notifikasi sebagai sudah dibaca |
| PUT | `/notifications/read-all` | Login | Tandai semua notifikasi sudah dibaca |

---

## 🗄️ Skema Database

### Diagram Relasi

```
users ─────────────────────────────────────────┐
  │                                             │
  │ 1:N (owner)      1:N (user)    1:N (admin)  │ 1:N
  ▼                   ▼              ▼           ▼
venues              bookings     court_blocks  notifications
  │                   │
  │ 1:N               │ 1:1
  ▼                   ▼
courts              payments
  │
  │ N:1
  ▼
areas
```

### Tabel dan Kolom

| Tabel | Kolom Utama | Keterangan |
|-------|-------------|------------|
| `users` | id, name, email, phone, password_hash, role, profile_image, is_active | Pengguna sistem (3 role) |
| `areas` | id, name, province, description, is_active | Daerah/wilayah operasi |
| `venues` | id, owner_id → users, area_id → areas, name, address, phone, maps_url, image_url, is_active | GOR / tempat olahraga |
| `courts` | id, venue_id → venues, name, court_type, rental_type, price_regular, price_peak, price_monthly, peak_hours, is_active | Lapangan per GOR |
| `court_blocks` | id, court_id → courts, blocked_by → users, block_date, start_time, end_time, reason | Jadwal blokir |
| `bookings` | id, user_id → users, court_id → courts, booking_type, booking_date, start_time, end_time, total_price, status, expires_at | Data pemesanan |
| `payments` | id, booking_id → bookings, confirmed_by → users, amount, method, status, proof_image_url, rejection_reason, confirmed_at | Data pembayaran |
| `notifications` | id, user_id → users, title, message, is_read, related_entity_type, related_entity_id | Notifikasi in-app |

### Custom ENUM Types

| Type | Values |
|------|--------|
| `user_role` | customer, admin, super_admin |
| `court_type` | single, double, mixed |
| `rental_type` | hourly, monthly, both |
| `booking_status` | pending, confirmed, cancelled, completed, expired |
| `booking_type` | hourly, monthly |
| `payment_method` | transfer, cash, qris |
| `payment_status` | pending, paid, failed, refunded |

---

## 🛡️ Keamanan

| Aspek | Implementasi |
|-------|-------------|
| **Password Hashing** | bcrypt via passlib — password asli tidak pernah disimpan |
| **Autentikasi** | JWT (HS256) dengan expiry 24 jam — stateless, tidak ada session di server |
| **Otorisasi** | RBAC 3 level via FastAPI dependency injection — setiap endpoint dilindungi sesuai role |
| **Multi-Tenant** | Query di backend memfilter data berdasarkan `owner_id` — admin hanya melihat data GOR miliknya |
| **Input Validation** | Pydantic schema memvalidasi semua request body (tipe data, format, panjang, constraint) |
| **File Upload** | Validasi MIME type — hanya menerima file gambar |
| **CORS** | Dikonfigurasi via middleware FastAPI |
| **SQL Injection** | Dicegah oleh SQLAlchemy ORM — tidak ada raw SQL query |

---

## 📸 Screenshot

> Screenshot halaman-halaman utama akan ditambahkan di sini.

---

## 📝 Lisensi

Proyek ini dikembangkan untuk keperluan tugas mata kuliah Pemrograman Web. Tidak untuk penggunaan komersial tanpa izin.
