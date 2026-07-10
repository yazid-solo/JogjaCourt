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
    <div className="min-h-screen bg-[#f4f6f8] text-neutral-900 font-sans flex items-center justify-center p-6">
      {/* Mockup Payment Gateway Wrapper */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* PG Header */}
        <div className="bg-[#012b6d] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <h2 className="font-bold text-lg tracking-wider mb-1 opacity-90">JOGJACOURT PAY</h2>
          <p className="text-sm opacity-70">Powered by Xendit Sandbox</p>
          <div className="mt-6">
            <p className="text-sm opacity-70 mb-1">Total Tagihan</p>
            <h1 className="text-4xl font-black">{formatIDR(totalPrice)}</h1>
          </div>
        </div>

        {/* PG Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p>Anda akan dialihkan ke halaman pembayaran aman resmi dari Xendit Payment Gateway.</p>
          </div>

          <p className="font-bold text-sm mb-4 text-center">Metode Pembayaran Tersedia di Halaman Berikutnya:</p>
          
          <div className="flex justify-center gap-4 mb-8 text-neutral-400">
            <div className="flex flex-col items-center gap-1">
              <Smartphone className="w-8 h-8" />
              <span className="text-[10px] font-bold">QRIS</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Wallet className="w-8 h-8" />
              <span className="text-[10px] font-bold">VA Bank</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-8 h-8" />
              <span className="text-[10px] font-bold">E-Wallet</span>
            </div>
          </div>

          <button 
            onClick={handleSimulatePayment}
            disabled={loading}
            className="w-full bg-[#012b6d] text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Membuat Tagihan Otomatis...</span>
              </>
            ) : (
              'LANJUTKAN KE PEMBAYARAN'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
