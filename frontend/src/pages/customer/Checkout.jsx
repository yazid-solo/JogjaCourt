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

  const { venue, court, date, endDate, slots, totalPrice, bookingType = 'hourly', monthLabel, sessions = [], days_of_week = [0,1,2,3,4,5,6], isFullAccess = true } = state;

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

      // Add sessions data for monthly bookings
      if (bookingType === 'monthly' && sessions && sessions.length > 0) {
        payload.sessions = sessions;
        payload.is_full_access = isFullAccess;
        payload.days_of_week = days_of_week;
      }

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
    <div className="min-h-screen lg:h-[100dvh] bg-[#050505] text-white font-sans relative lg:overflow-hidden flex flex-col">
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10 flex flex-col lg:overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <button 
            onClick={() => window.history.back()}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg sm:text-xl font-black tracking-tight flex-1 text-center mr-8">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 lg:overflow-hidden">
          
          {/* Detail Pemesanan (Kiri) */}
          <div className="lg:col-span-7 space-y-4 h-full flex flex-col">
            <div className="bg-gradient-to-br from-[#111]/90 to-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-[1rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#D4AF37]/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#D4AF37]/10 transition-colors duration-700"></div>
              
              <h2 className="font-black text-lg mb-4 flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-transparent flex items-center justify-center border border-[#D4AF37]/30">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                </div>
                Lokasi & Lapangan
              </h2>
              
              <div className="space-y-3 relative z-10">
                <div className="flex gap-3 items-start bg-black/40 p-3 rounded-xl border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-[#222] border border-white/10 overflow-hidden flex-shrink-0">
                     {venue.image_url ? (
                        <img src={venue.image_url} alt="Venue" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full bg-neutral-800" />
                     )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-0.5">Venue</p>
                    <p className="font-black text-lg text-white leading-tight">{venue.name}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start bg-black/40 p-3 rounded-xl border border-white/5">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-6 h-6 text-neutral-400" />
                   </div>
                   <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-0.5">Lapangan Terpilih</p>
                    <p className="font-black text-lg text-[#D4AF37] leading-tight">{court.name}</p>
                    <p className="text-xs text-neutral-400 mt-1">{court.court_type}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#111]/90 to-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-[1rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group">
              <h2 className="font-black text-lg mb-4 flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-transparent flex items-center justify-center border border-[#D4AF37]/30">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                </div>
                Jadwal Bermain
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Tanggal</p>
                  </div>
                  <p className="font-bold text-sm sm:text-base text-white">
                    {bookingType === 'monthly' ? (
                      `${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    ) : (
                      new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    )}
                  </p>
                </div>
                
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Waktu</p>
                  </div>
                  <p className="font-black text-lg text-[#D4AF37]">
                    {startTime.substring(0,5)} - {endTime.substring(0,5)} <span className="text-sm font-normal text-neutral-400">WIB</span>
                  </p>
                  {bookingType === 'hourly' && (
                    <p className="text-xs text-neutral-500 font-medium mt-1">Total {slots.length} Jam Sesi</p>
                  )}
                </div>
              </div>

              {bookingType === 'monthly' && (
                <div className="mt-4 bg-black/40 p-4 rounded-2xl border border-white/5 relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Akses Member (30 Hari)</p>
                    <span className="px-2 py-1 rounded-md bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-black">{isFullAccess ? 'FULL ACCESS' : 'TERBATAS'}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                       <span className="text-neutral-400 text-xs w-16 flex-shrink-0">Hari:</span>
                       <p className="text-xs font-bold text-white leading-relaxed">
                         {days_of_week?.length === 7 ? 'Setiap Hari (Senin - Minggu)' : days_of_week?.map(d => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][d]).join(', ')}
                       </p>
                    </div>

                    {sessions && sessions.length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-neutral-400 text-xs w-16 flex-shrink-0">Sesi:</span>
                        <div className="space-y-1.5 flex-1">
                          {sessions.map((session, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5">
                              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {session.session_name}
                              </span>
                              <span className="font-mono text-[11px] text-neutral-300 bg-black/50 px-2 py-0.5 rounded">{session.time_range}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rincian Harga & Bayar */}
          <div className="lg:col-span-5 flex flex-col pb-6 lg:pb-0 lg:justify-center">
            <div className="bg-[#111]/80 backdrop-blur-2xl border border-white/10 p-4 sm:p-5 rounded-[1rem] shadow-2xl flex flex-col">
              <h2 className="font-black text-lg mb-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                Rincian Pembayaran
              </h2>
              
              <div className="space-y-2 mb-3 flex-1">
                {bookingType === 'hourly' ? (
                  <div className="space-y-1">
                    {slots.map((slot, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[13px]">
                        <span className="text-neutral-400 font-medium">Sesi {slot.start_time.substring(0,5)}</span>
                        <span className="font-mono">{formatIDR(slot.price)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-neutral-400 font-medium">Paket {monthLabel}</span>
                    <span className="font-mono">{formatIDR(slots[0].price)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-[13px] border-b border-white/10 pb-2">
                  <span className="text-neutral-400 font-medium">Biaya Layanan</span>
                  <span className="font-mono">Rp 0</span>
                </div>
                
                <div className="pt-2 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-0.5">Total Bayar</p>
                    <span className="text-xl sm:text-2xl font-black text-[#D4AF37] leading-none">{formatIDR(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-medium rounded-lg mb-3">
                  {error}
                </div>
              )}

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 sm:p-3 rounded-lg mb-3 flex gap-2 items-start">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-[11px] text-emerald-400/90 leading-snug font-medium">
                  Transaksi dilindungi enkripsi. Selesaikan pembayaran segera.
                </p>
              </div>

              <button 
                onClick={handleProcessBooking}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-black text-[13px] sm:text-sm py-2.5 sm:py-3 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)] relative overflow-hidden group mt-auto"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lanjut Bayar Sekarang'}
              </button>
              <p className="text-center text-[8px] text-neutral-600 mt-2 font-medium uppercase tracking-widest">
                Xendit Secure Payment
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
