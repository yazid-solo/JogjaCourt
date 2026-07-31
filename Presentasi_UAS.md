# MATERI & SKRIP PRESENTASI UAS REKAYASA WEB (JOGJACOURT)

> **PETUNJUK PENGGUNAAN:**
> Salin teks pada bagian **[Teks di Slide]** ke dalam aplikasi presentasi Anda (PowerPoint, Canva, atau Google Slides). 
> Saat merekam video, Anda bisa membaca bagian **[Narasi / Yang Diucapkan]** agar penjelasan Anda lancar, durasi 30 menit terpenuhi, dan terkesan sangat profesional.

---

## SLIDE 1: Judul (Cover)
**[Teks di Slide]**
*   **Judul:** JogjaCourt - Sistem Informasi Booking Lapangan Badminton Real-Time
*   **Mata Kuliah:** Rekayasa Web (INF-2218/B)
*   **Oleh:** [Nama Anda] - [NIM Anda]
*   **Logo:** Universitas Nahdlatul Ulama Yogyakarta

**[Narasi / Yang Diucapkan]**
"Assalamualaikum Wr. Wb. Selamat pagi/siang/sore Bapak Andri Heru Saputra selaku dosen pengampu mata kuliah Rekayasa Web. Perkenalkan saya [Nama Anda] dengan NIM [NIM Anda]. Pada kesempatan kali ini, saya akan mempresentasikan dan mendemonstrasikan Proyek Akhir Rekayasa Web saya yang berjudul JogjaCourt, yaitu sebuah Sistem Informasi Booking Lapangan Badminton berbasis *Real-Time*."

---

## SLIDE 2: Latar Belakang Masalah
**[Teks di Slide]**
*   **Masalah Saat Ini:**
    *   Booking lapangan masih manual via WhatsApp.
    *   Sering terjadi bentrok jadwal (*double booking*).
    *   Pemilik GOR kesulitan merekap keuangan secara otomatis.
*   **Solusi (JogjaCourt):** 
    Platform B2B2C yang menghubungkan Pemilik GOR (Mitra) dan Pemain Badminton (Pelanggan) dalam satu pintu.

**[Narasi / Yang Diucapkan]**
"Latar belakang pembuatan aplikasi ini bermula dari kendala yang sering dialami para pemain badminton di Jogja. Mencari lapangan kosong secara dadakan sangat sulit karena harus *chat* admin GOR satu per satu. Di sisi lain, admin GOR juga kebingungan mencatat jadwal di buku tulis yang sering memicu *double booking*. Oleh karena itu, saya membangun JogjaCourt sebagai solusi jembatan digital antara pemilik GOR dan penyewa lapangan."

---

## SLIDE 3: Arsitektur Sistem (Client-Server)
**[Teks di Slide]**
**Pendekatan: Decoupled Architecture (RESTful API)**
1.  **Frontend:** React.js (Vite) + Tailwind CSS
2.  **Backend:** Python FastAPI + SQLAlchemy (ORM)
3.  **Database:** Supabase (PostgreSQL) + Supabase Realtime (WebSockets)

**[Narasi / Yang Diucapkan]**
"Sistem ini dibangun menggunakan arsitektur modern yang memisahkan antara *Frontend* dan *Backend* secara tegas. Di sisi klien, saya menggunakan React dengan styling Tailwind CSS. Di sisi server, saya menggunakan FastAPI berbasis Python karena performa *asynchronous*-nya yang sangat cepat. Keduanya berkomunikasi murni menggunakan REST API. Untuk penyimpanan data, saya mengandalkan PostgreSQL dari Supabase."

---

## SLIDE 4: Perancangan Basis Data (ERD)
**[Teks di Slide]**
*(Masukkan Gambar ERD atau sebutkan tabel inti)*
*   **Tabel Master:** `users`, `venues` (GOR), `courts` (Lapangan).
*   **Tabel Transaksi:** `bookings`, `payments`.
*   **Tabel Pendukung:** `chat_messages` (Realtime).
*   **Keamanan:** Menggunakan *Row-Level Security (RLS)* di database.

**[Narasi / Yang Diucapkan]**
"Secara garis besar, database relasional yang saya rancang terdiri dari beberapa tabel utama. Ada tabel `users` untuk autentikasi, `venues` untuk data GOR, dan `courts` untuk data lapangannya. Proses utama terjadi di tabel `bookings` dan `payments`. Saya juga menerapkan *Row-Level Security*, sehingga secara sistem database, Mitra GOR A sama sekali tidak bisa mengintip data pesanan dari Mitra GOR B."

---

## SLIDE 5: Implementasi Fitur Utama & CRUD
**[Teks di Slide]**
*   **Create:** Pendaftaran akun Mitra GOR baru.
*   **Read:** Menampilkan ketersediaan jadwal secara *live*.
*   **Update:** Konfirmasi / penolakan pesanan oleh Admin.
*   **Delete:** Pembatalan pesanan secara *soft-delete*.

**[Narasi / Yang Diucapkan]**
"Implementasi CRUD merupakan urat nadi dari sistem ini. Fungsi *Create* terjadi saat Mitra mendaftarkan GOR atau pelanggan membuat pesanan baru. Fungsi *Read* berjalan saat pelanggan melihat daftar lapangan kosong di halaman *Explore*. Fungsi *Update* dieksekusi saat status pesanan diubah menjadi 'Confirmed', dan *Delete* terjadi jika pelanggan membatalkan pesanannya."

---

## SLIDE 6: Pencegahan Kecurangan & *Double Booking*
**[Teks di Slide]**
*   **Concurrency Handling:** Menggunakan *Row-Level Locking* (`FOR UPDATE`).
*   **Zero-Latency Chat:** Realtime WebSockets dengan Supabase CDC.

**[Narasi / Yang Diucapkan]**
"Sistem ini tidak hanya sekadar CRUD biasa. Saya menambahkan mekanisme *Row-Level Locking* di backend. Jika ada dua pengguna menekan tombol *booking* di lapangan dan jam yang sama persis dalam hitungan milidetik, sistem akan memaksa antrean dan menolak salah satunya, sehingga kemustahilan terjadi *double booking*. Selain itu, fitur *chat* yang dibuat sudah menggunakan teknologi WebSockets sehingga pesan terkirim seketika tanpa perlu memuat ulang halaman."

---

## SLIDE 7: Sesi Demonstrasi (Simulasi Aplikasi)
**[Teks di Slide]**
**[DEMO APLIKASI WEB - JOGJACOURT]**
*(Tidak perlu teks banyak di sini, slide ini hanya sebagai transisi sebelum Anda merekam browser)*

**[Narasi / Yang Diucapkan]**
"Sekarang, izinkan saya untuk mendemonstrasikan langsung aplikasi JogjaCourt. Saya akan menunjukkan aplikasi ini dari tiga sudut pandang: sebagai Pelanggan biasa, sebagai Admin Mitra pengelola GOR, dan sebagai Super Admin pemilik *platform*."
*(Mulai demokan web-nya: Login, Cari GOR, Booking, lalu buka tab lain login sebagai Mitra untuk melihat pesanan masuk).*

---

## SLIDE 8: Sesi Pengujian *Responsive Web*
**[Teks di Slide]**
**[DEMO RESPONSIVITAS - MOBILE & DESKTOP]**
Pendekatan: *Mobile-First Design* dengan Tailwind CSS.

**[Narasi / Yang Diucapkan]**
"Seperti yang disyaratkan dalam CPMK, desain aplikasi ini sudah *Responsive*. Menggunakan fitur *Inspect Element*, kita bisa melihat saat ukuran layar disempitkan menjadi ukuran *smartphone*, *Sidebar* navigasi secara otomatis menghilang dan berubah menjadi *Hamburger Menu*. Tata letak kartu statistik juga berubah dari horizontal (*grid* ke samping) menjadi vertikal ke bawah agar ramah terhadap sentuhan jari."

---

## SLIDE 9: Sesi Pengujian RESTful API (Postman/Swagger)
**[Teks di Slide]**
**[DEMO PENGUJIAN API]**
*   Cek Endpoint GET, POST, PUT, DELETE.
*   Validasi Status Code (200 OK, 201 Created, 400 Bad Request).

**[Narasi / Yang Diucapkan]**
"Selanjutnya, saya akan mendemonstrasikan pengujian RESTful API menggunakan dokumentasi Swagger dari FastAPI. Saya akan melakukan *request* GET untuk mengambil daftar lapangan, lalu POST untuk membuat pesanan. Perhatikan di sini, jika *request* berhasil, server mengembalikan *Status Code 200 OK* atau *201 Created*. Jika gagal (misal data kosong), akan muncul *400 Bad Request* beserta penjelasannya dalam format JSON."

---

## SLIDE 10: Sesi Bedah Source Code (Opsional tapi Penting)
**[Teks di Slide]**
**[PENJELASAN KODE PROGRAM]**
*   Routing & Logika Backend
*   Penerimaan Data di Frontend

**[Narasi / Yang Diucapkan]**
"Mari kita bedah sedikit struktur *source code*-nya. Di sisi Backend, saya memisahkan antara `routers` (untuk menerima *request* API) dan `services` (untuk logika bisnisnya). Sementara di Frontend, saya menggunakan `useEffect` dan `useState` dari React untuk memanggil API tersebut menggunakan protokol HTTP *fetch* dan me-*render*-nya ke tampilan HTML."

---

## SLIDE 11: Kendala, Solusi & Pengembangan
**[Teks di Slide]**
*   **Kendala:** Menjaga sinkronisasi data antar dua *browser* yang berbeda secara instan.
*   **Solusi:** Penggunaan *Change Data Capture* (CDC) via Supabase Realtime.
*   **Pengembangan Mendatang:** Integrasi *Payment Gateway* otomatis (Midtrans).

**[Narasi / Yang Diucapkan]**
"Dalam pengembangannya, kendala terbesar saya adalah bagaimana membuat data di layar Admin berubah seketika ketika ada *user* yang melakukan *booking*, tanpa Admin harus me-*refresh* halamannya. Solusinya, saya mengimplementasikan *Realtime Subscriptions*. Untuk pengembangan ke depan, sistem ini akan jauh lebih sempurna jika dihubungkan dengan API Payment Gateway seperti Midtrans agar konfirmasi pembayaran 100% tanpa campur tangan manusia."

---

## SLIDE 12: Kesimpulan
**[Teks di Slide]**
**Terima Kasih**
Sistem Informasi JogjaCourt siap mendigitalisasi ekosistem olahraga di Yogyakarta.

**[Narasi / Yang Diucapkan]**
"Kesimpulannya, JogjaCourt telah memenuhi seluruh standar arsitektur web modern yang aman, *real-time*, dan responsif. Sistem ini siap diimplementasikan untuk mendigitalisasi ekosistem penyewaan GOR badminton di Yogyakarta. Demikian presentasi proyek akhir dari saya. Mohon maaf atas segala kekurangan, terima kasih atas waktu Bapak Andri Heru Saputra. Wassalamualaikum Wr. Wb."
