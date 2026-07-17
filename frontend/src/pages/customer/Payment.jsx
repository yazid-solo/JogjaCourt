import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import api from '@/lib/api';
import { Loader2, CheckCircle2, ShieldCheck, Wallet, ArrowRight, Smartphone } from 'lucide-react';

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('qris');

  if (!state || !state.booking) {
    return <Navigate to="/explore" replace />;
  }

  const { booking, venue, court, totalPrice } = state;

  const formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const handleSimulatePayment = async () => {
    setLoading(true);
    try {
      // Panggil endpoint backend asli untuk men-generate Invoice Xendit
      const res = await api.post(`/payments/${booking.id}/xendit-invoice`);
      if (res.data.invoice_url) {
        // Alihkan (redirect) pengguna secara nyata ke halaman pembayaran Xendit
        window.location.href = res.data.invoice_url;
      } else {
        alert("Gagal mendapatkan link pembayaran.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Payment failed", error);
      alert(error.response?.data?.detail || "Koneksi ke Payment Gateway gagal.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-[#111] p-8 rounded-3xl border border-white/10">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Pembayaran Berhasil!</h1>
          <p className="text-neutral-400 mb-8">
            Lapangan <strong>{court.name}</strong> di <strong>{venue.name}</strong> berhasil diamankan. Selamat bermain!
          </p>
          <div className="bg-black border border-white/5 p-4 rounded-xl mb-8 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">ID Booking</span>
              <span className="font-mono text-white">{booking.id.substring(0,8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Total Dibayar</span>
              <span className="font-bold text-[#D4AF37]">{formatIDR(totalPrice)}</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/my-bookings')}
            className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition-colors"
          >
            Lihat Tiket Saya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Mockup Payment Gateway Wrapper */}
      <div className="w-full max-w-md bg-[#111]/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative z-10">
        
        {/* PG Header */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-black p-8 text-center relative overflow-hidden border-b border-white/10">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl"></div>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-yellow-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
          </div>
          <h2 className="font-black text-xl tracking-widest mb-1 text-white uppercase">JOGJACOURT PAY</h2>
          <p className="text-xs text-[#D4AF37] font-medium tracking-widest uppercase mb-6">Secured by 256-bit Encryption</p>
          
          <div>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-2">Total Tagihan</p>
            <h1 className="text-4xl font-black text-[#D4AF37]">{formatIDR(totalPrice)}</h1>
          </div>
        </div>

        {/* PG Content */}
        <div className="p-8">
          <div className="flex items-start gap-3 text-sm text-neutral-300 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10">
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">Transaksi Anda dilindungi secara end-to-end dengan sistem enkripsi tingkat bank. Silakan selesaikan pembayaran di halaman resmi gateway kami.</p>
          </div>

          <p className="font-bold text-xs text-neutral-500 uppercase tracking-widest mb-5 text-center">Metode Pembayaran Tersedia</p>
          
          <div className="flex justify-center gap-6 mb-8 text-neutral-400">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 transition-all">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">QRIS</span>
            </div>
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 transition-all">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">VA BANK</span>
            </div>
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 transition-all">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">E-WALLET</span>
            </div>
          </div>

          <button 
            onClick={handleSimulatePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-[0_0_30px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              'BAYAR SEKARANG'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
