-- ============================================================
-- ARENABOOKING — SUPABASE MIGRATION SCRIPT
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- Lakukan INI DULU sebelum menjalankan seed_data.py
-- ============================================================

-- 1. Tambah kolom description ke venues (jika belum ada)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Verifikasi struktur tabel venues
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'venues'
ORDER BY ordinal_position;
