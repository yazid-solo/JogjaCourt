import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loader2, ArrowLeft, ShieldCheck, MapPin, Calendar, Clock, CreditCard } from 'lucide-react';

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!state || !state.slots || state.slots.length === 0) {
    return <Navigate to="/explore" replace />;
  }

  const { venue, court, date, slots, totalPrice, bookingType = 'hourly', monthLabel } = state;

  // Assuming slots are sorted and continuous for this MVP
  const startTime = slots[0].start_time;
  const endTime = slots[slots.length - 1].end_time;

  const formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const handleProcessBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        court_id: court.id,
        booking_type: bookingType,
        booking_date: date,
        start_time: startTime,
        end_time: endTime
      };

      const res = await api.post('/bookings', payload);
      const booking = res.data;
      
      // Navigate to Payment Simulation with the new booking ID
      navigate(`/payment/${booking.id}`, { replace: true, state: { booking, venue, court, totalPrice, bookingType, monthLabel } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Gagal memproses booking. Mungkin jadwal sudah diambil orang lain.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <h1 className="text-3xl font-black mb-8">Ringkasan Pemesanan</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Detail Pemesanan */}
          <div className="space-y-6">
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                Detail Lapangan
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-400">GOR</p>
                  <p className="font-bold">{venue.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Lapangan</p>
                  <p className="font-bold">{court.name} <span className="text-neutral-500 font-normal">({court.court_type})</span></p>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D4AF37]" />
                Waktu Main
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-400">Tanggal</p>
                  <p className="font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Jam</p>
                  <p className="font-bold text-[#D4AF37]">
                    {startTime.substring(0,5)} - {endTime.substring(0,5)} WIB
                  </p>
                  {bookingType === 'hourly' && (
                    <p className="text-xs text-neutral-500 mt-1">Total {slots.length} Jam</p>
                  )}
                  {bookingType === 'monthly' && (
                    <p className="text-xs text-neutral-500 mt-1">Akses sepanjang {monthLabel}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rincian Harga & Bayar */}
          <div>
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl sticky top-24">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                Rincian Pembayaran
              </h2>
              
              <div className="space-y-3 mb-6">
                {bookingType === 'hourly' ? (
                  <>
                    {slots.map((slot, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-neutral-400">Sesi {slot.start_time.substring(0,5)}</span>
                        <span>{formatIDR(slot.price)}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Paket Member {monthLabel}</span>
                    <span>{formatIDR(slots[0].price)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Biaya Layanan</span>
                  <span>Rp 0</span>
                </div>
                <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold">Total Pembayaran</span>
                  <span className="text-2xl font-black text-[#D4AF37]">{formatIDR(totalPrice)}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl mb-6">
                  {error}
                </div>
              )}

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-6 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-emerald-500 leading-relaxed">
                  Pemesanan Anda aman. Anda akan diarahkan ke Payment Gateway Xendit setelah menekan tombol Lanjut.
                </p>
              </div>

              <button 
                onClick={handleProcessBooking}
                disabled={loading}
                className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lanjut ke Pembayaran'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
