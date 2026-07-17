import React, { useState, useEffect, useRef } from 'react';
import { ScanLine, Search, CheckCircle, XCircle, Clock, Loader2, UserCircle, MapPin, Ticket, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

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
      const allBookings = res.data?.data || res.data || [];
      const found = allBookings.find(b => b.id.toLowerCase() === code.toLowerCase());
      
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
        return <span className="flex items-center w-max gap-1.5 text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg shadow-inner"><CheckCircle className="w-3.5 h-3.5" /> Siap Main (Confirmed)</span>;
      case 'completed':
        return <span className="flex items-center w-max gap-1.5 text-[10px] uppercase font-black tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg shadow-inner"><CheckCircle className="w-3.5 h-3.5" /> Selesai Main (Completed)</span>;
      case 'pending':
        return <span className="flex items-center w-max gap-1.5 text-[10px] uppercase font-black tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg shadow-inner"><Clock className="w-3.5 h-3.5" /> Belum Dibayar (Pending)</span>;
      case 'cancelled':
      case 'expired':
        return <span className="flex items-center w-max gap-1.5 text-[10px] uppercase font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg shadow-inner"><XCircle className="w-3.5 h-3.5" /> Batal / Expired</span>;
      default:
        return <span className="flex items-center w-max gap-1.5 text-[10px] uppercase font-black tracking-widest text-neutral-400 bg-neutral-500/10 border border-neutral-500/20 px-3 py-1.5 rounded-lg shadow-inner">{status}</span>;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 max-w-5xl mx-auto pb-24 md:pb-12 px-2 sm:px-0">
      
      {/* Header Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4 mb-8">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-[#111] flex items-center justify-center border border-white/5 shadow-2xl relative">
          <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-xl pointer-events-none"></div>
          <ScanLine className="w-12 h-12 text-blue-500 relative z-10" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Validasi Tiket GOR</h1>
          <p className="text-neutral-400 mt-3 max-w-md mx-auto text-sm">Scan QR Code dari pelanggan Anda, upload gambar bukti tiket, atau masukkan kode secara manual untuk Check-in.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* QR Code Scanner Section */}
        <motion.div variants={itemVariants} className="bg-[#111] border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] pointer-events-none transition-opacity"></div>
          
          <style>{`
            #reader video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              border-radius: 1.5rem !important;
            }
            #reader {
              border: none !important;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            #reader canvas {
              display: none !important;
            }
          `}</style>

          <div className="w-full text-center mb-6 relative z-10">
            <h2 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" /> Sensor Pintar
            </h2>
          </div>
          
          <div className="w-full relative rounded-3xl overflow-hidden border-2 border-dashed border-white/10 bg-[#0a0a0a] flex items-center justify-center aspect-[4/3] md:aspect-video shadow-inner" style={{ minHeight: '250px' }}>
            <div id="reader" className="w-full h-full absolute inset-0 z-10"></div>
            
            {!cameraActive && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-4 bg-black/90 backdrop-blur-sm">
                 <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                   <ScanLine className="w-8 h-8 text-neutral-600" />
                 </div>
                 <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Kamera Siaga</p>
               </div>
            )}

            {/* Scanning Laser Animation */}
            {cameraActive && (
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,1)] z-30 animate-[scan_2s_ease-in-out_infinite]"></div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6 relative z-10">
            {cameraActive ? (
              <button onClick={stopCamera} className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 font-black py-4 px-4 rounded-2xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 shadow-inner text-sm uppercase tracking-wider">
                <XCircle className="w-5 h-5" /> Matikan Kamera
              </button>
            ) : (
              <button onClick={startCamera} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black py-4 px-4 rounded-2xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                <Camera className="w-5 h-5" /> Aktifkan Kamera
              </button>
            )}
            
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex-1 bg-[#111] text-white border border-white/10 hover:border-white/20 font-black py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-inner text-sm uppercase tracking-wider"
            >
              <ImageIcon className="w-5 h-5 text-neutral-400" /> Upload QR
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </div>
        </motion.div>

        {/* Manual Input Fallback */}
        <motion.div variants={itemVariants} className="bg-[#111] border border-white/5 rounded-[2rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] pointer-events-none"></div>

          <form onSubmit={handleSearchSubmit} className="relative z-10 space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                <Search className="w-4 h-4 text-emerald-500" /> Pencarian Manual
              </h2>
              <p className="text-xs text-neutral-500 max-w-[250px] mx-auto leading-relaxed">Ketik atau tempel Booking ID jika pelanggan mengalami kendala pada gambar QR tiketnya.</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Ticket className="w-5 h-5 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="Contoh: a1b2c3d4-..." 
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-5 pl-12 pr-5 text-white text-base font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-neutral-700 shadow-inner"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !bookingId}
                className="w-full bg-emerald-500 text-white font-black px-8 py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all disabled:opacity-50 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 text-sm uppercase tracking-wider"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Verifikasi ID Manual
              </button>
            </div>

            <AnimatePresence>
              {errorMsg && (
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-center font-bold bg-red-500/10 py-4 px-4 rounded-xl border border-red-500/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>

      {/* Result Card Section */}
      <AnimatePresence>
        {bookingData && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-[#111] border border-blue-500/30 rounded-[2rem] p-6 md:p-10 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden"
          >
            {/* Top glowing bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mt-2 relative z-10">
              
              {/* Informasi Pelanggan */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                    <UserCircle className="w-8 h-8 text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Identitas Penyewa</p>
                    <h3 className="text-2xl font-black text-white tracking-tight">{bookingData.user?.name || 'Unknown'}</h3>
                    <p className="text-neutral-400 text-sm mt-0.5 font-medium">{bookingData.user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0a0a0a] p-4 sm:p-5 rounded-2xl border border-white/5 shadow-inner">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Status Pesanan</p>
                    <div>
                      {getStatusBadge(bookingData.status)}
                    </div>
                  </div>
                  <div className="bg-[#0a0a0a] p-4 sm:p-5 rounded-2xl border border-white/5 shadow-inner">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Tipe Tiket</p>
                    <p className="font-black text-white capitalize flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-neutral-500" />
                      {bookingData.booking_type === 'monthly' ? 'Bulanan' : 'Reguler'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="w-px bg-white/5 hidden md:block"></div>

              {/* Informasi Jadwal & Aksi */}
              <div className="flex-1 space-y-6 flex flex-col">
                <div className="bg-[#0a0a0a] p-5 sm:p-6 rounded-2xl border border-white/5 shadow-inner flex-1">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Detail Lokasi & Waktu
                  </p>
                  
                  <h4 className="text-xl font-black text-white tracking-tight">{bookingData.court?.name}</h4>
                  <p className="text-neutral-400 text-sm mt-1">{bookingData.court?.venue?.name}</p>
                  
                  <div className="mt-5 pt-5 border-t border-white/5">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Jadwal Penggunaan Lapangan</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-white font-black text-sm">
                        {new Date(bookingData.booking_date || bookingData.start_time).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-neutral-500 font-bold">•</span>
                      <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-xl font-black text-sm font-mono shadow-inner">
                        {bookingData.start_time?.substring(0,5)} - {bookingData.end_time?.substring(0,5)} WIB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {bookingData.status === 'confirmed' ? (
                    <button 
                      onClick={handleCheckIn}
                      disabled={isUpdating}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black px-6 py-5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-1 text-base uppercase tracking-wider"
                    >
                      {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : <ScanLine className="w-6 h-6" />}
                      EKSEKUSI CHECK-IN TIKET
                    </button>
                  ) : bookingData.status === 'completed' ? (
                    <div className="w-full bg-[#111] border-2 border-dashed border-blue-500/30 text-blue-400 font-black px-6 py-5 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wider text-sm shadow-inner">
                      <CheckCircle className="w-5 h-5" /> Pelanggan Sudah Check-In
                    </div>
                  ) : (
                    <div className="w-full bg-red-500/5 border-2 border-dashed border-red-500/30 text-red-500 font-black px-6 py-5 rounded-2xl flex items-center justify-center gap-2 text-center text-xs uppercase tracking-wider shadow-inner">
                      <XCircle className="w-5 h-5 shrink-0" /> Tiket tidak sah atau belum lunas!
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; opacity: 1; }
        }
      `}} />
    </motion.div>
  );
}
