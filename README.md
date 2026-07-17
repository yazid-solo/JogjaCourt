# 🏸 JogjaCourt — Sistem Booking Lapangan Badminton (Production-Ready)

Platform manajemen dan pemesanan lapangan badminton tingkat komersial (Enterprise-Grade) berbasis web. Dibangun menggunakan arsitektur REST API dengan backend **FastAPI (Python)** dan frontend **React.js (Vite + Tailwind CSS)**. 

Sistem ini beroperasi secara **Otomatis, Real-Time, dan Realistis** tanpa data *dummy* atau proses simulasi manual. Semua alur mulai dari pengecekan jadwal, pembayaran via Payment Gateway, notifikasi WhatsApp/Email, Lupa Password SMTP, hingga pencairan dana (Payouts) berjalan sepenuhnya otomatis oleh sistem.

---

## 🌟 Fitur Unggulan (Premium Features)

### 1. Pembayaran Otomatis via Payment Gateway (Xendit)
- Tidak ada lagi unggah bukti transfer manual. Sistem terintegrasi dengan API **Xendit** untuk menghasilkan *Virtual Account* atau *QRIS* secara langsung.
- Pengecekan status pembayaran berjalan secara *real-time* via Webhook. Saat pelanggan membayar, status pesanan otomatis menjadi lunas detik itu juga.

### 2. Notifikasi WhatsApp & Email SMTP Terintegrasi
- Terintegrasi dengan **Fonnte API** untuk mengirim pesan E-Tiket WhatsApp seketika saat pesanan dibuat dan dibayar.
- Menggunakan **Python SMTP** asli untuk mengirimkan E-Tiket, Tagihan, serta tautan **Lupa Password** ke email pelanggan dengan balutan *Template HTML* yang memukau.

### 3. Sistem Langganan Bulanan (Rolling 30-Days)
- Fitur sewa per bulan tidak terkunci pada awal bulan (kalender konvensional), melainkan menggunakan sistem hitung mundur 30 Hari (Date Range) yang presisi.
- Sistem otomatis menghitung 30 hari ke depan dan mendeteksi bentrok jadwal di hari-hari yang dipilih.

### 4. Chat Sentralisasi Anti-Fraud (Live WebSocket)
- Sistem obrolan dua arah secara *real-time* (tanpa perlu reload halaman).
- **Anti-Fraud Architecture**: Pelanggan (Customer) dan Pemilik GOR (Mitra) tidak diizinkan berkomunikasi langsung di luar pengawasan sistem. Semua pesan dari Pelanggan dan Mitra masuk terpusat ke satu akun **Super Admin (Pemilik Platform)** untuk menjaga keamanan transaksi.

### 5. Pencairan Dana Otomatis (Auto-Payouts)
- Terintegrasi penuh dengan sistem *Payouts* Xendit. Pendapatan GOR yang terkumpul di kas platform dapat dicairkan langsung ke rekening Pemilik GOR secara otomatis setelah disetujui Super Admin, lengkap dengan potongan biaya layanan (Komisi Platform).

### 6. Sistem Verifikasi Mitra (e-KYC)
- Pemilik GOR tidak bisa sembarangan mendaftar. Sistem dilengkapi fitur KYC (*Know Your Customer*) di mana Mitra harus mengunggah KTP, Foto Diri, NPWP, dan NIB. 
- Status GOR otomatis ditangguhkan jika verifikasi belum disetujui oleh Super Admin.

### 7. UI/UX Kelas Dunia (Native-Mobile Ready & 3D Glassmorphism)
- **Super Responsif (100dvh):** Sistem mengadopsi standar aplikasi seluler menggunakan `100dvh` dan *safe-area insets* untuk menangani *Notch* dan *Home Indicator* di iOS/Android. Tampilan mengembang penuh tanpa terpotong *address bar browser*.
- **Animasi Super Mulus (Bebas Lag):** Menggunakan *Framer Motion* dan optimasi khusus *GSAP ScrollTrigger* untuk memberikan efek *3D Tilt*, *staggered lists*, tanpa layar *nge-blank* saat *scrolling*.
- **Desain Premium:** Mengusung tema gelap elegan dengan efek kaca buram (*Backdrop-Blur Glassmorphism*), aksen pendaran emas, dan E-Tiket berkonsep holografik VIP.

---

## 👥 Role Pengguna & Hak Akses

Sistem menerapkan **Role-Based Access Control (RBAC)** dengan tiga level:

### 1. Customer (Pemain)
- Pencarian lapangan, ketersediaan *real-time*, kalender interaktif.
- Fitur Lupa Password otomatis via Email.
- Pembayaran instan via Xendit.
- Chat Bantuan (Bicara langsung dengan Pusat / Super Admin).
- Menerima E-Tiket via WhatsApp & Email.

### 2. Admin (Pengelola / Pemilik GOR Mitra)
- Dashboard Statistik operasional GOR miliknya.
- Pengajuan KYC (Verifikasi Identitas Bisnis).
- Pengaturan harga, foto lapangan, jam buka, dan blokir jadwal.
- Permintaan Pencairan Dana (Payout) ke rekening bank pribadi.
- Fitur Bantuan (Hanya bisa Chat dengan Super Admin).
- **Isolasi Data**: Mutlak tidak bisa melihat data GOR atau pendapatan milik kompetitor.

### 3. Super Admin (Pemilik Platform JogjaCourt)
- Memiliki kontrol penuh atas semua GOR dan Pengguna.
- Verifikasi pengajuan Mitra (KYC).
- Menyetujui atau menolak pencairan dana (Payout) ke rekening Mitra.
- Pusat komunikasi (Helpdesk): Menjawab semua Chat dari Pelanggan maupun Mitra.
- Pengaturan komisi/potongan aplikasi per transaksi.

---

## 🛠️ Teknologi yang Digunakan

| Layer | Teknologi Utama | Keterangan |
|-------|-----------------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion | Antarmuka dinamis bergaya 3D Glassmorphism & Animasi Mulus |
| **Backend** | FastAPI, Python 3.10+, Uvicorn | API super cepat & *asynchronous* |
| **Database** | PostgreSQL, SQLAlchemy (Async), Alembic | Database relasional untuk transaksi data skala besar |
| **Payments** | Xendit API, Webhooks | Payment gateway & Payout gateway (Real Money) |
| **Messaging** | Fonnte API, Python SMTP, WebSockets | Kirim WA, Email, Lupa Sandi, dan Live Chat |
| **Background**| APScheduler | Menjalankan robot pengecekan pembatalan otomatis 15-menit |

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

### 1. Persiapan Database (PostgreSQL)
1. Pastikan PostgreSQL sudah terinstal dan berjalan.
2. Buat database baru bernama `badminton_db` (atau sesuai keinginan).

### 2. Setup Backend (FastAPI)
```bash
cd booking-badminton-api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
Buat file `.env` dan masukkan data kunci rahasia (Kunci Database, JWT, Xendit, Email SMTP, dan Fonnte asli).
Jalankan migrasi dan server:
```bash
alembic upgrade head
python create_admin.py
uvicorn app.main:app --reload
```

### 3. Setup Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

---

## 🛡️ Keamanan & Anti-Kecurangan
1. **Database Transactions Locking**: Menggunakan *row-level locking* (`FOR UPDATE`) di PostgreSQL untuk memastikan 2 orang tidak bisa memesan jadwal yang sama persis di detik yang bersamaan.
2. **Centralized Payment & Chat**: Semua transaksi dan komunikasi wajib melalui Super Admin. Admin Mitra GOR tidak diizinkan memberi nomor rekening pribadi atau chat langsung dengan pelanggan untuk mencegah pembajakan *fee* aplikasi.
3. **JWT Authentication**: Akses sistem dilindungi oleh Token Web JSON yang kedaluwarsa secara berkala dan memverifikasi identitas di setiap panggilan API.

---
> *Sistem ini bukan sekadar tugas akhir atau purwarupa; kode ini telah dirancang (zero-dummy data) untuk langsung disebarkan ke lingkungan produksi (Mass Deployment) dan mulai mencetak aliran pendapatan komersial.*
