-- ========================================================================================
-- SISTEM BOOKING LAPANGAN BADMINTON (JOGJACOURT)
-- FULL DATABASE SCHEMA & REALTIME CONFIGURATION (SUPABASE POSTGRES)
-- ========================================================================================
-- File ini dibuat khusus untuk referensi lengkap dan realistis dari struktur database.
-- Mencakup Tables, Enums, Foreign Keys, Triggers, RLS Policies, dan Realtime configs.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('user', 'mitra_admin', 'super_admin');
CREATE TYPE venue_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- 3. TABLES

-- Table: users (Pengguna / Admin)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255),
    role user_role DEFAULT 'user',
    phone_number VARCHAR(20),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: venues (GOR / Tempat Lapangan)
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    facilities JSONB DEFAULT '[]', -- Array of strings (e.g., ["Toilet", "Kantin", "Parkir Luas"])
    status venue_status DEFAULT 'pending',
    photos JSONB DEFAULT '[]', -- Array of URLs
    rating DOUBLE PRECISION DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: courts (Data Lapangan spesifik dalam satu GOR)
CREATE TABLE public.courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Lapangan 1"
    court_type VARCHAR(50) DEFAULT 'Sintetis', -- Sintetis, Vinyl, Semen, Kayu
    price_per_hour DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: bookings (Pesanan Lapangan)
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status booking_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: payments (Transaksi Pembayaran)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50), -- e.g., 'transfer_bank', 'qris', 'ewallet'
    status payment_status DEFAULT 'pending',
    proof_url TEXT, -- URL for manual transfer proof
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: reviews (Ulasan dan Rating Lapangan)
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: chat_messages (Pesan Chat Realtime antara User & Mitra)
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: notifications (Notifikasi Push Realtime)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50), -- e.g., 'booking_success', 'payment_received', 'kyc_approved'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: kyc_verifications (Verifikasi Identitas Mitra GOR)
CREATE TABLE public.kyc_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ktp_number VARCHAR(50) NOT NULL,
    ktp_photo_url TEXT NOT NULL,
    selfie_photo_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ========================================================================================
-- 4. TRIGGERS (Auto Update Timestamp)
-- ========================================================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_venues_modtime BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_courts_modtime BEFORE UPDATE ON public.courts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_bookings_modtime BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_kyc_modtime BEFORE UPDATE ON public.kyc_verifications FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


-- ========================================================================================
-- 5. REALTIME PUBLICATION CONFIGURATION (Supabase WebSockets)
-- ========================================================================================
-- Ini yang membuat sistem dasbor menjadi REALTIME OTOMATIS tanpa perlu refresh (Live Updates)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.bookings, 
    public.payments, 
    public.chat_messages, 
    public.notifications,
    public.venues;


-- ========================================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================================
-- Mengamankan database secara ketat agar tiap user/mitra hanya bisa mengakses data mereka sendiri
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Policy Users
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policy Venues
CREATE POLICY "Venues are viewable by everyone" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Mitra can insert venues" ON public.venues FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their venues" ON public.venues FOR UPDATE USING (auth.uid() = owner_id);

-- Policy Bookings
CREATE POLICY "Users can read own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Mitra can read bookings for their venues" ON public.bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.venues WHERE venues.id = bookings.venue_id AND venues.owner_id = auth.uid())
);
CREATE POLICY "Users can insert bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy Payments
CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy Chat (Realtime Chatting)
CREATE POLICY "Users can read their chats" ON public.chat_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send chats" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policy Notifications
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications (mark read)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ========================================================================================
-- END OF SCHEMA
-- ========================================================================================
