<div align="center">
  
# LAPORAN PROYEK AKHIR REKAYASA WEB
## SISTEM INFORMASI BOOKING LAPANGAN BADMINTON (JOGJACOURT)

**Mata Kuliah:** Rekayasa Web (INF-2218/B)  
**Dosen Pengampu:** Andri Heru Saputra, S. Kom., M. Kom.  

<br>

**Disusun Oleh:**
[Nama Anda] 
[NIM Anda]
Informatika - Angkatan 2024

<br>

**UNIVERSITAS NAHDLATUL ULAMA YOGYAKARTA**  
**TAHUN AKADEMIK 2025/2026 GENAP**

</div>

<div style="page-break-after: always;"></div>

## DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
2. [Analisis Kebutuhan dan Arsitektur Sistem](#2-analisis-kebutuhan-dan-arsitektur-sistem)
3. [Perancangan Basis Data](#3-perancangan-basis-data)
4. [Implementasi Sistem](#4-implementasi-sistem)
5. [Implementasi CRUD](#5-implementasi-crud)
6. [Pengujian Sistem](#6-pengujian-sistem)
7. [Penutup](#7-penutup)
8. [Daftar Pustaka](#8-daftar-pustaka)

<div style="page-break-after: always;"></div>

## 1. Pendahuluan

### 1.1. Latar Belakang
Olahraga bulu tangkis merupakan salah satu olahraga terpopuler di Indonesia, khususnya di wilayah Yogyakarta. Namun, proses pemesanan (booking) lapangan di berbagai Gelanggang Olahraga (GOR) mayoritas masih dilakukan secara manual melalui pesan singkat (WhatsApp) atau datang langsung ke lokasi. Hal ini sering menimbulkan masalah berupa bentrok jadwal (*double booking*), kesulitan mencari ketersediaan lapangan secara *real-time*, dan pencatatan keuangan GOR yang tidak rapi. Oleh karena itu, dibutuhkan sebuah platform terpusat yang dapat menjembatani pelanggan dan pemilik GOR.

### 1.2. Rumusan Masalah
1. Bagaimana merancang sistem reservasi lapangan badminton yang mampu menampilkan jadwal ketersediaan secara *real-time*?
2. Bagaimana membangun arsitektur sistem berbasis *RESTful API* yang aman untuk menghubungkan antarmuka pelanggan dengan basis data GOR?

### 1.3. Tujuan Pengembangan Sistem
Membangun platform "JogjaCourt", sebuah aplikasi *booking* lapangan badminton berbasis *web* yang memfasilitasi tiga pihak utama: Pelanggan (User), Pemilik GOR (Mitra Admin), dan Pengelola Platform (Super Admin) secara terintegrasi.

### 1.4. Manfaat Sistem
*   **Bagi Pelanggan:** Memudahkan pencarian, pengecekan jadwal kosong, dan pembayaran lapangan tanpa harus datang ke lokasi.
*   **Bagi Mitra GOR:** Mendapatkan sistem manajemen kasir otomatis, manajemen ketersediaan lapangan, dan perhitungan bagi hasil (*revenue share*) yang transparan.

---

## 2. Analisis Kebutuhan dan Arsitektur Sistem

### 2.1. Deskripsi Kebutuhan Sistem
Sistem membutuhkan spesifikasi fungsional berdasarkan *Role-Based Access Control* (RBAC):
*   **User:** Mampu melakukan registrasi, mencari GOR, memilih jadwal, melakukan *booking*, mengunggah bukti pembayaran, dan mengirim pesan (*chat*) ke Mitra.
*   **Mitra Admin:** Mampu mendaftarkan GOR baru, menambah lapangan, memvalidasi pembayaran pelanggan, menarik dana pendapatan (*payout*), dan membalas *chat*.
*   **Super Admin:** Mampu memantau seluruh transaksi GOR, memverifikasi KYC mitra, dan mengelola pembagian komisi *platform*.

### 2.2. Arsitektur Sistem
Sistem ini dibangun menggunakan arsitektur *Client-Server* modern yang dipisahkan secara tegas (Decoupled Architecture) dengan pendekatan *RESTful API*.

*   **Frontend (Client-Side):** Dibangun menggunakan **React.js** (Vite) dengan styling **Tailwind CSS**. Frontend bertanggung jawab penuh atas rendering antarmuka pengguna (UI), *state management*, dan memanggil API dari server.
*   **Backend (Server-Side):** Dibangun menggunakan **FastAPI (Python)**. Bertindak sebagai penyedia layanan *RESTful API*, memvalidasi token JWT (*JSON Web Token*), mengeksekusi logika bisnis (seperti pengecekan bentrok jadwal), dan berkomunikasi dengan database.
*   **Database:** Menggunakan **PostgreSQL** yang di-host di layanan **Supabase**.
*   **Alur Komunikasi:** Frontend (React) mengirimkan HTTP Request (GET/POST/PUT/DELETE) dalam format JSON ke Backend (FastAPI). Backend memvalidasi *request*, melakukan query ORM (*Object-Relational Mapping*) menggunakan SQLAlchemy ke PostgreSQL, lalu mengembalikan HTTP Response (JSON) beserta *Status Code* ke Frontend.

---

## 3. Perancangan Basis Data

Sistem JogjaCourt dikelola menggunakan basis data relasional. Berikut adalah struktur inti tabel yang dirancang:

### 3.1. Struktur Tabel Utama
1.  **Tabel `users`**: Menyimpan data autentikasi dan profil pengguna (termasuk *role*: user, mitra_admin, super_admin).
2.  **Tabel `venues`**: Menyimpan data identitas GOR (Pemilik, Nama, Alamat, Fasilitas, dan Status Verifikasi). Berelasi *One-to-Many* dengan tabel `users` (Satu mitra bisa memiliki banyak GOR).
3.  **Tabel `courts`**: Menyimpan data lapangan spesifik di dalam suatu GOR (Jenis Lapangan, Harga per Jam). Berelasi dengan `venues`.
4.  **Tabel `bookings`**: Tabel inti transaksi. Menyimpan tanggal, jam mulai, jam selesai, status (*pending/confirmed*), dan total harga. Berelasi dengan `users`, `venues`, dan `courts`.
5.  **Tabel `payments`**: Menyimpan data pembayaran dari `bookings`.
6.  **Tabel `chat_messages`**: Menyimpan log percakapan *real-time* antar pengguna.

### 3.2. Fitur Basis Data Lanjutan
*   **Row-Level Security (RLS):** Diterapkan langsung di PostgreSQL untuk memastikan Mitra A tidak dapat membaca/memanipulasi data transaksi dari Mitra B di level *database*.
*   **Supabase Realtime (CDC):** Digunakan pada tabel `chat_messages` dan `bookings` untuk melakukan *push notification* via WebSockets (pembaruan data tanpa *refresh* layar).

---

## 4. Implementasi Sistem

### 4.1. Teknologi dan Framework yang Digunakan
*   **Bahasa Pemrograman:** JavaScript/JSX (Frontend), Python 3.10+ (Backend), SQL.
*   **Frontend Framework:** React 18, Vite, Tailwind CSS, Framer Motion (untuk animasi UI/UX).
*   **Backend Framework:** FastAPI (Asynchronous API), SQLAlchemy (ORM), Pydantic (Validasi Skema).
*   **Database & Auth:** Supabase PostgreSQL, JWT (PyJWT).

### 4.2. Struktur Folder Proyek
Proyek dibagi menjadi dua repositori utama di dalam satu *monorepo*:
```text
JogjaCourt/
├── booking-badminton-api/     (Direktori Backend)
│   ├── app/
│   │   ├── routers/           (Endpoints API: users.py, bookings.py, dll)
│   │   ├── schemas/           (Validasi Pydantic)
│   │   ├── models/            (SQLAlchemy Database Models)
│   │   └── services/          (Logika Bisnis Core)
│   └── main.py                (Entry point FastAPI)
└── frontend/                  (Direktori Frontend)
    ├── src/
    │   ├── components/        (UI Reusable: Card, Button, Navbar)
    │   ├── pages/             (Halaman: Dasbor, Login, VenueDetail)
    │   └── utils/             (Helper koneksi API, Auth Token)
    └── index.html
```

---

## 5. Implementasi CRUD

Fitur *Create, Read, Update, Delete* (CRUD) merupakan pondasi utama dari aplikasi JogjaCourt, diimplementasikan secara komprehensif melalui *RESTful API*.

1.  **Create (Tambah Data)**
    *   **Contoh:** Pendaftaran GOR baru oleh Mitra. Frontend mengirim form (Nama GOR, Fasilitas, Alamat) melalui metode `POST /api/venues`. Backend memvalidasi kelengkapan data menggunakan Pydantic, lalu menyimpannya ke database PostgreSQL.
2.  **Read (Lihat Data)**
    *   **Contoh:** Menampilkan daftar GOR di halaman utama (*Explore*). Frontend melakukan `GET /api/venues/public`. Backend akan melakukan *Query Select* ke tabel venues dan mengembalikan array JSON yang langsung di-*render* menjadi komponen *Card* di React.
3.  **Update (Ubah Data)**
    *   **Contoh:** Mitra menyetujui pesanan (*booking*) yang masuk. Frontend mengirim perintah `PUT /api/bookings/{id}/status` dengan *payload* `{"status": "confirmed"}`. Backend mengubah baris data di database.
4.  **Delete (Hapus Data)**
    *   **Contoh:** Pelanggan membatalkan pesanan yang belum dibayar. Frontend mengirim `DELETE /api/bookings/{id}`. Backend menghapus data secara permanen (*hard delete*) atau mengubah statusnya menjadi dibatalkan (*soft delete*).

---

## 6. Pengujian Sistem

### 6.1. Pengujian Responsive Web
Aplikasi telah diuji pada tiga breakpoint utama: **Desktop (Layar Lebar), Tablet, dan Mobile (Ponsel)**.
*   **Teknik yang Digunakan:** Kami menggunakan utilitas *Mobile-First* bawaan Tailwind CSS (`sm:`, `md:`, `lg:`).
*   **Hasil:** Pada tampilan Desktop, navigasi menggunakan *Sidebar* di sebelah kiri. Namun ketika dibuka di Ponsel, *Sidebar* secara otomatis disembunyikan dan diubah menjadi *Hamburger Drawer Menu* yang ringkas, serta struktur kartu statistik (*grid*) yang tadinya menyamping akan menumpuk ke bawah (*stack*) agar mudah digulir (scroll) dengan ibu jari.

### 6.2. Pengujian RESTful API
Seluruh rute (*endpoints*) diuji menggunakan Swagger UI bawaan dari FastAPI (terdokumentasi secara otomatis di `/docs`).
1.  **GET `/api/bookings`**: Menghasilkan *Status Code* `200 OK` (Berhasil mengambil data).
2.  **POST `/api/bookings`**: Menghasilkan *Status Code* `201 Created` saat pesanan berhasil disimpan.
3.  **Error Handling (Validasi):** Apabila pengguna mencoba *booking* di jam yang sudah dipesan orang lain, API dengan tegas menolak dan memberikan *Status Code* `400 Bad Request` dengan pesan error JSON yang spesifik.

---

## 7. Penutup

### 7.1. Kendala yang Dihadapi
Selama proses pengembangan, tantangan terbesar adalah menangani *Race Condition* (ketika dua orang menekan tombol *booking* lapangan yang sama di detik yang persis sama). Selain itu, mengintegrasikan fitur obrolan *real-time* yang bebas penundaan (*zero-latency*) tanpa memberatkan server juga menjadi tantangan.

### 7.2. Solusi yang Diterapkan
Untuk masalah *Race Condition*, kami mengimplementasikan teknik *Row-Level Locking* (`WITH FOR UPDATE`) pada PostgreSQL di backend FastAPI. Hal ini memaksa sistem memproses satu transaksi secara antre sebelum transaksi lain di detik yang sama dieksekusi. Untuk obrolan *real-time*, kami memanfaatkan Supabase WebSockets (CDC) agar pesan terkirim langsung dari database ke *client* tanpa harus melakukan *polling* manual.

### 7.3. Pengembangan Mendatang
Pada pengembangan selanjutnya, sistem direncanakan untuk diintegrasikan secara langsung dengan Payment Gateway pihak ketiga (seperti Midtrans atau Xendit) agar proses validasi pembayaran lapangan dapat berjalan 100% otomatis tanpa campur tangan Admin Mitra untuk mengecek bukti transfer secara manual.

---

## 8. Daftar Pustaka
1. *FastAPI Documentation*. (2025). Diakses dari https://fastapi.tiangolo.com/
2. *React Official Documentation*. (2025). Diakses dari https://react.dev/
3. *Tailwind CSS Utility-First Framework*. (2025). Diakses dari https://tailwindcss.com/
4. *Supabase Realtime & PostgreSQL*. (2025). Diakses dari https://supabase.com/docs
