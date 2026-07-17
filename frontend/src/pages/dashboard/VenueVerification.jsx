import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  X, 
  FileText, 
  Image as ImageIcon,
  Check,
  CreditCard,
  Loader2,
  Building2,
  AlertTriangle
} from 'lucide-react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function VenueVerification() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKycRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/kyc-requests?status=pending');
      setPendingRequests(res.data);
    } catch (error) {
      console.error("Gagal memuat data verifikasi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycRequests();
  }, []);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/kyc-requests/${selectedRequest.id}/approve`);
      alert(`Pengajuan ${selectedRequest.nama_gor} Berhasil Disetujui! GOR dan Akun Mitra sekarang Live.`);
      setSelectedRequest(null);
      fetchKycRequests();
    } catch (error) {
      alert(error.response?.data?.detail || "Terjadi kesalahan saat menyetujui pengajuan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      alert("Harap masukkan alasan penolakan.");
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/kyc-requests/${selectedRequest.id}/reject`, { reason: rejectReason });
      alert(`Pengajuan ${selectedRequest.nama_gor} Ditolak. Alasan: ${rejectReason}`);
      setShowRejectReason(false);
      setSelectedRequest(null);
      setRejectReason('');
      fetchKycRequests();
    } catch (error) {
      alert(error.response?.data?.detail || "Terjadi kesalahan saat menolak pengajuan.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = pendingRequests.filter(req => 
    req.nama_gor.toLowerCase().includes(searchQuery.toLowerCase()) || 
    req.nama_pemilik.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-orange-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          <ShieldCheck className="absolute inset-0 m-auto w-8 h-8 text-orange-500 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-12 px-2 sm:px-0">
      
      {/* Cinematic Header Section */}
      <motion.div variants={itemVariants} className="relative bg-[#111] border border-white/5 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)] relative">
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                <ShieldCheck className="w-8 h-8 text-orange-500" />
              </div>
              Verifikasi KYC GOR
            </h1>
            <p className="text-neutral-400 mt-3 text-sm sm:text-base max-w-lg">
              Pusat validasi pendaftaran Mitra GOR baru. Verifikasi kelengkapan dokumen dan fisik sebelum GOR diaktifkan secara global di platform.
            </p>
          </div>
          
          <div className="bg-[#0a0a0a] border border-orange-500/20 rounded-2xl p-4 text-center min-w-[140px] shadow-[0_0_20px_rgba(249,115,22,0.1)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors"></div>
            <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-1 relative z-10">Menunggu Review</p>
            <p className="text-3xl font-black text-orange-500 relative z-10">{pendingRequests.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Control Bar */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama GOR atau pemilik..." 
            className="w-full bg-[#111] border border-white/5 hover:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold placeholder:text-neutral-600 placeholder:font-normal"
          />
        </div>
      </motion.div>

      {/* KYC Requests Grid Cards */}
      <motion.div variants={itemVariants} className="relative">
        <AnimatePresence mode="popLayout">
          {filteredRequests.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-[3rem] bg-[#0a0a0a]">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping"></div>
              </div>
              <p className="text-white font-black text-2xl mb-2">Bebas Tugas!</p>
              <p className="text-neutral-500 text-sm max-w-md">Tidak ada pengajuan GOR baru yang menunggu verifikasi saat ini. Seluruh data sudah bersih.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:gap-6">
              {filteredRequests.map((req, idx) => (
                <motion.div 
                  layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}
                  key={req.id} 
                  className="bg-[#0a0a0a] rounded-[2rem] p-5 sm:p-6 border border-white/5 group hover:border-orange-500/30 transition-all hover:shadow-[0_15px_40px_rgba(249,115,22,0.1)] overflow-hidden flex flex-col xl:flex-row xl:items-center gap-6 relative"
                >
                  
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[40px] pointer-events-none group-hover:bg-orange-500/10 transition-colors"></div>

                  {/* Kiri: Nama GOR & ID */}
                  <div className="w-full xl:w-[30%] flex justify-between items-start relative z-10 border-b xl:border-b-0 xl:border-r border-white/5 pb-5 xl:pb-0 xl:pr-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 shadow-inner flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-black text-white text-base sm:text-lg tracking-tight mb-1">{req.nama_gor}</p>
                        <p className="text-[10px] font-mono text-neutral-500 bg-white/5 inline-block px-2 py-0.5 rounded-md border border-white/5">
                          ID: {req.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tengah: Informasi */}
                  <div className="w-full xl:flex-1 flex flex-col sm:flex-row gap-4 relative z-10 justify-center">
                    <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 relative">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1.5">Informasi Pemilik</p>
                      <p className="font-black text-white text-sm tracking-tight truncate">{req.nama_pemilik}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-1 flex items-center gap-2">
                        NIK: {req.nik} 
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      </p>
                    </div>

                    <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1.5">Lokasi & Alamat</p>
                      <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">{req.alamat_gor}</p>
                    </div>
                  </div>
                  
                  {/* Kanan: Aksi & Tanggal */}
                  <div className="w-full xl:w-[25%] flex flex-col justify-center gap-3 relative z-10 pt-5 xl:pt-0 border-t xl:border-t-0 xl:border-l border-white/5 xl:pl-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 justify-center xl:justify-start mb-1">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span className="uppercase">Diajukan: {format(new Date(req.submitted_at), 'dd MMM yyyy', {locale: id})}</span>
                    </div>
                    <button onClick={() => setSelectedRequest(req)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white py-3.5 rounded-xl text-sm font-black transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:-translate-y-0.5"
                    >
                      <ShieldCheck className="w-4 h-4" /> TINJAU DATA
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Review Slide-over / Modal Panel */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex justify-end">
            
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setSelectedRequest(null); setShowRejectReason(false); }}></motion.div>
            
            {/* Slide Over Panel */}
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#0a0a0a] w-full max-w-2xl h-full border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] relative z-10 flex flex-col"
            >
              
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] pointer-events-none"></div>

              {/* Modal Header */}
              <div className="h-24 shrink-0 flex items-center justify-between px-6 sm:px-8 border-b border-white/5 bg-[#111] relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
                    <ShieldCheck className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white leading-none tracking-tight">Investigasi KYC</h2>
                    <p className="text-[11px] font-mono text-orange-400 mt-1.5 bg-orange-500/10 px-2 py-0.5 rounded uppercase tracking-wider inline-block border border-orange-500/20">
                      ID: {selectedRequest.id.substring(0,12)}...
                    </p>
                  </div>
                </div>
                <button onClick={() => { setSelectedRequest(null); setShowRejectReason(false); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all hover:rotate-90">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-8 relative z-10">
                
                {/* Seksi 1: Data Legalitas / Pengelola */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Data Pengelola & Legalitas
                  </h3>
                  <div className="bg-[#111] p-5 sm:p-6 rounded-3xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 shadow-inner relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/5 blur-[20px] rounded-full"></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Nama Sesuai KTP</p>
                      <p className="font-black text-white text-base">{selectedRequest.nama_pemilik}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Nomor Induk Kependudukan</p>
                      <p className="font-black text-white text-base font-mono flex items-center gap-2">
                        {selectedRequest.nik} 
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-sans border border-emerald-500/20">Tervalidasi</span>
                      </p>
                    </div>
                    <div className="col-span-1 sm:col-span-2 border-t border-white/5 pt-5 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Email Registrasi</p>
                        <p className="font-bold text-white text-sm">{selectedRequest.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Telepon Utama (WhatsApp)</p>
                        <p className="font-bold text-white text-sm">{selectedRequest.no_telp_gor}</p>
                      </div>
                    </div>
                    <div className="col-span-1 sm:col-span-2 border-t border-white/5 pt-5 mt-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">Rekening Penampung (Pencairan Dana)</p>
                      <div className="flex items-center gap-4 bg-black/60 p-4 rounded-2xl border border-white/10 shadow-inner">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                          <CreditCard className="w-6 h-6 text-[#D4AF37]" />
                        </div>
                        <div>
                          <p className="font-black text-white text-base">{selectedRequest.bank}</p>
                          <p className="text-xs text-neutral-400 font-mono tracking-widest mt-0.5">{selectedRequest.no_rek}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seksi 2: Informasi Operasional GOR */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Operasional GOR
                  </h3>
                  <div className="bg-[#111] p-5 sm:p-6 rounded-3xl border border-white/5 space-y-5 shadow-inner relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-500/5 blur-[40px]"></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Nama Tempat GOR</p>
                      <p className="font-black text-white text-xl tracking-tight">{selectedRequest.nama_gor}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Alamat Domisili Fisik</p>
                      <p className="text-sm text-neutral-300 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">{selectedRequest.alamat_gor}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-5 mt-2">
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Total Court</p>
                        <p className="font-black text-white text-lg">{selectedRequest.jml_lapangan}</p>
                      </div>
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Jam Operasional</p>
                        <p className="font-black text-white text-lg font-mono">{selectedRequest.jam_buka} - {selectedRequest.jam_tutup}</p>
                      </div>
                      <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20 text-center shadow-inner">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 mb-1">Harga Acuan (Rata-rata)</p>
                        <p className="font-black text-emerald-400 text-sm mt-1">Rp {selectedRequest.harga.toLocaleString('id-ID')}<span className="text-[10px] text-emerald-500/50">/jam</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seksi 3: Fasilitas Ekstra */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-widest">Fasilitas Infrastruktur</h3>
                  <div className="flex flex-wrap gap-2 bg-[#111] p-4 rounded-2xl border border-white/5 shadow-inner">
                    {selectedRequest.fasilitas && selectedRequest.fasilitas.length > 0 ? (
                      selectedRequest.fasilitas.map((fac, idx) => (
                        <span key={idx} className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm">
                          {fac}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-500 italic px-2">Klaim tidak menyertakan daftar fasilitas.</span>
                    )}
                  </div>
                </div>

                {/* Seksi 4: Validasi Foto Fisik */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Dokumentasi & Bukti Fisik
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedRequest.foto_gor && selectedRequest.foto_gor.length > 0 ? (
                      selectedRequest.foto_gor.map((imgSrc, idx) => (
                        <div key={idx} className="aspect-video bg-[#111] rounded-2xl overflow-hidden border border-white/10 group relative cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                          <img 
                            src={imgSrc.startsWith('/') ? `http://localhost:8000${imgSrc}` : imgSrc} 
                            alt={`Bukti Foto GOR ${idx + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                            <Search className="w-8 h-8 text-white mb-2 shadow-lg rounded-full" />
                            <span className="text-[10px] text-white font-black uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-lg border border-white/20">PERBESAR DOKUMEN</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 p-8 bg-[#111] border-2 border-dashed border-white/10 rounded-3xl text-center">
                        <AlertTriangle className="w-10 h-10 text-orange-500/50 mx-auto mb-3" />
                        <p className="text-white font-bold mb-1">Dokumen Fisik Kosong</p>
                        <p className="text-neutral-500 text-xs max-w-sm mx-auto">Sangat disarankan menolak pengajuan ini karena pendaftar tidak menyertakan bukti eksistensi GOR secara visual.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Footer (Sticky) */}
              <div className="p-6 border-t border-white/5 bg-[#0a0a0a] relative z-20 shrink-0">
                <AnimatePresence mode="wait">
                  {!showRejectReason ? (
                    <motion.div key="action-buttons" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex gap-4">
                      <button 
                        onClick={() => setShowRejectReason(true)}
                        disabled={actionLoading}
                        className="flex-1 py-4 bg-transparent border border-red-500/30 text-red-500 font-black rounded-2xl hover:bg-red-500/10 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" /> REJECT (TOLAK)
                      </button>
                      <button 
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="flex-[2] py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black rounded-2xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} APPROVE & PUBLIKASIKAN
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="reject-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-black text-red-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5" /> Deklarasi Penolakan
                        </label>
                        <textarea 
                          required 
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full bg-black/60 border border-red-500/30 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none text-sm shadow-inner placeholder:text-neutral-600"
                          placeholder="Sebutkan alasan penolakan secara jelas (contoh: Foto tidak jelas, NIK tidak sesuai, dst)..."
                          rows="3"
                        ></textarea>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setShowRejectReason(false)} disabled={actionLoading} className="px-6 py-4 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 transition-all text-sm disabled:opacity-50 border border-white/5">BATAL</button>
                        <button onClick={handleReject} disabled={actionLoading} className="flex-1 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-black rounded-2xl hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex justify-center items-center gap-2 text-sm disabled:opacity-50">
                          {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'EKSEKUSI PENOLAKAN'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
