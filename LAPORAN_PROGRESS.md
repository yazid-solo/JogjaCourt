# LAPORAN PROGRESS PROYEK

**Nama Proyek:** JogjaCourt — Sistem Booking Lapangan Badminton Online  
**Mata Kuliah:** Pemrograman Web  
**Dosen Pengampu:** Andri Heru Saputra, S.Kom., M.Kom.  

---

## MINGGU 1 — Perencanaan dan Persiapan Proyek

**Tanggal:** Pertemuan 6  
**Target:** Menentukan topik, merancang konsep sistem, dan menyiapkan lingkungan kerja.

### Kegiatan yang Dilakukan

Pada minggu pertama, fokus utama ada di tahap perencanaan. Saya memilih topik **Sistem Booking** karena relevan dengan kebutuhan nyata di lapangan — banyak GOR badminton di sekitar Yogyakarta yang masih mengandalkan WhatsApp atau telepon untuk pemesanan, yang sering menimbulkan bentrok jadwal.

Langkah-langkah yang dikerjakan:

1. **Penentuan Topik dan Deskripsi Proyek**  
   Topik yang dipilih adalah Sistem Booking Lapangan Badminton berbasis web. Sistem ini nantinya akan melayani tiga jenis pengguna: pemain (customer), pengelola GOR (admin), dan pemilik platform (super admin).

2. **Perancangan Database**  
   Saya membuat rancangan skema database menggunakan PostgreSQL (via Supabase) dengan 7 tabel utama:
   - `users` — menyimpan data akun pengguna beserta role-nya
   - `areas` — data daerah/wilayah operasi
   - `venues` — data GOR (Gelanggang Olahraga)
   - `courts` — data lapangan per GOR
   - `bookings` — data pemesanan
   - `payments` — data pembayaran dan bukti transfer
   - `court_blocks` — data jadwal blokir lapangan (maintenance/event)

   Relasi antar tabel dirancang menggunakan UUID sebagai primary key dan foreign key yang saling terhubung (misalnya: venues → areas, courts → venues, bookings → courts → users).

3. **Pemilihan Teknologi**  
   - **Backend:** Python dengan framework FastAPI, karena mendukung async dan dokumentasi otomatis (Swagger UI).
   - **Database:** PostgreSQL yang di-hosting di Supabase (gratis untuk skala kecil).
   - **Frontend:** HTML, JavaScript, dan Tailwind CSS (via CDN) untuk tampilan responsif.
   - **Arsitektur:** RESTful API — frontend tidak mengakses database secara langsung, melainkan selalu melalui endpoint API.

4. **Inisialisasi Proyek**  
   Membuat struktur folder proyek dan menginstal library yang dibutuhkan. Proyek dipisah menjadi dua bagian: folder `booking-badminton-api` untuk backend dan folder `frontend` untuk antarmuka pengguna.

### Hasil Minggu 1
- Konsep sistem sudah jelas dan matang.
- Skema database sudah dirancang (7 tabel dengan relasi).
- Lingkungan kerja siap (Python, virtual environment, Supabase, Git).
- Struktur folder proyek sudah terbentuk.

### Kendala
- Sempat bingung memilih antara MySQL dan PostgreSQL. Akhirnya memilih PostgreSQL karena Supabase menyediakan hosting gratis dan mendukung fitur seperti Row Level Security (RLS).

---

## MINGGU 2 — Pembangunan Backend (REST API)

**Target:** Membangun seluruh endpoint API dan logika bisnis di sisi server.

### Kegiatan yang Dilakukan

Minggu ini seluruh energi difokuskan ke pengerjaan backend. Tujuannya supaya pondasi API sudah kokoh sebelum mulai mengerjakan tampilan frontend.

1. **Pembuatan Model Database (ORM)**  
   Setiap tabel di database direpresentasikan sebagai class Python menggunakan SQLAlchemy ORM. Total ada 7 model yang dibuat:
   - `User`, `Area`, `Venue`, `Court`, `Booking`, `Payment`, `CourtBlock`
   
   Setiap model dilengkapi dengan relasi (relationship) agar data yang saling terhubung bisa diambil dengan mudah. Misalnya, dari objek `Court` bisa langsung diakses data `Venue`-nya.

2. **Pembuatan Schema (Validasi Data)**  
   Menggunakan Pydantic untuk memvalidasi data yang masuk dan keluar dari API. Setiap entitas punya minimal 3 schema:
   - `Create` — untuk validasi saat membuat data baru
   - `Update` — untuk validasi saat mengubah data
   - `Response` — untuk format data yang dikembalikan ke frontend

3. **Implementasi Endpoint REST API**  
   Total ada **9 router** (kelompok endpoint) yang dibangun:

   | Router | Metode HTTP | Fungsi |
   |--------|-------------|--------|
   | `/auth` | POST, GET, PUT | Register, Login, Profil, Ganti Password, Upload Foto Profil |
   | `/areas` | GET, POST, PUT, DELETE | CRUD data daerah |
   | `/venues` | GET, POST, PUT, DELETE | CRUD data GOR |
   | `/courts` | GET, POST, PUT, DELETE | CRUD data lapangan + cek ketersediaan slot |
   | `/bookings` | GET, POST, PUT | Buat booking, lihat daftar, konfirmasi, batalkan, selesaikan |
   | `/payments` | GET, POST, PUT | Upload bukti bayar, konfirmasi/tolak pembayaran |
   | `/dashboard` | GET | Statistik harian, pendapatan mingguan, tingkat keterisian lapangan |
   | `/users` | GET, PUT | Daftar pengguna, ubah status aktif, ubah role |
   | `/notifications` | GET | Notifikasi pengguna |

4. **Sistem Autentikasi dan Otorisasi**  
   - Login menghasilkan JWT (JSON Web Token) yang disimpan di sisi client.
   - Password di-hash menggunakan bcrypt sebelum disimpan ke database.
   - Dibuat 3 level dependency untuk pembatasan akses:
     - `get_current_user` — memastikan pengguna sudah login
     - `require_admin` — hanya untuk admin dan super admin
     - `require_super_admin` — khusus super admin

5. **Business Logic (Service Layer)**  
   Logika bisnis yang kompleks dipisahkan ke folder `services/`:
   - `auth_service.py` — proses registrasi dan pencarian user
   - `booking_service.py` — proses booking dengan pengecekan ketersediaan slot, perhitungan harga (reguler vs peak hour), dan mekanisme lock 15 menit agar tidak terjadi double-booking
   - `payment_service.py` — proses konfirmasi/penolakan pembayaran yang otomatis mengubah status booking

### Hasil Minggu 2
- Semua endpoint REST API sudah berfungsi (GET, POST, PUT, DELETE).
- Sistem autentikasi JWT berjalan.
- Logika bisnis (cek ketersediaan, hitung harga, lock slot) sudah diimplementasikan.
- API bisa diuji melalui Swagger UI di `http://localhost:8000/docs`.

### Kendala
- Konfigurasi koneksi database async ke Supabase agak tricky. Harus menggunakan `NullPool` dan menonaktifkan `statement_cache_size` karena Supabase menggunakan PgBouncer sebagai connection pooler.
- Sempat terjadi error saat hashing password karena versi library `bcrypt` tidak kompatibel. Diselesaikan dengan meng-install versi 4.0.1 secara spesifik.

---

## MINGGU 3 — Pembangunan Frontend (Halaman Publik)

**Target:** Membuat seluruh halaman yang bisa diakses oleh pengguna umum (customer).

### Kegiatan yang Dilakukan

Setelah backend selesai, minggu ini fokus ke pembuatan antarmuka pengguna. Desain yang digunakan adalah dark mode dengan aksen warna kuning-hijau (brand color) agar terlihat modern.

1. **Pembuatan API Client (`api.js`)**  
   Membuat file JavaScript yang berfungsi sebagai jembatan antara frontend dan backend. Semua request ke API (GET, POST, PUT, DELETE) melewati satu file ini. Token JWT otomatis disisipkan di setiap request jika pengguna sudah login. Jika token kadaluarsa (status 401), pengguna otomatis diarahkan ke halaman login.

2. **Halaman Autentikasi**  
   - `login.html` — Form login dengan field email dan password. Setelah berhasil login, token dan data user disimpan di localStorage.
   - `register.html` — Form pendaftaran akun baru dengan validasi di sisi client (nama, email, password minimal 6 karakter, nomor HP).

3. **Halaman Landing Page (`index.html`)**  
   Halaman utama yang menampilkan:
   - Hero section dengan judul dan tagline
   - Daftar daerah yang tersedia (diambil dari API `/areas`)
   - Penjelasan fitur dan cara kerja sistem
   - Navigasi responsif (tampilan berbeda di desktop dan mobile)

4. **Halaman Pencarian dan Pemesanan**  
   - `locations.html` — Menampilkan daftar daerah. Klik salah satu daerah akan membuka daftar GOR di daerah tersebut.
   - `venues.html` — Daftar GOR dalam suatu daerah, lengkap dengan alamat, telepon, dan tombol untuk melihat lapangan.
   - `courts.html` — Detail GOR dan daftar lapangan beserta harga. Di sini pengguna bisa melihat slot waktu yang tersedia untuk tanggal tertentu.
   - `booking.html` — Halaman checkout. Pengguna memilih slot waktu, melihat ringkasan harga, lalu mengkonfirmasi pesanan.

5. **Halaman Akun Pengguna**  
   - `my-bookings.html` — Riwayat semua booking milik pengguna. Status ditampilkan dengan badge berwarna (kuning untuk pending, hijau untuk dikonfirmasi, biru untuk selesai, merah untuk dibatalkan). Ada tombol upload bukti pembayaran dan tombol batalkan.
   - `profile.html` — Halaman profil untuk mengedit nama, nomor telepon, upload foto profil, dan mengganti password.

6. **Responsive Design**  
   Semua halaman dibangun dengan pendekatan mobile-first menggunakan Tailwind CSS. Navigasi berubah menjadi hamburger menu di layar kecil. Tabel dan grid menyesuaikan jumlah kolom sesuai lebar layar.

### Hasil Minggu 3
- 8 halaman publik sudah selesai dan terintegrasi dengan API.
- Semua data ditampilkan secara dinamis dari backend (tidak ada data statis/hardcode).
- Tampilan responsif di desktop maupun mobile.
- Alur pemesanan dari cari GOR → pilih lapangan → pilih jadwal → checkout sudah berjalan end-to-end.

### Kendala
- Beberapa halaman sempat terlihat berantakan di layar HP karena tabel terlalu lebar. Diselesaikan dengan menambahkan `overflow-x-auto` agar tabel bisa di-scroll horizontal.
- Masalah CORS saat frontend memanggil API backend. Diselesaikan dengan menambahkan middleware CORS di FastAPI.

---

## MINGGU 4 — Pembangunan Panel Admin

**Target:** Membuat dashboard dan halaman pengelolaan untuk admin dan super admin.

### Kegiatan yang Dilakukan

1. **Komponen Sidebar Admin (`admin-sidebar.js`)**  
   Membuat sidebar navigasi yang dipakai bersama (shared component) di semua halaman admin. Sidebar ini otomatis menyesuaikan menu berdasarkan role pengguna — admin biasa hanya melihat menu yang relevan, sementara super admin bisa melihat semua menu termasuk Daerah dan Akun Pengguna.

2. **Dashboard Admin (`dashboard.html`)**  
   Halaman utama panel admin yang menampilkan:
   - 4 kartu statistik: Total Booking Hari Ini, Pendapatan Hari Ini, Pembayaran Menunggu Verifikasi, dan Jumlah Lapangan Aktif.
   - Grafik pendapatan 7 hari terakhir (bar chart).
   - Grafik tingkat keterisian lapangan (horizontal bar chart).
   
   Semua data diambil dari endpoint `/dashboard/stats`, `/dashboard/weekly-revenue`, dan `/dashboard/court-occupancy`.

3. **Halaman Manajemen Data**  
   - `admin/areas.html` — CRUD daerah. Super admin bisa menambah, mengedit nama dan provinsi, serta menonaktifkan daerah.
   - `admin/venues.html` — CRUD GOR. Menampilkan tabel GOR dengan kolom nama, daerah, alamat, telepon, dan status. Ada modal form untuk tambah/edit GOR.
   - `admin/courts.html` — CRUD lapangan. Admin bisa menambah lapangan baru ke GOR tertentu, mengatur harga reguler dan peak hour, serta menonaktifkan lapangan.

4. **Halaman Manajemen Transaksi**  
   - `admin/bookings.html` — Daftar semua booking yang masuk. Admin bisa mengkonfirmasi booking pending atau menandai booking sebagai selesai.
   - `admin/payments.html` — Verifikasi pembayaran. Admin bisa melihat bukti transfer yang diunggah customer, lalu menyetujui atau menolak pembayaran (dengan alasan penolakan).
   - `admin/court-blocks.html` — Mengatur jadwal blokir lapangan untuk keperluan maintenance atau event khusus. Slot yang diblokir otomatis tidak bisa dipesan oleh customer.

5. **Halaman Manajemen Pengguna (`admin/users.html`)**  
   Khusus untuk super admin. Menampilkan daftar seluruh pengguna yang terdaftar dengan fitur:
   - Pencarian berdasarkan nama atau email.
   - Filter berdasarkan role (customer/admin/super admin) dan status (aktif/nonaktif).
   - Toggle untuk mengaktifkan atau menonaktifkan akun pengguna.
   - Dropdown untuk mengubah role pengguna (customer ↔ admin).

### Hasil Minggu 4
- 8 halaman admin sudah selesai dan berfungsi penuh.
- Dashboard menampilkan statistik real-time dari database.
- Semua operasi CRUD (Create, Read, Update, Delete) berjalan melalui REST API.
- Pembagian hak akses admin vs super admin sudah diterapkan di sidebar dan di API.

### Kendala
- Grafik dashboard awalnya tidak muncul karena library Chart.js belum dimuat. Diselesaikan dengan menambahkan CDN Chart.js.
- Form modal kadang tidak ter-reset setelah submit berhasil. Diperbaiki dengan menambahkan `form.reset()` secara eksplisit setelah response sukses.

---

## MINGGU 5 — Penyempurnaan dan Finalisasi

**Target:** Menambahkan fitur lanjutan, memperbaiki bug, dan menyiapkan dokumentasi.

### Kegiatan yang Dilakukan

1. **Implementasi Sistem Multi-Tenant (Pemisahan Akses per GOR)**  
   Ini adalah fitur paling besar yang dikerjakan di minggu terakhir. Sebelumnya, semua admin bisa melihat dan mengelola semua GOR. Sekarang, setiap admin hanya bisa mengakses GOR miliknya sendiri.

   Perubahan yang dilakukan:
   - Menambahkan kolom `owner_id` pada tabel `venues` yang merujuk ke tabel `users`. Kolom ini mencatat siapa pemilik GOR tersebut.
   - Mengupdate endpoint `/venues`, `/courts`, `/bookings`, `/payments`, dan `/court-blocks` agar memfilter data berdasarkan `owner_id` ketika yang mengakses adalah admin biasa.
   - Super admin tetap bisa melihat dan mengelola semua data tanpa batasan.
   - Di frontend, menu "Daerah" dan "Akun Pengguna" disembunyikan untuk admin biasa karena itu adalah hak super admin.

2. **Perbaikan Tampilan dan Responsivitas**  
   - Memperbaiki beberapa halaman yang tampilan teksnya kurang terbaca (kontras warna terlalu rendah).
   - Memastikan semua form, tabel, dan kartu statistik tampil rapi di berbagai ukuran layar.
   - Menghilangkan duplikasi tampilan yang terjadi di beberapa halaman admin.

3. **Penulisan Dokumentasi (`README.md`)**  
   Membuat dokumentasi proyek yang mencakup:
   - Deskripsi dan fitur utama sistem.
   - Penjelasan 3 role pengguna beserta hak aksesnya.
   - Teknologi yang digunakan (backend dan frontend).
   - Cara menjalankan proyek secara lokal (langkah demi langkah).
   - Struktur folder proyek.
   - Catatan keamanan (hashing password, JWT, RBAC).

4. **Pembuatan Seed Data**  
   Membuat data contoh agar sistem bisa langsung diuji coba:
   - 1 akun super admin default.
   - 4 daerah di D.I. Yogyakarta (Bantul, Sleman, Kota Jogja, Gunungkidul).
   - 5 GOR dengan alamat dan gambar.
   - 13 lapangan dengan harga yang bervariasi.

5. **Pengujian Akhir**  
   Melakukan pengujian menyeluruh terhadap semua fitur:
   - Registrasi dan login (customer baru).
   - Alur booking dari awal sampai selesai (cari → pesan → bayar → verifikasi admin).
   - Semua operasi CRUD di panel admin.
   - Pemisahan akses antar admin (admin A tidak bisa lihat data admin B).
   - Tampilan responsif di desktop dan mobile.

### Hasil Minggu 5
- Sistem multi-tenant sudah berjalan (privasi data antar admin terjaga).
- Tampilan sudah dipoles dan responsif.
- Dokumentasi lengkap.
- Seed data tersedia untuk demo.
- Seluruh fitur sudah diuji dan berfungsi dengan baik.

### Kendala
- Proses migrasi database untuk menambahkan kolom `owner_id` sempat bermasalah karena Alembic tidak bisa menemukan konfigurasi. Diselesaikan dengan membuat script migrasi manual menggunakan Python.
- Beberapa query di endpoint booking dan payment menjadi lebih kompleks karena harus melakukan join ke tabel venues untuk memeriksa kepemilikan.

---

## MINGGU 6 — Optimasi UI/UX, Pembersihan Kode, dan Penyempurnaan Tampilan

**Target:** Menyempurnakan estetika antarmuka (UI), memastikan pengalaman pengguna (UX) yang premium, dan membersihkan repositori dari file sementara.

### Kegiatan yang Dilakukan

1. **Peningkatan Kualitas Visual (Premium UI)**  
   - Mengubah latar belakang halaman Autentikasi (Login & Register) menjadi gambar *cinematic dark-mode* lapangan badminton profesional dengan lapisan gradasi gelap agar lebih memukau namun tetap mempertahankan keterbacaan teks yang tinggi.
   - Mengatasi *bug* visual pada logo utama. Sebelumnya, logo memiliki batas kotak hitam karena bawaan gambar. Masalah ini diselesaikan dengan menjalankan program pengolahan gambar (Python Image Library) untuk menjadikan latar logo 100% transparan seutuhnya.
   
2. **Perbaikan Masalah Styling (Webkit Autofill)**  
   - Saat pengguna menggunakan fitur *autofill* pada peramban (seperti Chrome), kotak input *email* dan *password* sempat berubah menjadi warna putih terang yang merusak tema gelap (*dark mode*) aplikasi. Hal ini diatasi dengan menambahkan aturan CSS `input:-webkit-autofill` untuk menjaga konsistensi warna gelap secara permanen.

3. **Perbaikan Struktur dan Tata Letak (Layout & Broken Icons)**  
   - Menata ulang proporsi logo dan teks "JOGJA COURT" di halaman pendaftaran dan *login* menggunakan Flexbox (`inline-flex`) sehingga tampil lebih proporsional, ringkas, dan sangat responsif di perangkat *mobile*.
   - Memperbaiki struktur baris HTML yang bocor pada elemen *badge* "Kenapa JogjaCourt?" di halaman utama yang sempat membuat teks judul melenceng.
   - Memperbaiki jalur tautan (*path*) gambar logo yang sempat rusak (`broken image`) di beberapa halaman dasbor menjadi akurat.
   - Mengganti pemanggilan ikon *library* eksternal menjadi *inline SVG* secara langsung pada kartu statistik dasbor admin. Ini membuat ikon menjadi 100% anti-gagal termuat walau peramban bermasalah atau koneksi melambat.

4. **Pembersihan Repositori (Code Cleanup)**  
   - Membersihkan seluruh *file* skrip Python sementara (seperti `update_colors.py`, `enlarge_logo.py`, dll) dan folder kosong yang sebelumnya digunakan untuk bereksperimen, sehingga kode sumber (*source code*) aplikasi menjadi sangat rapi dan siap dipublikasikan.

### Hasil Minggu 6
- Antarmuka pengguna (UI) kini berstandar sangat tinggi, premium, dan estetik.
- Seluruh masalah visual (logo berkotak hitam, *autofill* putih, gambar rusak, ikon dasbor kosong) telah diperbaiki total.
- Repositori proyek menjadi sangat bersih dari *file* sampah.

---

## RINGKASAN CAPAIAN PROYEK

| Aspek | Detail |
|-------|--------|
| Jumlah Tabel Database | 7 tabel + relasi |
| Jumlah Endpoint API | 30+ endpoint (GET, POST, PUT, DELETE) |
| Jumlah Halaman Frontend | 18 halaman (10 publik + 8 admin) |
| Framework Backend | FastAPI (Python) |
| Database | PostgreSQL (Supabase) |
| Autentikasi | JWT + bcrypt hashing |
| Otorisasi | RBAC 3 level (Customer, Admin, Super Admin) |
| Arsitektur | Frontend ↔ REST API ↔ Database (tidak langsung ke DB) |
| Responsive | Ya (desktop dan mobile) |
| Dokumentasi | README.md lengkap |

### Daftar Endpoint API Utama

| No | Method | Endpoint | Keterangan |
|----|--------|----------|------------|
| 1 | POST | `/auth/register` | Daftar akun baru |
| 2 | POST | `/auth/login` | Login (mendapat token JWT) |
| 3 | GET | `/auth/me` | Lihat profil sendiri |
| 4 | PUT | `/auth/me` | Update profil |
| 5 | PUT | `/auth/change-password` | Ganti password |
| 6 | POST | `/auth/me/profile-image` | Upload foto profil |
| 7 | GET | `/areas` | Daftar semua daerah |
| 8 | POST | `/areas` | Tambah daerah (Super Admin) |
| 9 | PUT | `/areas/{id}` | Edit daerah (Super Admin) |
| 10 | DELETE | `/areas/{id}` | Hapus daerah (Super Admin) |
| 11 | GET | `/venues` | Daftar semua GOR |
| 12 | POST | `/venues` | Tambah GOR (Admin) |
| 13 | PUT | `/venues/{id}` | Edit GOR (Admin/pemilik) |
| 14 | DELETE | `/venues/{id}` | Hapus GOR (Admin/pemilik) |
| 15 | GET | `/courts` | Daftar lapangan |
| 16 | GET | `/courts/{id}/availability` | Cek ketersediaan slot |
| 17 | POST | `/courts` | Tambah lapangan (Admin) |
| 18 | PUT | `/courts/{id}` | Edit lapangan (Admin) |
| 19 | DELETE | `/courts/{id}` | Hapus lapangan (Admin) |
| 20 | GET | `/bookings` | Daftar booking |
| 21 | POST | `/bookings` | Buat booking baru |
| 22 | PUT | `/bookings/{id}/confirm` | Konfirmasi booking (Admin) |
| 23 | PUT | `/bookings/{id}/cancel` | Batalkan booking |
| 24 | PUT | `/bookings/{id}/complete` | Tandai selesai (Admin) |
| 25 | GET | `/payments` | Daftar pembayaran |
| 26 | POST | `/payments/{id}/upload-proof` | Upload bukti bayar |
| 27 | PUT | `/payments/{id}/confirm` | Setujui pembayaran (Admin) |
| 28 | PUT | `/payments/{id}/reject` | Tolak pembayaran (Admin) |
| 29 | GET | `/dashboard/stats` | Statistik dashboard |
| 30 | GET | `/dashboard/weekly-revenue` | Pendapatan 7 hari |
| 31 | GET | `/users` | Daftar pengguna (Super Admin) |
| 32 | PUT | `/users/{id}/role` | Ubah role pengguna |

### Struktur Database

```
users ──────────┐
                │
areas ─── venues ─── courts ─── bookings ─── payments
                │           │
                │           └── court_blocks
                │
                └── (owner_id → users)
```

Setiap tabel menggunakan UUID sebagai primary key. Relasi antar tabel dijaga dengan foreign key dan cascade delete agar data tetap konsisten.

---

*Laporan ini disusun berdasarkan progres pengerjaan aktual selama 5 minggu pengembangan.*
