# 🏸 JogjaCourt - Sistem Booking Lapangan Badminton

JogjaCourt adalah platform sistem manajemen dan booking lapangan badminton modern. Dibangun dengan antarmuka yang elegan (Dark Mode + Glassmorphism) dan backend yang tangguh, sistem ini memudahkan pengguna untuk mencari, memesan, dan membayar sewa lapangan badminton secara online, sekaligus memudahkan admin dalam mengelola GOR dan pesanan.

## ✨ Fitur Utama

### 👤 Untuk Pengguna (Pemain)
- **Cari GOR & Lapangan:** Temukan lapangan badminton di berbagai daerah dengan mudah.
- **Jadwal Real-time:** Cek ketersediaan lapangan secara langsung.
- **Sistem Lock 15 Menit:** Saat melakukan booking, slot waktu akan terkunci otomatis selama 15 menit agar tidak direbut orang lain (menghindari *double-booking*).
- **Upload Bukti Pembayaran:** Kemudahan mengunggah foto bukti transfer langsung dari sistem.
- **Riwayat Booking:** Lacak status pesanan (Menunggu Pembayaran, Dikonfirmasi, Selesai, Dibatalkan).
- **Mobile Friendly:** Tampilan responsif yang nyaman dibuka di HP maupun Laptop.

### 🛡️ Untuk Admin
- **Manajemen Data:** Mengelola data Area/Daerah, GOR (Venue), dan Lapangan (Court).
- **Kelola Harga:** Mengatur harga Reguler dan harga *Peak Hour*.
- **Konfirmasi Pembayaran:** Memverifikasi bukti pembayaran yang diunggah oleh pengguna dan mengubah status booking.
- **Dashboard Admin:** Ringkasan statistik dan operasional tingkat GOR.

### 👑 Untuk Super Admin
- **Manajemen Pengguna:** Melihat seluruh daftar pengguna dan mengelola peran (role) mereka (menjadikan admin/menghapus akun).
- **Kontrol Penuh Sistem:** Mengakses semua fitur admin di seluruh GOR dan memonitor data keseluruhan platform JogjaCourt.

---

## 👥 Role Pengguna (User Roles)

Sistem ini memiliki tiga jenis role (peran) pengguna dengan hak akses yang berbeda:

### 1. User (Pengguna Biasa / Pemain)
Role default saat mendaftar akun baru. Hak akses yang dimiliki:
- Melihat daftar GOR dan ketersediaan lapangan.
- Melakukan booking lapangan.
- Melihat riwayat booking pribadi.
- Mengunggah bukti pembayaran.
- Mengedit profil pribadi.

### 2. Admin (Mitra / Pengelola GOR)
Role khusus untuk pengelola bisnis yang memiliki GOR. Hak akses yang dimiliki (Multi-Tenant / Terisolasi):
- Memiliki akses ke halaman **Admin Panel** (`/admin/dashboard.html`).
- **Kepemilikan GOR:** Dapat menambahkan GOR baru yang secara otomatis akan menjadi miliknya. Satu Admin dapat mengelola lebih dari satu GOR.
- **Kelola Lapangan & Jadwal Blokir:** Dapat menambah/mengedit Lapangan dan mengatur Jadwal Blokir khusus untuk GOR miliknya sendiri.
- **Kelola Transaksi:** Hanya dapat melihat dan memverifikasi transaksi (Booking & Pembayaran) yang masuk ke GOR miliknya.
- **Privasi:** Admin **tidak dapat** melihat data GOR, lapangan, maupun pendapatan milik Admin lainnya.

### 3. Super Admin (Pemilik Sistem)
Role tertinggi yang mengontrol seluruh platform JogjaCourt. Hak akses yang dimiliki:
- **Semua akses tanpa batas (Bisa melihat dan mengelola GOR milik semua Admin).**
- **Manajemen Pengguna (User Management):** Dapat melihat daftar semua pengguna, serta mengubah peran pengguna (misal: mengubah *Customer* menjadi *Admin*) melalui menu `/admin/users.html`.
- **Manajemen Daerah (Area):** Menambah atau mengedit wilayah operasi.
- **Kontrol Penuh Sistem:** Mengawasi operasional dan pendapatan keseluruhan sistem.
*(Catatan: Akun Super Admin dan Admin dapat dibuat melalui script `create_admin.py` di backend).*

---

## 🛠️ Teknologi yang Digunakan

Proyek ini dipisahkan menjadi dua bagian utama: **Backend** (API) dan **Frontend** (Antarmuka Pengguna).

### Backend (Folder `booking-badminton-api`)
- **Framework:** FastAPI (Python) - Cepat dan modern.
- **Database:** PostgreSQL (di-hosting menggunakan **Supabase**).
- **ORM:** SQLAlchemy (Asyncio) & Alembic (untuk migrasi database).
- **Autentikasi:** JWT (JSON Web Tokens) dan Bcrypt untuk keamanan password.

### Frontend (Folder `frontend`)
- **Struktur & Logika:** HTML5 dan Vanilla JavaScript (`js/api.js`, `js/auth.js`).
- **Styling:** Tailwind CSS (via CDN) dengan kustomisasi antarmuka *Dark Mode* premium dan elemen *Glassmorphism*.
- **Ikon:** Lucide Icons & *Inline* SVG (anti-gagal termuat).
- **Estetika (UI/UX):**
  - Desain latar belakang dinamis pada halaman autentikasi (*cinematic dark-mode badminton court*).
  - Logo transparan penuh yang menyatu sempurna di segala kondisi layar.
  - *Form autofill fix* khusus peramban Webkit untuk menjaga tampilan gelap tetap mulus.
  - Tatanan halaman responsif (*Mobile First*) menggunakan *flexbox* berproporsi tinggi.

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

### 1. Persiapan Backend (API)

Backend menggunakan Python. Pastikan Anda telah menginstal Python (disarankan versi 3.9+).

1. Buka terminal dan masuk ke folder backend:
   ```bash
   cd booking-badminton-api
   ```
2. Buat Virtual Environment (opsional tapi disarankan):
   ```bash
   python -m venv venv
   # Di Windows:
   venv\Scripts\activate
   # Di Mac/Linux:
   source venv/bin/activate
   ```
3. Instal dependencies/pustaka yang dibutuhkan:
   ```bash
   pip install -r requirements.txt
   ```
4. Siapkan file `.env`. Anda perlu menghubungkannya dengan database PostgreSQL Anda (misalnya Supabase). Lihat contoh variabel lingkungan di kode.
5. Jalankan server FastAPI:
   ```bash
   uvicorn app.main:app --reload
   ```
   *API akan berjalan di `http://localhost:8000`*

### 2. Persiapan Frontend

Frontend tidak memerlukan proses *build* khusus (seperti Node.js) karena menggunakan Vanilla HTML dan Tailwind CDN.

1. Buka folder `frontend`:
   ```bash
   cd ../frontend
   ```
2. Anda bisa menjalankan server statis sederhana menggunakan Python:
   ```bash
   python serve.py
   # ATAU
   python -m http.server 3000
   ```
3. Buka browser dan akses:
   `http://localhost:3000` (atau port yang tertera pada terminal Anda).

---

## 📂 Struktur Direktori Proyek

```text
Sistem Booking Lap.Badminton/
│
├── booking-badminton-api/      # Kode sumber Backend (Python FastAPI)
│   ├── app/                    # Logika utama aplikasi, routing, model database
│   ├── venv/                   # Virtual environment Python
│   ├── .env                    # Variabel konfigurasi lingkungan (Database, JWT Secret)
│   ├── requirements.txt        # Daftar library Python yang dibutuhkan
│   ├── seed_data.py            # Script untuk mengisi data awal (dummy data)
│   └── create_admin.py         # Script untuk membuat akun Admin
│
└── frontend/                   # Kode sumber Frontend (HTML, CSS, JS)
    ├── admin/                  # Halaman khusus Admin Panel
    │   ├── dashboard.html      # Dashboard statistik admin
    │   ├── bookings.html       # Kelola semua data booking
    │   ├── payments.html       # Verifikasi bukti pembayaran
    │   ├── court-blocks.html   # Blokir jadwal lapangan
    │   ├── courts.html         # Kelola data lapangan (Super Admin)
    │   ├── areas.html          # Kelola data daerah (Super Admin)
    │   ├── venues.html         # Kelola data GOR (Super Admin)
    │   └── users.html          # Kelola akun pengguna (Super Admin)
    ├── js/                     # Logika JavaScript
    │   ├── api.js              # Helper HTTP request ke backend
    │   ├── auth.js             # Helper autentikasi & JWT
    │   └── admin-sidebar.js    # Komponen sidebar admin (shared)
    ├── index.html              # Halaman Landing Page (Beranda)
    ├── login.html              # Halaman Login
    ├── register.html           # Halaman Pendaftaran Akun
    ├── locations.html          # Halaman pencarian Daerah/Lokasi
    ├── venues.html             # Halaman daftar GOR dalam suatu daerah
    ├── courts.html             # Halaman detail GOR dan pemilihan Lapangan
    ├── booking.html            # Halaman checkout pesanan dan pilih jadwal
    ├── my-bookings.html        # Halaman riwayat pesanan user
    ├── profile.html            # Halaman profil user
    └── serve.py                # Script sederhana untuk menjalankan server frontend lokal
```

---

## 🛡️ Keamanan

Sistem ini mengimplementasikan:
- **Hashing Password:** Menyimpan kata sandi pengguna secara aman.
- **JWT (JSON Web Token):** Sesi pengguna dikelola menggunakan token yang aman.
- **RBAC (Role-Based Access Control):** Pemisahan hak akses antara Pengguna Biasa dan Admin, sehingga rute sensitif tidak bisa diakses sembarangan.

## 🤝 Kontribusi

Sistem ini dirancang agar mudah dikembangkan. Jika Anda ingin menambahkan fitur (seperti Payment Gateway otomatis misalnya menggunakan Midtrans, atau fitur pengingat via Email/WhatsApp), Anda bisa menambahkan routing baru di FastAPI dan memanggilnya via fungsi di `frontend/js/api.js`.
