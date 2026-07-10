# LAPORAN PROGRESS PENGEMBANGAN PROYEK

**Nama Proyek:** JogjaCourt — Sistem Booking Lapangan Badminton Online
**Mata Kuliah:** Pemrograman Web
**Dosen Pengampu:** Andri Heru Saputra, S.Kom., M.Kom.

**Durasi Pengerjaan:** 6 Minggu
**Tanggal Mulai:** 12 Mei 2026
**Tanggal Selesai:** 20 Juni 2026

---

## MINGGU 1 — Analisis Kebutuhan, Perancangan Sistem, dan Inisialisasi Proyek

**Periode:** 12 Mei – 16 Mei 2026
**Target:** Menyusun konsep sistem secara matang, merancang arsitektur dan skema database, serta menyiapkan seluruh lingkungan pengembangan.

### Latar Belakang Pemilihan Topik

Saya mengambil topik Sistem Booking Lapangan Badminton karena terinspirasi dari pengalaman pribadi saat mau sewa lapangan badminton di sekitar Yogyakarta. Kebanyakan GOR badminton yang saya temui masih mengandalkan komunikasi via WhatsApp atau telepon untuk pemesanan. Masalahnya, cara ini sering menyebabkan bentrok jadwal — pernah kejadian saya datang ke GOR dan ternyata lapangan sudah dipakai orang lain, padahal saya merasa sudah konfirmasi via chat. Dari pengalaman itu, saya berpikir: bagaimana kalau ada sistem online yang bisa menunjukkan slot waktu yang masih tersedia secara real-time, sehingga tidak ada lagi kejadian dobel booking?

Selain itu, dari sisi pengelola GOR, mereka juga kesulitan merekap pendapatan harian karena semua dicatat manual di buku. Jadi sistem ini dirancang untuk menyelesaikan dua masalah sekaligus: kemudahan booking untuk pemain, dan kemudahan manajemen untuk pemilik GOR.

### Kegiatan yang Dilakukan

**Hari 1–2: Penyusunan Dokumen Perencanaan**

Saya memulai dengan membuat daftar fitur apa saja yang dibutuhkan oleh masing-masing jenis pengguna. Hasil analisis kebutuhan pengguna saya rangkum sebagai berikut:

| Jenis Pengguna | Kebutuhan Utama |
|----------------|----------------|
| Pemain (Customer) | Cari GOR berdasarkan daerah, lihat jadwal kosong, pesan slot, bayar, lihat riwayat |
| Pengelola GOR (Admin) | Kelola data GOR dan lapangan, verifikasi pembayaran, blokir jadwal untuk maintenance |
| Pemilik Platform (Super Admin) | Kelola semua data, manajemen akun pengguna, lihat statistik seluruh platform |

Dari daftar kebutuhan ini, saya menentukan bahwa sistem harus mendukung tiga level role pengguna (RBAC — Role-Based Access Control) dan arsitektur multi-tenant agar data antar pengelola GOR saling terisolasi.

**Hari 3: Perancangan Database**

Saya merancang skema database relasional dengan 8 tabel menggunakan PostgreSQL. Pemilihan PostgreSQL didasarkan pada kebutuhan akan tipe data UUID, fitur ENUM native, dan ketersediaan hosting gratis di Supabase. Awalnya saya mempertimbangkan MySQL karena lebih familiar, tapi PostgreSQL menawarkan fitur-fitur yang lebih cocok untuk proyek ini (terutama dukungan UUID sebagai primary key tanpa perlu extension tambahan di Supabase).

Berikut rancangan skema database yang saya buat:

```
Tabel              Primary Key    Foreign Key / Relasi
─────────────────────────────────────────────────────────────────
users               id (UUID)      — (tabel induk)
areas               id (UUID)      — (tabel induk)
venues              id (UUID)      → areas.id, → users.id (owner)
courts              id (UUID)      → venues.id
court_blocks        id (UUID)      → courts.id, → users.id (admin)
bookings            id (UUID)      → courts.id, → users.id
payments            id (UUID)      → bookings.id, → users.id (admin verifikator)
notifications       id (UUID)      → users.id
```

Setiap tabel menggunakan UUID v4 sebagai primary key agar ID tidak mudah ditebak dan aman untuk digunakan di URL publik. Relasi antar tabel dijaga dengan constraint foreign key dan ON DELETE CASCADE / SET NULL sesuai kebutuhan bisnis.

Saya juga merancang 7 custom ENUM type:
- `user_role` → customer, admin, super_admin
- `court_type` → single, double, mixed
- `rental_type` → hourly, monthly, both
- `booking_status` → pending, confirmed, cancelled, completed, expired
- `booking_type` → hourly, monthly
- `payment_method` → transfer, cash, qris
- `payment_status` → pending, paid, failed, refunded

**Hari 4–5: Pemilihan Stack Teknologi dan Setup Lingkungan**

Setelah skema database rampung, saya menentukan teknologi yang akan digunakan:

- **Backend:** Python 3.13 + FastAPI — saya memilih FastAPI karena mendukung async/await secara native (penting untuk koneksi database async ke Supabase) dan otomatis menghasilkan dokumentasi API interaktif (Swagger UI).
- **ORM:** SQLAlchemy 2.0 dengan mode asyncio — agar query ke database tidak blocking.
- **Database:** PostgreSQL 15 yang di-hosting di Supabase — dipilih karena gratis untuk skala pengembangan dan menyediakan connection pooling via PgBouncer.
- **Frontend:** HTML5, Vanilla JavaScript, dan Tailwind CSS via CDN — tanpa framework JS apapun (React/Vue/Angular) agar proyek tetap sederhana dan tidak membutuhkan build tools.
- **Autentikasi:** JWT (JSON Web Token) dengan library python-jose.
- **Hashing Password:** bcrypt via passlib.

Instalasi dan konfigurasi:
1. Membuat virtual environment Python (`python -m venv venv`)
2. Menginstall seluruh dependensi via `pip install` dan mendokumentasikannya di `requirements.txt`
3. Membuat project Supabase, mencatat connection string dan API key
4. Membuat file `.env` untuk menyimpan konfigurasi sensitif (database URL, JWT secret key, Supabase credentials)
5. Membuat struktur folder proyek:

```
Sistem Booking Lap.Badminton/
├── booking-badminton-api/       # Backend
│   ├── app/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── .env
│   └── requirements.txt
└── frontend/
    ├── admin/
    ├── assets/
    ├── js/
    └── *.html
```

### Hasil Minggu 1
- Dokumen analisis kebutuhan sistem selesai (3 role pengguna teridentifikasi)
- Skema database 8 tabel dengan seluruh relasi dan constraint sudah dirancang
- 7 tipe ENUM kustom sudah didefinisikan
- Arsitektur RESTful API sudah diputuskan
- Lingkungan pengembangan sudah siap (Python venv, Supabase project, folder structure)

### Kendala Minggu 1
- Sempat bingung menentukan cara menangani multi-tenancy (pemisahan data per admin GOR). Awalnya berpikir untuk menggunakan Row Level Security (RLS) bawaan Supabase, tapi akhirnya memutuskan untuk menangani di level aplikasi (backend) agar lebih fleksibel dan tidak terlalu bergantung pada fitur spesifik Supabase.
- Perlu waktu cukup lama untuk mempelajari perbedaan antara mode synchronous dan asynchronous di SQLAlchemy 2.0, karena dokumentasinya masih terbatas di sumber-sumber berbahasa Indonesia.

> [!WARNING]
> **PEMBERITAHUAN MIGRASI (JULI 2026):**
> Mulai tahap selanjutnya, arsitektur *frontend* sistem ini telah sepenuhnya **dimigrasikan ke React.js (Vite + Tailwind CSS)**. 
> Segala referensi tentang "Vanilla HTML/JS", "Alpine.js", atau "jQuery" di dalam laporan lama ini hanyalah sebagai **catatan sejarah (arsip)** dan tidak lagi mencerminkan arsitektur sistem yang berjalan saat ini.

---

## MINGGU 2 — Setup Koneksi Database, Model ORM, dan Schema Validasi

**Periode:** 19 Mei – 23 Mei 2026
**Target:** Menyiapkan koneksi database async ke Supabase, membangun seluruh model ORM, dan membuat schema validasi Pydantic untuk semua entitas.

### Kegiatan yang Dilakukan

**Hari 1–2: Koneksi Database Async dan Konfigurasi**

Langkah pertama adalah menyiapkan koneksi database async ke Supabase. File `database.py` berisi konfigurasi `AsyncEngine` dan `AsyncSessionLocal`. Yang tricky di sini adalah Supabase menggunakan PgBouncer sebagai connection pooler, sehingga saya harus menambahkan parameter khusus:

```python
engine = create_async_engine(
    DATABASE_URL,
    poolclass=NullPool,  # PgBouncer sudah handle pooling
    connect_args={"statement_cache_size": 0}  # Wajib untuk PgBouncer
)
```

Tanpa konfigurasi ini, koneksi ke database akan gagal dengan error `prepared statement already exists` — saya butuh waktu sekitar 2 jam untuk mendiagnosis masalah ini sampai menemukan solusinya di GitHub Issues SQLAlchemy.

Saya juga membuat file `config.py` menggunakan `pydantic-settings` untuk memuat semua konfigurasi dari file `.env` secara otomatis. Variabel yang dikonfigurasi:
- `DATABASE_URL` — connection string PostgreSQL (asyncpg)
- `SECRET_KEY` — kunci rahasia untuk signing JWT
- `ALGORITHM` — algoritma JWT (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` — masa berlaku token (1440 menit = 24 jam)
- `SUPABASE_URL` dan `SUPABASE_KEY` — credential untuk Supabase Storage API

**Hari 3–4: Pembuatan Model ORM (8 Model)**

Setelah koneksi berhasil, saya membuat 8 model ORM yang merepresentasikan setiap tabel di database. Setiap model dilengkapi dengan:
- Definisi kolom beserta tipe data dan constraint-nya
- Relationship antar model (One-to-Many, Many-to-One)
- Default value (misalnya `uuid.uuid4()` untuk primary key, `datetime.utcnow()` untuk timestamp)

Model yang dibuat:

1. **User** — Kolom: id, name, email, phone, password_hash, role (ENUM), profile_image, is_active, created_at. Relationship ke: venues (sebagai pemilik), bookings, confirmed_payments, court_blocks.
2. **Area** — Kolom: id, name, province, description, is_active. Relationship ke: venues.
3. **Venue** — Kolom: id, owner_id (FK→users), area_id (FK→areas), name, address, phone, maps_url, image_url, is_active. Relationship ke: owner (User), area (Area), courts.
4. **Court** — Kolom: id, venue_id (FK→venues), name, court_type (ENUM), rental_type (ENUM), price_regular, price_peak, price_monthly, peak_hours, is_active. Relationship ke: venue, bookings, court_blocks.
5. **CourtBlock** — Kolom: id, court_id (FK→courts), blocked_by (FK→users), block_date, start_time, end_time, reason. Relationship ke: court, admin (User).
6. **Booking** — Kolom: id, user_id (FK→users), court_id (FK→courts), booking_type (ENUM), booking_date, start_time, end_time, total_price, status (ENUM), expires_at. Relationship ke: user, court, payment.
7. **Payment** — Kolom: id, booking_id (FK→bookings, UNIQUE), confirmed_by (FK→users), amount, method (ENUM), status (ENUM), proof_image_url, rejection_reason, confirmed_at. Relationship ke: booking, admin (User).
8. **Notification** — Kolom: id, user_id (FK→users), title, message, is_read, related_entity_type, related_entity_id, created_at.

Salah satu hal yang perlu diperhatikan adalah penggunaan `uselist=False` pada relationship `Booking.payment` karena relasinya one-to-one (satu booking hanya punya satu payment), bukan one-to-many.

**Hari 5: Pembuatan Schema Pydantic (Validasi Data)**

Setiap entitas memiliki minimal 3 schema Pydantic:
- `*Create` — validasi data saat membuat record baru (field wajib, format email, panjang minimum password)
- `*Update` — validasi data saat mengupdate (semua field optional karena partial update)
- `*Response` — format data yang dikirim kembali ke frontend (menggunakan `ConfigDict(from_attributes=True)` agar bisa konversi langsung dari ORM object)

Untuk schema yang memiliki relasi nested, saya menggunakan response model bertingkat. Misalnya `BookingDetailResponse` berisi `CourtDetailResponse` yang di dalamnya berisi `VenueResponse` yang berisi `UserResponse`. Ini memungkinkan frontend mendapatkan semua data terkait dalam satu request API tanpa perlu melakukan banyak request terpisah.

Schema khusus yang juga dibuat:
- `TimeSlot` — untuk endpoint ketersediaan slot (berisi start_time, end_time, is_available, price, is_peak)
- `CourtAvailability` — wrapper untuk list TimeSlot per tanggal
- `DashboardStatsResponse` — untuk statistik dashboard
- `RevenueShareReport` dan `AdminRevenueShare` — untuk rekap pembagian pendapatan

### Hasil Minggu 2
- Koneksi async ke database Supabase berhasil (termasuk workaround untuk PgBouncer)
- Konfigurasi environment management dengan pydantic-settings berjalan
- 8 model ORM dengan seluruh relationship sudah dibuat dan ditest bisa create table
- Schema validasi Pydantic untuk semua entitas sudah lengkap (termasuk nested response model)
- Tabel otomatis dibuat saat server pertama kali dijalankan melalui `Base.metadata.create_all()`

### Kendala Minggu 2
- Error `prepared statement already exists` saat koneksi ke database Supabase. Akar masalahnya: PgBouncer menjalankan session pooling yang tidak cocok dengan statement caching bawaan asyncpg. Solusi: set `statement_cache_size=0` dan gunakan `NullPool`.
- Penulisan ENUM type di SQLAlchemy agak membingungkan. Harus menggunakan parameter `create_type=False` pada `Column(Enum(...))` karena type ENUM sudah dibuat manual di database Supabase. Tanpa parameter ini, SQLAlchemy akan mencoba membuat ENUM type lagi dan gagal karena sudah ada.

---

## MINGGU 3 — Pembangunan Endpoint REST API dan Logika Bisnis

**Periode:** 26 Mei – 30 Mei 2026
**Target:** Membangun seluruh endpoint API (router), sistem autentikasi JWT, otorisasi RBAC, dan logika bisnis inti (booking, payment, dashboard).

### Kegiatan yang Dilakukan

**Hari 1–2: Implementasi Router (Endpoint API)**

Saya membangun 9 router yang masing-masing menangani satu domain fungsional:

| Router | File | Endpoint | Fungsi |
|--------|------|----------|--------|
| Auth | `auth.py` | POST `/auth/register`, POST `/auth/login`, GET/PUT `/auth/me`, PUT `/auth/change-password`, POST `/auth/me/profile-image` | Registrasi, login, profil |
| Areas | `areas.py` | GET, POST, PUT, DELETE `/areas` | CRUD daerah |
| Venues | `venues.py` | GET, POST, PUT, DELETE `/venues`, POST `/venues/upload-image` | CRUD GOR + upload gambar |
| Courts | `courts.py` | GET, POST, PUT, DELETE `/courts`, GET `/courts/{id}/availability` | CRUD lapangan + cek slot |
| Bookings | `bookings.py` | GET, POST `/bookings`, PUT `/bookings/{id}/confirm`, `/cancel`, `/complete` | Manajemen booking |
| Payments | `payments.py` | GET `/payments`, POST `/payments/{id}/upload-proof`, PUT `/payments/{id}/confirm`, `/reject` | Verifikasi pembayaran |
| Dashboard | `dashboard.py` | GET `/dashboard/stats`, `/revenue`, `/weekly-revenue`, `/occupancy`, `/court-occupancy`, `/revenue-share` | Statistik dan laporan |
| Users | `users.py` | GET `/users`, PUT `/users/{id}/role`, `/users/{id}/toggle` | Manajemen akun (Super Admin) |
| Notifications | `notifications.py` | GET `/notifications`, PUT `/notifications/{id}/read`, `/notifications/read-all` | Notifikasi pengguna |

Total ada **32+ endpoint** yang dibangun. Setiap endpoint menggunakan dependency injection FastAPI untuk:
- Mendapatkan session database (`Depends(get_db)`)
- Mengautentikasi user (`Depends(get_current_user)`)
- Memvalidasi role akses (`Depends(require_admin)` atau `Depends(require_super_admin)`)

**Hari 3: Sistem Autentikasi dan Otorisasi**

*Autentikasi (JWT):*
- Saat login, server memvalidasi email dan password, lalu menghasilkan JWT token dengan masa berlaku 24 jam
- Token berisi user ID yang di-encode menggunakan algoritma HS256
- Setiap request ke endpoint yang membutuhkan autentikasi harus menyertakan header `Authorization: Bearer <token>`
- File `utils/jwt.py` berisi fungsi `create_access_token()` dan `verify_token()`

*Otorisasi (RBAC):*
- File `utils/dependencies.py` berisi 4 dependency function:
  - `get_current_user()` — memastikan token valid dan mengambil data user dari database
  - `get_optional_user()` — sama seperti di atas tapi tidak wajib (untuk endpoint yang bisa diakses publik maupun user yang login)
  - `require_admin()` — hanya mengizinkan user dengan role `admin` atau `super_admin`
  - `require_super_admin()` — hanya mengizinkan user dengan role `super_admin`

**Hari 4–5: Business Logic (Service Layer)**

Logika bisnis yang kompleks dipisahkan dari router ke folder `services/` agar kode lebih bersih dan mudah di-maintain:

- **`auth_service.py`** — Proses registrasi (cek duplikat email, hashing password) dan pencarian user

- **`booking_service.py`** — Ini file paling kompleks (±300 baris). Menangani:
  - Pengecekan ketersediaan slot — mempertimbangkan booking yang sudah ada, jadwal blokir, dan booking yang sedang di-lock 15 menit
  - Perhitungan harga otomatis berdasarkan jam reguler vs peak hour (peak hour didefinisikan per lapangan, misalnya "17-21" artinya jam 5 sore sampai 9 malam)
  - Mekanisme lock 15 menit untuk mencegah double-booking — saat customer checkout, slot langsung dikunci dengan status `pending` dan field `expires_at` diset 15 menit dari sekarang. Jika tidak dibayar dalam waktu tersebut, status otomatis berubah menjadi `expired`
  - Pembatalan booking — memvalidasi bahwa booking masih berstatus `pending` atau `confirmed` sebelum bisa dibatalkan
  - Konfirmasi dan penyelesaian booking — hanya bisa dilakukan oleh admin pemilik GOR terkait

- **`payment_service.py`** — Proses upload bukti bayar, konfirmasi pembayaran oleh admin (otomatis mengubah status booking menjadi `confirmed`), dan penolakan pembayaran dengan alasan (status booking kembali ke `pending` agar customer bisa upload ulang bukti baru)

*Upload File ke Supabase Storage:*
Untuk fitur upload bukti pembayaran dan foto profil, saya membuat fungsi helper `upload_image_to_supabase()` di `utils/helpers.py` yang mengirim file ke Supabase Storage bucket via REST API menggunakan library `httpx` dan mengembalikan URL publik dari file yang diupload.

### Hasil Minggu 3
- 32+ endpoint REST API sudah berfungsi dan bisa diuji melalui Swagger UI (`http://localhost:8000/docs`)
- Sistem autentikasi JWT dan otorisasi RBAC 3 level berjalan dengan baik
- Logika bisnis inti (cek ketersediaan, hitung harga, lock slot, verifikasi pembayaran) sudah diimplementasikan
- Upload file ke Supabase Storage berfungsi
- Multi-tenant sudah diimplementasikan — admin hanya bisa melihat dan mengelola data GOR miliknya sendiri

### Kendala Minggu 3
- Versi `bcrypt` yang tidak kompatibel dengan `passlib`. Harus pin versi `bcrypt==4.0.1` secara spesifik di `requirements.txt` agar tidak ada konflik.
- Sempat kesulitan dengan upload file ke Supabase Storage karena dokumentasinya kurang jelas untuk penggunaan via Python. Akhirnya menggunakan pendekatan REST API langsung dengan `httpx` untuk mengirim file ke endpoint Storage Supabase.
- Query untuk endpoint dashboard cukup rumit karena harus melakukan banyak JOIN antar tabel (Payment → Booking → Court → Venue) sambil tetap memfilter berdasarkan kepemilikan admin. Butuh beberapa kali iterasi sampai query-nya benar dan performant.

---

## MINGGU 4 — Pembangunan Frontend: Halaman Publik dan Alur Customer

**Periode:** 2 Juni – 6 Juni 2026
**Target:** Membangun seluruh antarmuka pengguna (halaman publik) yang terintegrasi penuh dengan backend API.

### Kegiatan yang Dilakukan

**Hari 1: Fondasi JavaScript — API Client dan Auth Helper**

Sebelum membuat halaman HTML, saya membuat dua file JavaScript yang menjadi fondasi komunikasi frontend–backend:

- `js/api.js` — Wrapper untuk `fetch()` yang secara otomatis:
  - Menyisipkan header `Authorization: Bearer <token>` pada setiap request jika user sudah login
  - Menangani response JSON dan error handling
  - Redirect ke halaman login jika mendapat response 401 (token expired)
  - Menyediakan method `api.get()`, `api.post()`, `api.put()`, `api.delete()` untuk kemudahan penggunaan

- `js/auth.js` — Helper autentikasi yang menangani:
  - Penyimpanan dan pengambilan token dan data user di `localStorage`
  - Fungsi `auth.isAuthenticated()` untuk mengecek status login
  - Fungsi `auth.getUser()` untuk mendapatkan data user yang sedang login
  - Fungsi `auth.logout()` untuk membersihkan session
  - Merender navigasi secara kondisional (menampilkan nama user jika sudah login, atau tombol Login/Daftar jika belum)

**Hari 2: Halaman Autentikasi (Login dan Registrasi)**

- `login.html` — Form login dengan validasi email dan password. Background menggunakan foto lapangan badminton dengan overlay gradasi gelap agar terkesan premium. Setelah berhasil login, token dan data user disimpan di `localStorage` lalu redirect ke halaman utama. Ada juga penanganan khusus untuk CSS `webkit-autofill` agar form tetap terlihat bagus di dark mode saat browser auto-fill password.

- `register.html` — Form pendaftaran dengan validasi di sisi client:
  - Nama lengkap (wajib)
  - Email (format valid)
  - Nomor HP (opsional)
  - Password (minimal 6 karakter)
  - Konfirmasi password (harus sama)

Kedua halaman ini memiliki desain yang konsisten — dark mode dengan aksen warna kuning keemasan (brand color `#D4AF37`).

**Hari 3: Landing Page (`index.html`)**

Halaman utama yang menjadi etalase sistem. Saya menghabiskan waktu paling banyak di halaman ini karena ini first impression pengguna. Komponen yang ada:

- **Hero Section** — Background foto lapangan badminton dengan overlay gelap, judul besar menggunakan font Bebas Neue, tagline, dan tombol CTA (Call-to-Action) "Booking Sekarang"
- **Statistik Platform** — Counter animasi (jumlah GOR, lapangan, pengguna terdaftar) — data diambil real dari API
- **Daftar Daerah** — Grid kartu daerah yang tersedia, diambil dinamis dari endpoint `/areas`
- **Cara Kerja** — Step-by-step guide (3 langkah) yang menjelaskan alur penggunaan sistem
- **Fitur Unggulan** — Highlight fitur-fitur utama (Real-time Availability, Lock 15 Menit, Multi-GOR)
- **Navigasi Responsif** — Navbar dengan logo, menu utama, dan tombol login/profil. Di layar mobile, berubah menjadi hamburger menu

**Hari 4: Halaman Pencarian dan Pemesanan**

Saya membangun alur pencarian bertahap (multi-step):

1. `locations.html` — **Pilih Daerah.** Menampilkan semua daerah aktif dalam bentuk grid kartu. Setiap kartu menunjukkan nama daerah, provinsi, dan jumlah GOR.

2. `venues.html` — **Pilih GOR.** Daftar GOR dalam suatu daerah, lengkap dengan foto, alamat, telepon, dan tombol Google Maps. Ada breadcrumb navigation.

3. `courts.html` — **Pilih Lapangan dan Jadwal.** Detail GOR dan daftar lapangan beserta harga. Pengguna bisa memilih tanggal (Flatpickr date picker), melihat slot waktu 08:00–23:00 dalam format grid visual (hijau = tersedia, merah = sudah dipesan), dan memilih slot untuk dipesan.

4. `booking.html` — **Checkout.** Ringkasan pesanan (nama lapangan, tanggal, jam, total harga). Setelah konfirmasi, slot langsung dikunci 15 menit.

**Hari 5: Halaman Akun Customer**

- `my-bookings.html` — Riwayat pesanan milik pengguna. Status ditampilkan dengan badge berwarna:
  - 🟡 Kuning = Menunggu Pembayaran (Pending)
  - 🔵 Biru = Sudah Dikonfirmasi (Confirmed)
  - 🟢 Hijau = Selesai (Completed)
  - 🔴 Merah = Dibatalkan (Cancelled)
  - ⚫ Abu = Kedaluwarsa (Expired)

  Ada tombol "Upload Bukti Bayar" untuk booking pending, dan tombol "Batalkan" untuk membatalkan pesanan.

- `profile.html` — Halaman profil dengan fitur upload foto profil, edit nama/telepon, dan ganti password.

### Hasil Minggu 4
- 9 halaman publik selesai dan terintegrasi penuh dengan backend API
- Semua data ditampilkan secara dinamis dari API (tidak ada data hardcode di HTML)
- Alur end-to-end customer sudah berjalan: Cari Daerah → Pilih GOR → Pilih Lapangan → Pilih Jadwal → Checkout → Upload Bukti Bayar
- Tampilan responsif di desktop, tablet, dan mobile
- Navigasi kondisional (tampilan berbeda untuk user yang sudah/belum login)

### Kendala Minggu 4
- CORS error saat pertama kali frontend memanggil API backend. Diselesaikan dengan menambahkan middleware CORS di `main.py` FastAPI (`allow_origins=["*"]`).
- Tabel data di halaman riwayat booking meluber keluar layar di perangkat mobile. Diperbaiki dengan menambahkan `overflow-x-auto` pada container tabel dan menggunakan layout card untuk tampilan mobile.
- Masalah timezone — booking yang dibuat di frontend (WIB, UTC+7) tidak cocok dengan waktu di database (UTC). Untuk sementara saya menggunakan UTC di backend dan melakukan konversi di frontend saat menampilkan waktu.

---

## MINGGU 5 — Pembangunan Panel Admin dan Dashboard

**Periode:** 9 Juni – 13 Juni 2026
**Target:** Membangun seluruh halaman admin panel beserta dashboard statistik, grafik, dan fitur manajemen data.

### Kegiatan yang Dilakukan

**Hari 1: Komponen Sidebar Admin (Shared Component)**

Salah satu tantangan dalam membangun panel admin multi-halaman dengan vanilla HTML/JS (tanpa framework) adalah bagaimana cara membuat komponen yang bisa dipakai berulang tanpa copy-paste kode. Solusi saya: membuat file `js/admin-sidebar.js` yang meng-generate sidebar secara dinamis via JavaScript.

File ini berisi class `AdminSidebar` dengan arsitektur sebagai berikut:
- **Data-driven navigation** — Daftar menu disimpan dalam array `NAV_ITEMS`, masing-masing berisi id, href, ikon (Lucide icon name), label, dan grup
- **Role-based rendering** — Menu tertentu (Daerah, Akun Pengguna) hanya dimunculkan untuk Super Admin
- **Dynamic injection** — Saat halaman dimuat, sidebar di-inject ke dalam DOM menggunakan `innerHTML`. Setiap perubahan menu cukup dilakukan di satu file
- **Mobile overlay menu** — Untuk layar kecil, sidebar berubah menjadi overlay menu yang bisa dibuka via hamburger button
- **Active state** — Menu yang sedang aktif otomatis di-highlight berdasarkan parameter `pageId`
- **Badge notifikasi** — Menampilkan jumlah pembayaran pending di badge sidebar
- **Topbar** — Di-generate juga oleh komponen ini, berisi breadcrumb, judul halaman, dan tombol notifikasi

Dengan pendekatan ini, seluruh 8 halaman admin cukup memanggil satu baris kode:
```javascript
AdminSidebar.init('dashboard'); // atau 'bookings', 'payments', dll.
```

**Hari 2: Dashboard Admin (`admin/dashboard.html`)**

Halaman dashboard menampilkan ringkasan operasional:

- **4 Kartu Statistik:**
  - Total Booking Hari Ini (ikon kalender)
  - Pendapatan Hari Ini dalam Rupiah (ikon trending-up)
  - Pembayaran Menunggu Verifikasi (ikon clock)
  - Jumlah Lapangan Aktif (ikon layout-grid)

- **Grafik Pendapatan 7 Hari Terakhir** — Bar chart menggunakan Chart.js dari endpoint `/dashboard/weekly-revenue`.

- **Grafik Keterisian Lapangan** — Horizontal bar chart yang menunjukkan jumlah booking per lapangan dalam 7 hari terakhir.

- **Aksi Cepat (Super Admin)** — Grid tombol shortcut ke halaman-halaman penting.

- **Rekap Pendapatan (Revenue Share)** — Tabel pembagian pendapatan per admin GOR:
  - Nama admin dan GOR yang dikelola
  - Pendapatan kotor (total dari pembayaran customer)
  - Potongan biaya platform (Rp 5.000/transaksi per jam, Rp 15.000/transaksi per bulan)
  - Pendapatan bersih yang diterima admin
  - Filter periode: Hari Ini, Bulan Ini, Bulan Lalu, Semua Waktu

**Hari 3: Halaman Manajemen Data**

- `admin/areas.html` — CRUD daerah/wilayah (khusus Super Admin). Tabel dengan kolom nama daerah, provinsi, jumlah GOR, status. Modal form untuk tambah/edit.

- `admin/venues.html` — CRUD data GOR. Tabel GOR dengan kolom nama, daerah, alamat, telepon, pemilik, status. Modal form dengan field nama, alamat, telepon, link Google Maps, URL gambar, dropdown daerah. Admin biasa hanya melihat GOR miliknya.

- `admin/courts.html` — CRUD data lapangan. Tabel lapangan dengan kolom nama, GOR, tipe (single/double/mixed), jenis sewa (perjam/bulanan/keduanya), harga reguler, harga peak, harga bulanan, status. Ada tombol "Nonaktifkan Semua" untuk menonaktifkan seluruh lapangan sekaligus.

**Hari 4: Halaman Manajemen Transaksi**

- `admin/bookings.html` — Daftar semua booking. Admin bisa mengkonfirmasi, menyelesaikan, atau membatalkan booking. Ada filter status dan pencarian.

- `admin/payments.html` — Verifikasi pembayaran. Preview bukti transfer, tombol "Setujui" dan "Tolak" dengan field alasan penolakan. Filter status dan badge jumlah pending di sidebar.

- `admin/court-blocks.html` — Manajemen jadwal blokir lapangan. Form blokir slot waktu dengan dropdown GOR dan lapangan yang saling terhubung (pilih GOR dulu, baru muncul lapangannya). Tabel jadwal blokir yang sudah dibuat.

**Hari 5: Halaman Manajemen Pengguna**

- `admin/users.html` — Khusus Super Admin. Tabel pengguna dengan fitur:
  - Pencarian berdasarkan nama atau email
  - Filter berdasarkan role dan status
  - Toggle switch untuk mengaktifkan/menonaktifkan akun
  - Dropdown untuk mengubah role (Customer ↔ Admin)
  - Proteksi: Super Admin tidak bisa mengubah role Super Admin lain

### Hasil Minggu 5
- 8 halaman admin panel selesai dan berfungsi penuh
- Dashboard menampilkan statistik real-time dari database
- Semua operasi CRUD (Create, Read, Update, Delete) berjalan melalui REST API
- Sidebar responsif dengan role-based menu visibility
- Rekap pembagian pendapatan (Revenue Share) berfungsi dengan perhitungan potongan platform yang akurat

### Kendala Minggu 5
- Chart.js tidak muncul karena script CDN belum dimuat di `<head>`. Diselesaikan dengan menambahkan CDN Chart.js sebelum script halaman.
- Modal form tidak ter-reset setelah submit berhasil — field masih terisi data lama. Diperbaiki dengan menambahkan `form.reset()` secara eksplisit di callback sukses.
- Grafik occupancy sempat menampilkan data lapangan milik admin lain. Penyebabnya: query di endpoint `/dashboard/occupancy` tidak memfilter berdasarkan `owner_id`. Diperbaiki dengan menambahkan JOIN ke tabel Venue dan WHERE clause.

---

## MINGGU 6 — Notifikasi, Penyempurnaan UI, Bug Fixing, dan Finalisasi

**Periode:** 16 Juni – 20 Juni 2026
**Target:** Menambahkan sistem notifikasi, memperbaiki seluruh bug visual dan fungsional, mengoptimasi kode, dan menyiapkan dokumentasi akhir.

### Kegiatan yang Dilakukan

**Hari 1: Sistem Notifikasi In-App**

Saya membangun sistem notifikasi agar pengguna mendapat pemberitahuan tentang aktivitas yang relevan:

- Membuat file `js/notifications.js` yang menangani:
  - Polling notifikasi baru setiap 30 detik
  - Dropdown notifikasi di navbar (baik di halaman publik maupun admin)
  - Badge counter untuk jumlah notifikasi yang belum dibaca
  - Format waktu relatif ("5 menit yang lalu", "kemarin")
  - Tombol "Tandai Semua Sudah Dibaca"

- Integrasi di semua halaman — notifikasi bisa diakses dari navbar di halaman publik maupun dari topbar di halaman admin

Notifikasi dikirim otomatis saat:
- Customer membuat booking baru → admin GOR terkait mendapat notifikasi
- Admin mengkonfirmasi/menolak pembayaran → customer mendapat notifikasi
- Booking kedaluwarsa (15 menit tidak dibayar) → customer mendapat notifikasi

**Hari 2–3: Penyempurnaan Tampilan (UI Polish)**

Saya melakukan audit visual menyeluruh pada semua 17 halaman dan memperbaiki beberapa masalah:

- **Standardisasi warna background** di seluruh halaman admin — sebelumnya ada inkonsistensi antara `#0A0A0A` dan `#080808`. Diseragamkan ke `#080808`.
- **Perbaikan tailwind config** — Token warna `dark.surface`, `dark.border`, `dark.card` diseragamkan di semua halaman agar tampilan identik.
- **Hamburger menu mobile** — Diperbaiki struktur topbar di semua halaman admin agar hamburger menu muncul dengan benar di layar kecil.
- **Scrollbar kustom** — Menambahkan scrollbar tipis dan gelap yang konsisten di semua halaman.
- **Responsive padding** — Memastikan semua content area menggunakan `p-6 md:p-8`.
- **Card hover effect** — Menambahkan efek hover ringan pada kartu di halaman admin.
- **Logo transparan** — Logo `logo.png` memiliki background hitam pekat yang terlihat kotak. Diperbaiki menggunakan Python Image Library (Pillow) untuk membuat background transparan.
- **CSS Autofill** — Input field berubah warna putih terang saat browser auto-fill di dark mode. Diperbaiki dengan aturan CSS `-webkit-autofill`.

**Hari 4: Bug Fixing dan Optimasi Kode**

*Bug fungsional yang diperbaiki:*
- **Ikon Lucide tidak muncul** — CDN versi lama (`cdnjs.cloudflare.com/ajax/libs/lucide/0.263.1`) ternyata sudah tidak bisa diakses (HTTP 404). Diganti ke CDN resmi (`unpkg.com/lucide@latest`) di semua 14 halaman HTML.
- **Error 500 pada endpoint `/venues`** — Disebabkan oleh `MissingGreenlet` error karena SQLAlchemy async gagal lazy-load relasi `Venue.owner`. Diperbaiki dengan menambahkan `selectinload(Venue.owner)` di semua query venues, courts, dan payments.
- **Duplikasi CSS** — Beberapa halaman admin (`court-blocks.html`, `users.html`) memiliki style sidebar/role-badge duplikat yang sudah di-handle oleh `admin-sidebar.js`. Dihapus untuk mengurangi ukuran file.

*Pembersihan repositori:*
- Menghapus file script Python sementara (`update_colors.py`, `enlarge_logo.py`, dsb.)
- Memindahkan file gambar (`logo.png`, `bg-badminton.png`) dari root `frontend/` ke folder `frontend/assets/` agar struktur lebih rapi
- Memperbarui semua referensi path gambar di seluruh file HTML dan JS
- Menghapus referensi gambar demo dari situs eksternal (Unsplash), diganti dengan aset lokal

**Hari 5: Pengujian Akhir, Seed Data, dan Dokumentasi**

*Seed Data:*
Membuat script `seed_data.py` untuk mengisi database dengan data awal yang realistis:
- 1 akun Super Admin default
- 4 daerah di D.I. Yogyakarta (Kota Yogyakarta, Sleman, Bantul, Gunungkidul)
- 5 GOR dengan nama, alamat, dan kontak yang realistis
- 13 lapangan dengan variasi harga Rp 30.000–Rp 60.000 (reguler) dan Rp 50.000–Rp 80.000 (peak hour)

*Pengujian End-to-End:*

| Skenario Uji | Hasil |
|--------------|-------|
| Registrasi akun baru (customer) | ✅ Berhasil |
| Login dengan email dan password | ✅ Berhasil |
| Alur booking: cari GOR → pilih lapangan → pilih jadwal → checkout | ✅ Berhasil |
| Upload bukti pembayaran (transfer/QRIS) | ✅ Berhasil |
| Admin: verifikasi/tolak pembayaran | ✅ Berhasil |
| Admin: blokir jadwal lapangan (maintenance) | ✅ Berhasil |
| Slot yang diblokir tidak muncul untuk customer | ✅ Berhasil |
| Multi-tenant: Admin A tidak bisa lihat data Admin B | ✅ Berhasil |
| Super Admin: lihat semua data + kelola user | ✅ Berhasil |
| Dashboard: statistik dan grafik real-time | ✅ Berhasil |
| Rekap pembagian pendapatan (Revenue Share) | ✅ Berhasil |
| Notifikasi masuk saat ada booking baru | ✅ Berhasil |
| Responsif di desktop, tablet, dan mobile | ✅ Berhasil |
| Lock slot 15 menit mencegah double booking | ✅ Berhasil |

*Dokumentasi:*
- Membuat `README.md` lengkap dengan deskripsi proyek, arsitektur sistem, daftar fitur, penjelasan role, teknologi, cara menjalankan, struktur folder, daftar endpoint API, skema database, dan catatan keamanan
- Membuat `LAPORAN_PROGRESS.md` (dokumen ini) yang mendokumentasikan seluruh proses pengembangan selama 6 minggu

### Hasil Minggu 6
- Sistem notifikasi in-app berfungsi untuk semua role pengguna
- Seluruh bug visual dan fungsional telah diperbaiki
- Kode sumber bersih, terstruktur, dan bebas dari file sementara
- Referensi gambar sudah menggunakan aset lokal (tidak ada lagi gambar dari sumber eksternal)
- Pengujian end-to-end menunjukkan semua fitur berjalan sesuai spesifikasi
- Dokumentasi proyek lengkap (README.md dan LAPORAN_PROGRESS.md)

### Kendala Minggu 6
- Ikon Lucide yang hilang memakan waktu cukup lama untuk didiagnosis karena awalnya saya mengira masalahnya ada di kode JavaScript, padahal ternyata CDN-nya yang sudah tidak aktif.
- Error `MissingGreenlet` di endpoint `/venues` cukup membingungkan karena pesan errornya tidak langsung menunjuk ke penyebab sebenarnya (lazy loading di konteks async). Butuh waktu untuk membaca dokumentasi SQLAlchemy tentang async relationships.
- Saat memindahkan file gambar ke folder `assets/`, sempat lupa mengupdate path di beberapa file sehingga gambar tidak muncul. Diselesaikan dengan melakukan search-and-replace secara batch.

---

## RINGKASAN CAPAIAN PROYEK

### Statistik Proyek

| Aspek | Detail |
|-------|--------|
| Jumlah Tabel Database | 8 tabel (users, areas, venues, courts, court_blocks, bookings, payments, notifications) |
| Custom ENUM Types | 7 tipe (user_role, court_type, rental_type, booking_status, booking_type, payment_method, payment_status) |
| Jumlah Endpoint API | 32+ endpoint REST (GET, POST, PUT, DELETE) |
| Jumlah Halaman Frontend | 17 halaman (9 publik + 8 admin) |
| Jumlah File JavaScript | 4 modul (api.js, auth.js, admin-sidebar.js, notifications.js) |
| Framework Backend | FastAPI 0.115 (Python 3.13) |
| Database | PostgreSQL 15 (Supabase) |
| ORM | SQLAlchemy 2.0 (Async Mode) |
| Autentikasi | JWT (HS256, 24 jam expiry) + bcrypt password hashing |
| Otorisasi | RBAC 3 level (Customer → Admin → Super Admin) |
| Multi-Tenancy | Ya (data per admin GOR terisolasi) |
| Responsive Design | Ya (desktop, tablet, mobile) |
| File Upload | Supabase Storage (bukti bayar, foto profil, gambar GOR) |
| Real-time Notification | Ya (polling setiap 30 detik) |
| Revenue Sharing | Ya (potongan Rp 5.000/jam, Rp 15.000/bulan per transaksi) |

### Daftar Endpoint API

| No | Method | Endpoint | Akses | Keterangan |
|----|--------|----------|-------|------------|
| 1 | POST | `/auth/register` | Publik | Daftar akun baru |
| 2 | POST | `/auth/login` | Publik | Login, mendapat JWT token |
| 3 | GET | `/auth/me` | Login | Lihat data profil sendiri |
| 4 | PUT | `/auth/me` | Login | Update nama dan nomor HP |
| 5 | PUT | `/auth/change-password` | Login | Ganti password |
| 6 | POST | `/auth/me/profile-image` | Login | Upload foto profil |
| 7 | GET | `/areas` | Publik | Daftar semua daerah aktif |
| 8 | GET | `/areas/{id}/venues` | Publik | Daftar GOR dalam suatu daerah |
| 9 | POST | `/areas` | Super Admin | Tambah daerah baru |
| 10 | PUT | `/areas/{id}` | Super Admin | Edit data daerah |
| 11 | DELETE | `/areas/{id}` | Super Admin | Nonaktifkan daerah |
| 12 | GET | `/venues` | Publik/Admin | Daftar GOR (admin: hanya miliknya) |
| 13 | GET | `/venues/{id}` | Publik | Detail satu GOR |
| 14 | POST | `/venues` | Admin | Tambah GOR baru |
| 15 | POST | `/venues/upload-image` | Admin | Upload gambar GOR |
| 16 | PUT | `/venues/{id}` | Admin | Edit data GOR |
| 17 | DELETE | `/venues/{id}` | Super Admin | Nonaktifkan GOR |
| 18 | GET | `/courts` | Publik/Admin | Daftar lapangan |
| 19 | GET | `/courts/{id}` | Publik | Detail lapangan |
| 20 | GET | `/courts/{id}/availability` | Publik | Cek ketersediaan slot per tanggal |
| 21 | POST | `/courts` | Admin | Tambah lapangan baru |
| 22 | PUT | `/courts/{id}` | Admin | Edit data lapangan |
| 23 | DELETE | `/courts/{id}` | Admin | Nonaktifkan lapangan |
| 24 | GET | `/bookings` | Login | Daftar booking |
| 25 | POST | `/bookings` | Customer | Buat booking baru (lock 15 menit) |
| 26 | PUT | `/bookings/{id}/confirm` | Admin | Konfirmasi booking |
| 27 | PUT | `/bookings/{id}/cancel` | Login | Batalkan booking |
| 28 | PUT | `/bookings/{id}/complete` | Admin | Tandai selesai |
| 29 | GET | `/payments` | Login | Daftar pembayaran |
| 30 | POST | `/payments/{id}/upload-proof` | Customer | Upload bukti bayar |
| 31 | PUT | `/payments/{id}/confirm` | Admin | Setujui pembayaran |
| 32 | PUT | `/payments/{id}/reject` | Admin | Tolak pembayaran |
| 33 | GET | `/dashboard/stats` | Admin | Statistik harian |
| 34 | GET | `/dashboard/weekly-revenue` | Admin | Pendapatan 7 hari |
| 35 | GET | `/dashboard/occupancy` | Admin | Keterisian lapangan 7 hari |
| 36 | GET | `/dashboard/revenue-share` | Admin | Rekap pembagian pendapatan |
| 37 | GET | `/users` | Super Admin | Daftar seluruh pengguna |
| 38 | PUT | `/users/{id}/role` | Super Admin | Ubah role pengguna |
| 39 | PUT | `/users/{id}/toggle` | Super Admin | Aktifkan/nonaktifkan akun |
| 40 | GET | `/notifications` | Login | Daftar notifikasi |
| 41 | PUT | `/notifications/{id}/read` | Login | Tandai notifikasi dibaca |
| 42 | PUT | `/notifications/read-all` | Login | Tandai semua dibaca |

### Diagram Relasi Database

```
                    ┌─────────────┐
                    │    users    │
                    │─────────────│
                    │ id (PK)     │
                    │ name        │
                    │ email       │
                    │ phone       │
                    │ password_hash│
                    │ role        │
                    │ profile_image│
                    │ is_active   │
                    │ created_at  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┬─────────────────┐
           │               │               │                 │
           ▼               ▼               ▼                 ▼
    ┌──────────┐    ┌──────────┐    ┌─────────────┐   ┌──────────────┐
    │  venues  │    │ bookings │    │ court_blocks│   │notifications │
    │──────────│    │──────────│    │─────────────│   │──────────────│
    │ owner_id │◄───│ user_id  │    │ blocked_by  │   │ user_id      │
    │ area_id  │    │ court_id │    │ court_id    │   │ title        │
    │ name     │    │ booking_ │    │ block_date  │   │ message      │
    │ address  │    │   type   │    │ start_time  │   │ is_read      │
    │ phone    │    │ booking_ │    │ end_time    │   └──────────────┘
    │ maps_url │    │   date   │    │ reason      │
    │ image_url│    │ start/end│    └─────────────┘
    │ is_active│    │ total_   │
    └────┬─────┘    │   price  │
         │          │ status   │
         │          │ expires_ │
         │          │   at     │
         │          └────┬─────┘
         │               │
    ┌────┴─────┐    ┌────┴─────┐
    │  areas   │    │ payments │
    │──────────│    │──────────│
    │ name     │    │booking_id│
    │ province │    │confirmed_│
    │ descript.│    │   by     │
    │ is_active│    │ amount   │
    └──────────┘    │ method   │
                    │ status   │
         ┌──────┐   │proof_img │
         │courts│   │rejection_│
         │──────│   │  reason  │
         │venue_│   └──────────┘
         │  id  │
         │ name │
         │court_│
         │ type │
         │rental│
         │ type │
         │price_│
         │regular│
         │price_│
         │ peak │
         │price_│
         │monthly│
         │peak_ │
         │hours │
         └──────┘
```

### Keamanan yang Diimplementasikan

| Aspek | Implementasi |
|-------|-------------|
| Password | Hashing dengan bcrypt (passlib). Password asli tidak pernah disimpan di database. |
| Session | JWT token dengan expiry 24 jam. Token disimpan di localStorage, dikirim via header Authorization. |
| Akses API | RBAC 3 level via dependency injection FastAPI. Endpoint sensitif dilindungi dengan `require_admin()` atau `require_super_admin()`. |
| Multi-Tenant | Data admin GOR saling terisolasi. Query di level backend memfilter berdasarkan `owner_id`. |
| Upload File | Validasi MIME type sebelum upload. Hanya file gambar yang diizinkan. |
| CORS | Dikonfigurasi di middleware FastAPI. |
| Input Validation | Pydantic schema memvalidasi semua data masuk (tipe data, format email, panjang minimum, dsb.). |

---

*Laporan ini disusun berdasarkan catatan progres pengerjaan aktual selama 6 minggu pengembangan. Seluruh fitur yang disebutkan telah diimplementasikan dan diuji secara fungsional.*
