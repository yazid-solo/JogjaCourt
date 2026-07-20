import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Konfigurasi Supabase Realtime belum lengkap! Pesan masuk mungkin tidak akan real-time. Mohon tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env frontend.");
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key');
