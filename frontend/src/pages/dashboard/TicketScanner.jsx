import React, { useState, useEffect, useRef } from 'react';
import { ScanLine, Search, CheckCircle, XCircle, Clock, Loader2, UserCircle, MapPin, Ticket, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '@/lib/api';

export default function TicketScanner() {
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const qrCodeInstance = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Initialize the scanner instance but don't start it immediately to allow custom UI
    qrCodeInstance.current = new Html5Qrcode("reader");

    return () => {
      if (qrCodeInstance.current && qrCodeInstance.current.isScanning) {
        qrCodeInstance.current.stop().catch(console.error);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      if (qrCodeInstance.current && !qrCodeInstance.current.isScanning) {
        await qrCodeInstance.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setBookingId(decodedText);
            handleSearchCode(decodedText);
            stopCamera();
          },
          (errorMessage) => {
            // ignore constant read errors
          }
        );
        setCameraActive(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Kamera tidak dapat diakses. Pastikan browser Anda memiliki izin.");
    }
  };

  const stopCamera = async () => {
    if (qrCodeInstance.current && qrCodeInstance.current.isScanning) {
      try {
        await qrCodeInstance.current.stop();
        setCameraActive(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (cameraActive) {
      await stopCamera();
    }

    try {
      setLoading(true);
      const decodedText = await qrCodeInstance.current.scanFile(file, true);
      setBookingId(decodedText);
      handleSearchCode(decodedText);
    } catch (err) {
      setErrorMsg("QR Code tidak ditemukan pada gambar tersebut. Coba gambar lain.");
    } finally {
      setLoading(false);
      e.target.value = null; // reset input
    }
  };

  const handleSearchCode = async (code) => {
    if (!code) return;
    setLoading(true);
    setErrorMsg('');
    setBookingData(null);
    
    try {
      const res = await api.get('/bookings');
      const found = res.data.find(b => b.id.toLowerCase() === code.toLowerCase());
      
      if (found) {
        setBookingData(found);
      } else {
        setErrorMsg('Tiket tidak ditemukan atau bukan milik GOR Anda.');
      }
    } catch (error) {
      setErrorMsg('Gagal mencari data tiket. Pastikan koneksi aman.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (cameraActive) stopCamera();
    handleSearchCode(bookingId);
  };

  const handleCheckIn = async () => {
    if (!bookingData) return;
    setIsUpdating(true);
    try {
      await api.put(`/bookings/${bookingData.id}/admin`, {
        status: 'completed',
        total_price: parseFloat(bookingData.total_price)
      });
      alert('Check-in Berhasil! Tiket sudah ditandai sebagai Selesai.');
      setBookingData({ ...bookingData, status: 'completed' });
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal melakukan Check-in.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
        return <span className="flex items-center w-max gap-1.5 text-xs uppercase font-black tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full"><CheckCircle className="w-4 h-4" /> Siap Main (Confirmed)</span>;
      case 'completed':
        return <span className="flex items-center w-max gap-1.5 text-xs uppercase font-black tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full"><CheckCircle className="w-4 h-4" /> Selesai Main (Completed)</span>;
      case 'pending':
        return <span className="flex items-center w-max gap-1.5 text-xs uppercase font-black tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full"><Clock className="w-4 h-4" /> Belum Dibayar (Pending)</span>;
      case 'cancelled':
      case 'expired':
        return <span className="flex items-center w-max gap-1.5 text-xs uppercase font-black tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full"><XCircle className="w-4 h-4" /> Batal / Expired</span>;
      default:
        return <span className="flex items-center w-max gap-1.5 text-xs uppercase font-black tracking-wider text-neutral-400 bg-neutral-500/10 border border-neutral-500/20 px-3 py-1.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-10">
      
      {/* Header Section */}
      <div className="text-center space-y-4 mb-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
          <ScanLine className="w-10 h-10 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Validasi Tiket</h1>
          <p className="text-neutral-400 mt-2">Scan langsung melalui kamera, upload gambar QR Code, atau masukkan kode secara manual.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Scanner Section */}
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between">
          <style>{`
            #reader video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              border-radius: 1rem !important;
            }
            #reader {
              border: none !important;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            #reader canvas {
              display: none !important; /* Hide overlay canvas if any */
            }
          `}</style>

          <div className="w-full text-center mb-6">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
              <ScanLine className="w-5 h-5 text-[#D4AF37]" /> Sensor Pintar
            </h2>
          </div>
          
          <div className="w-full relative rounded-2xl overflow-hidden border-2 border-dashed border-white/10 bg-black flex items-center justify-center aspect-[4/3] md:aspect-video" style={{ minHeight: '300px' }}>
            <div id="reader" className="w-full h-full absolute inset-0 z-10"></div>
            {!cameraActive && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-4 bg-black/90 backdrop-blur-sm">
                 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                   <Camera className="w-8 h-8 text-neutral-500" />
                 </div>
                 <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">Kamera Nonaktif</p>
               </div>
            )}
          </div>

          <div className="flex gap-3 w-full mt-6">
            {cameraActive ? (
              <button onClick={stopCamera} className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 font-bold py-3 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5" /> Matikan Kamera
              </button>
            ) : (
              <button onClick={startCamera} className="flex-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 font-bold py-3 rounded-xl hover:bg-[#D4AF37]/20 transition-all flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" /> Aktifkan Kamera
              </button>
            )}
            
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold py-3 rounded-xl hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-5 h-5" /> Upload Gambar
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </div>
        </div>

        {/* Manual Input Fallback */}
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-bl-full pointer-events-none"></div>

          <form onSubmit={handleSearchSubmit} className="relative z-10 space-y-6">
            <div className="text-center">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
                <Search className="w-5 h-5 text-[#D4AF37]" /> Atau Input Manual
              </h2>
              <p className="text-xs text-neutral-500">Ketik/Paste ID Booking jika gambar bermasalah</p>
            </div>
            <div className="relative">
              <input 
                type="text" 
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Contoh: 123e4567-e89b..." 
                className="w-full bg-black border-2 border-white/10 rounded-2xl py-4 px-4 text-center text-white text-lg font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 transition-all placeholder:text-neutral-700"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !bookingId}
              className="w-full bg-[#D4AF37] text-black font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
              Cek Tiket Valid
            </button>

            {errorMsg && (
              <p className="text-red-400 text-center mt-4 font-bold bg-red-500/10 py-3 rounded-xl border border-red-500/20 animate-in fade-in zoom-in duration-300 text-sm">
                {errorMsg}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Result Section */}
      {bookingData && (
        <div className="bg-[#111] border border-[#D4AF37]/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(212,175,55,0.15)] animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#D4AF37] to-yellow-600"></div>

          <div className="flex flex-col md:flex-row gap-8 mt-2">
            
            {/* Informasi Pelanggan */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                  <UserCircle className="w-8 h-8 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-1">Pelanggan</p>
                  <h3 className="text-2xl font-black text-white">{bookingData.user?.name || 'Unknown'}</h3>
                  <p className="text-neutral-400">{bookingData.user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Status Tiket</p>
                  <div className="mt-2">
                    {getStatusBadge(bookingData.status)}
                  </div>
                </div>
                <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Tipe Pesanan</p>
                  <p className="font-bold text-white mt-1 capitalize">{bookingData.booking_type === 'monthly' ? 'Member Bulanan' : 'Reguler (Sekali Main)'}</p>
                </div>
              </div>
            </div>

            {/* Pemisah */}
            <div className="w-px bg-white/10 hidden md:block"></div>

            {/* Informasi Jadwal */}
            <div className="flex-1 space-y-6">
              <div>
                <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> Rincian Lapangan
                </p>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                  <h4 className="text-lg font-black text-white">{bookingData.court?.name}</h4>
                  <p className="text-neutral-400 flex items-center gap-1.5 text-sm mt-1">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" /> {bookingData.court?.venue?.name}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Jadwal Main</p>
                      <p className="font-black text-white">
                        {new Date(bookingData.booking_date || bookingData.start_time).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' • '}
                        <span className="text-[#D4AF37]">
                          {bookingData.start_time?.substring(0,5)} - {bookingData.end_time?.substring(0,5)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {bookingData.status === 'confirmed' ? (
                <button 
                  onClick={handleCheckIn}
                  disabled={isUpdating}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
                  Check-In Sekarang
                </button>
              ) : bookingData.status === 'completed' ? (
                <div className="w-full bg-white/5 border border-white/10 text-neutral-400 font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Pelanggan Sudah Check-In
                </div>
              ) : (
                <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2 text-center text-sm">
                  Tiket belum lunas atau dibatalkan, tidak dapat Check-In.
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
