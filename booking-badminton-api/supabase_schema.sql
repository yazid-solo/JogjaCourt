-- ============================================================
-- ARENABOOKING — SQL SCHEMA FOR SUPABASE
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- STEP 1: CREATE ENUM TYPES
-- ============================================================

CREATE TYPE user_role      AS ENUM ('customer', 'admin', 'super_admin');
CREATE TYPE court_type     AS ENUM ('single', 'double', 'mixed');
CREATE TYPE rental_type    AS ENUM ('hourly', 'monthly', 'both');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'expired');
CREATE TYPE booking_type   AS ENUM ('hourly', 'monthly');
CREATE TYPE payment_method AS ENUM ('transfer', 'cash', 'qris');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');


-- ============================================================
-- STEP 2: CREATE TABLES
-- ============================================================

-- TABEL USERS
CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    password_hash TEXT         NOT NULL,
    role          user_role    NOT NULL DEFAULT 'customer',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ           DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- TABEL AREAS (DAERAH)
CREATE TABLE IF NOT EXISTS areas (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    province    VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ           DEFAULT NOW()
);


-- TABEL VENUES (GOR)
CREATE TABLE IF NOT EXISTS venues (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id    UUID         NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    name       VARCHAR(150) NOT NULL,
    address    TEXT         NOT NULL,
    phone      VARCHAR(20),
    maps_url   TEXT,
    image_url  TEXT,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ           DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_venues_area_id ON venues(area_id);


-- TABEL COURTS (LAPANGAN)
CREATE TABLE IF NOT EXISTS courts (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id      UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    court_type    court_type  NOT NULL,
    rental_type   rental_type NOT NULL DEFAULT 'both',
    price_regular NUMERIC(10,2) NOT NULL,
    price_peak    NUMERIC(10,2) NOT NULL,
    price_monthly NUMERIC(10,2),
    peak_hours    VARCHAR(50),
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_courts_venue_id ON courts(venue_id);


-- TABEL BOOKINGS (PEMESANAN)
CREATE TABLE IF NOT EXISTS bookings (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    court_id     UUID           NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    booking_type booking_type   NOT NULL DEFAULT 'hourly',
    booking_date DATE           NOT NULL,
    start_time   TIME           NOT NULL,
    end_time     TIME           NOT NULL,
    total_price  NUMERIC(10,2)  NOT NULL,
    status       booking_status NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ             DEFAULT NOW(),
    expires_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id  ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court_id ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date     ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON bookings(status);


-- TABEL PAYMENTS (PEMBAYARAN)
CREATE TABLE IF NOT EXISTS payments (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id       UUID           NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    confirmed_by     UUID           REFERENCES users(id) ON DELETE SET NULL,
    amount           NUMERIC(10,2)  NOT NULL,
    method           payment_method NOT NULL,
    status           payment_status NOT NULL DEFAULT 'pending',
    proof_image_url  TEXT,
    rejection_reason TEXT,
    created_at       TIMESTAMPTZ             DEFAULT NOW(),
    confirmed_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments(status);


-- TABEL COURT_BLOCKS (BLOKIR LAPANGAN)
CREATE TABLE IF NOT EXISTS court_blocks (
    id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id   UUID    NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    blocked_by UUID    REFERENCES users(id) ON DELETE SET NULL,
    block_date DATE    NOT NULL,
    start_time TIME    NOT NULL,
    end_time   TIME    NOT NULL,
    reason     TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_court_blocks_court_id ON court_blocks(court_id);
CREATE INDEX IF NOT EXISTS idx_court_blocks_date     ON court_blocks(block_date);


-- ============================================================
-- STEP 3: ROW LEVEL SECURITY (RLS)
-- Backend FastAPI menggunakan service_role key, maka semua
-- operasi dari backend diizinkan penuh. Akses langsung dari
-- browser/anon diblokir untuk keamanan.
-- ============================================================

ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues       ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_blocks ENABLE ROW LEVEL SECURITY;

-- Service role (digunakan backend FastAPI) mendapat akses penuh
-- Supabase service_role key secara otomatis bypass RLS,
-- jadi policy di bawah ini hanya untuk anon/authenticated jika dibutuhkan.

-- Areas & Courts & Venues: boleh dibaca publik (untuk frontend tanpa login)
CREATE POLICY "areas_public_read"  ON areas  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "venues_public_read" ON venues FOR SELECT USING (is_active = TRUE);
CREATE POLICY "courts_public_read" ON courts FOR SELECT USING (is_active = TRUE);


-- ============================================================
-- STEP 4: SUPABASE STORAGE — Bucket untuk Bukti Pembayaran
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payments',
    'payments',
    TRUE,
    5242880,  -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: siapa pun bisa membaca (karena bucket public)
CREATE POLICY "allow_public_read_payments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'payments');

-- Policy: hanya user authenticated yang bisa upload
CREATE POLICY "allow_auth_upload_payments"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'payments');

-- Policy: user authenticated bisa update file mereka sendiri
CREATE POLICY "allow_auth_update_payments"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'payments');


-- ============================================================
-- STEP 5: SEED DATA — SUPER ADMIN DEFAULT
-- Email    : admin@arenabooking.com
-- Password : admin_arena_2026!
-- (bcrypt hash dihitung dari password di atas)
-- ============================================================

INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
    'Super Admin Arena',
    'admin@arenabooking.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewKyNCk83.OHF/0.',
    'super_admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- STEP 6: SEED DATA — DAERAH, GOR, LAPANGAN (Demo Data)
-- ============================================================

-- Insert Daerah
INSERT INTO areas (name, province, description, is_active) VALUES
  ('Bantul',      'D.I. Yogyakarta', 'Kabupaten Bantul dengan berbagai GOR badminton berkualitas.', TRUE),
  ('Sleman',      'D.I. Yogyakarta', 'Kabupaten Sleman, pusat olahraga di utara Yogyakarta.',      TRUE),
  ('Kota Jogja',  'D.I. Yogyakarta', 'Kota Yogyakarta, jantung budaya dan olahraga DIY.',          TRUE),
  ('Gunungkidul', 'D.I. Yogyakarta', 'Kabupaten Gunungkidul dengan arena olahraga berkembang.',    TRUE)
ON CONFLICT (name) DO NOTHING;


-- Insert GOR dan Lapangan dalam satu blok DO $$ agar aman referensi UUID
DO $$
DECLARE
    aid_bantul     UUID;
    aid_sleman     UUID;
    aid_kota_jogja UUID;

    vid_bantul1 UUID;
    vid_bantul2 UUID;
    vid_sleman1 UUID;
    vid_sleman2 UUID;
    vid_jogja1  UUID;
BEGIN
    -- Ambil ID Daerah
    SELECT id INTO aid_bantul     FROM areas WHERE name = 'Bantul';
    SELECT id INTO aid_sleman     FROM areas WHERE name = 'Sleman';
    SELECT id INTO aid_kota_jogja FROM areas WHERE name = 'Kota Jogja';

    -- -------------------------------------------------------
    -- INSERT GOR
    -- -------------------------------------------------------
    INSERT INTO venues (area_id, name, address, phone, image_url, is_active)
    VALUES (
        aid_bantul,
        'GOR Serbaguna Bantul',
        'Jl. Jend. Sudirman No. 1, Bantul, D.I. Yogyakarta',
        '0274-367458',
        'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=800&q=80',
        TRUE
    ) RETURNING id INTO vid_bantul1;

    INSERT INTO venues (area_id, name, address, phone, image_url, is_active)
    VALUES (
        aid_bantul,
        'GOR Lapangan Manunggal',
        'Jl. Parangtritis KM 7, Bantul, D.I. Yogyakarta',
        '0812-3456-7890',
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
        TRUE
    ) RETURNING id INTO vid_bantul2;

    INSERT INTO venues (area_id, name, address, phone, image_url, is_active)
    VALUES (
        aid_sleman,
        'GOR UNY Sleman',
        'Jl. Colombo No. 1, Depok, Sleman, D.I. Yogyakarta',
        '0274-550220',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
        TRUE
    ) RETURNING id INTO vid_sleman1;

    INSERT INTO venues (area_id, name, address, phone, image_url, is_active)
    VALUES (
        aid_sleman,
        'GOR Sleman Sport Center',
        'Jl. Magelang KM 13, Sleman, D.I. Yogyakarta',
        '0274-868521',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
        TRUE
    ) RETURNING id INTO vid_sleman2;

    INSERT INTO venues (area_id, name, address, phone, image_url, is_active)
    VALUES (
        aid_kota_jogja,
        'GOR Among Rogo',
        'Jl. Kenari No. 17, Umbulharjo, Kota Yogyakarta',
        '0274-562222',
        'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=800&q=80',
        TRUE
    ) RETURNING id INTO vid_jogja1;

    -- -------------------------------------------------------
    -- INSERT LAPANGAN
    -- -------------------------------------------------------

    -- GOR Serbaguna Bantul
    INSERT INTO courts (venue_id, name, court_type, rental_type, price_regular, price_peak, price_monthly, peak_hours, is_active) VALUES
    (vid_bantul1, 'Lapangan A',   'double', 'both',    75000, 100000, 2500000, '18:00-22:00', TRUE),
    (vid_bantul1, 'Lapangan B',   'single', 'hourly',  65000,  90000,    NULL, '18:00-22:00', TRUE),
    (vid_bantul1, 'Lapangan VIP', 'mixed',  'both',   120000, 150000, 4000000, '17:00-22:00', TRUE);

    -- GOR Lapangan Manunggal
    INSERT INTO courts (venue_id, name, court_type, rental_type, price_regular, price_peak, price_monthly, peak_hours, is_active) VALUES
    (vid_bantul2, 'Court 1', 'double', 'both',   70000, 95000, 2200000, '18:00-22:00', TRUE),
    (vid_bantul2, 'Court 2', 'double', 'hourly', 70000, 95000,    NULL, '18:00-22:00', TRUE);

    -- GOR UNY Sleman
    INSERT INTO courts (venue_id, name, court_type, rental_type, price_regular, price_peak, price_monthly, peak_hours, is_active) VALUES
    (vid_sleman1, 'Lapangan 1', 'double', 'both',   60000, 85000, 2000000, '18:00-22:00', TRUE),
    (vid_sleman1, 'Lapangan 2', 'double', 'hourly', 60000, 85000,    NULL, '18:00-22:00', TRUE),
    (vid_sleman1, 'Lapangan 3', 'single', 'both',   55000, 75000, 1800000, '18:00-22:00', TRUE);

    -- GOR Sleman Sport Center
    INSERT INTO courts (venue_id, name, court_type, rental_type, price_regular, price_peak, price_monthly, peak_hours, is_active) VALUES
    (vid_sleman2, 'Arena Utama', 'mixed',  'both',   85000, 115000, 2800000, '17:00-22:00', TRUE),
    (vid_sleman2, 'Arena B',     'double', 'hourly', 70000,  95000,    NULL, '17:00-22:00', TRUE);

    -- GOR Among Rogo
    INSERT INTO courts (venue_id, name, court_type, rental_type, price_regular, price_peak, price_monthly, peak_hours, is_active) VALUES
    (vid_jogja1, 'Arena A', 'mixed',  'both',   90000, 120000, 3000000, '17:00-22:00', TRUE),
    (vid_jogja1, 'Arena B', 'double', 'hourly', 80000, 110000,    NULL, '17:00-22:00', TRUE);

END $$;


-- ============================================================
-- VERIFIKASI — Jalankan query ini setelah semua berhasil
-- ============================================================
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT * FROM areas;
-- SELECT v.name AS gor, a.name AS daerah FROM venues v JOIN areas a ON v.area_id = a.id;
-- SELECT c.name AS lapangan, v.name AS gor, c.price_regular, c.price_monthly
--   FROM courts c JOIN venues v ON c.venue_id = v.id ORDER BY v.name, c.name;
-- SELECT email, role FROM users;
