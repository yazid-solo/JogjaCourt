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
  Loader2
} from 'lucide-react';
import api from '@/lib/api';

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
            Verifikasi GOR
          </h1>
          <p className="text-neutral-400 mt-2">
            Pusat KYC & Validasi pendaftaran GOR Mitra baru sebelum aktif di platform.
          </p>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex gap-4">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 min-w-[160px]">
            <p className="text-neutral-400 text-sm mb-1">Menunggu Verifikasi</p>
            <p className="text-3xl font-black text-orange-400">{pendingRequests.length}</p>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama GOR atau nama pemilik..." 
            className="w-full h-full min-h-[70px] bg-[#111] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
          />
        </div>
      </div>

      {/* List Table */}
      <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-neutral-400 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="p-5 font-bold">ID & Tanggal</th>
                <th className="p-5 font-bold">Informasi GOR</th>
                <th className="p-5 font-bold">Pemilik / Legalitas</th>
                <th className="p-5 font-bold">Status</th>
                <th className="p-5 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-5">
                    <p className="text-sm font-bold text-white mb-1">{req.id}</p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.submitted_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                    </p>
                  </td>
                  <td className="p-5">
                    <p className="text-sm font-bold text-white mb-1">{req.nama_gor}</p>
                    <p className="text-xs text-neutral-400 line-clamp-1">{req.alamat_gor}</p>
                  </td>
                  <td className="p-5">
                    <p className="text-sm font-bold text-white mb-1">{req.nama_pemilik}</p>
                    <p className="text-xs text-neutral-500">NIK: {req.nik}</p>
                  </td>
                  <td className="p-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black px-4 py-2 rounded-xl text-xs font-bold transition-all border border-[#D4AF37]/30"
                    >
                      Tinjau Data
                    </button>
                  </td>
                </tr>
              ))}
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-neutral-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D4AF37]" />
                    Memuat data...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-neutral-500">
                    Tidak ada pengajuan yang menunggu verifikasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setSelectedRequest(null); setShowRejectReason(false); }}></div>
          
          {/* Slide Over Panel */}
          <div className="bg-[#0a0a0a] w-full max-w-2xl h-full border-l border-white/10 shadow-2xl relative z-10 flex flex-col animate-[slideInRight_0.3s_ease-out]">
            
            {/* Modal Header */}
            <div className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#111]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <ShieldCheck className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-none">Tinjauan KYC GOR</h2>
                  <p className="text-xs text-neutral-400 mt-1">ID: {selectedRequest.id}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedRequest(null); setShowRejectReason(false); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              
              {/* Seksi 1: Data Legalitas / Pengelola */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Data Pengelola & Legalitas
                </h3>
                <div className="bg-[#111] p-5 rounded-2xl border border-white/5 grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Nama Sesuai KTP</p>
                    <p className="font-bold text-white text-sm">{selectedRequest.nama_pemilik}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">NIK</p>
                    <p className="font-bold text-white text-sm flex items-center gap-2">
                      {selectedRequest.nik} 
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Valid Format</span>
                    </p>
                  </div>
                  <div className="col-span-2 border-t border-white/5 pt-4 mt-2 grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Email Akun Pendaftar</p>
                      <p className="font-bold text-white text-sm">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Nomor Telepon (WhatsApp)</p>
                      <p className="font-bold text-white text-sm">{selectedRequest.no_telp_gor}</p>
                    </div>
                  </div>
                  <div className="col-span-2 border-t border-white/5 pt-4 mt-2">
                    <p className="text-xs text-neutral-500 mb-2">Informasi Rekening Pencairan</p>
                    <div className="flex items-center gap-3 bg-black/50 p-3 rounded-xl border border-white/5">
                      <CreditCard className="w-8 h-8 text-neutral-400" />
                      <div>
                        <p className="font-bold text-white text-sm">{selectedRequest.bank}</p>
                        <p className="text-xs text-neutral-400 font-mono">{selectedRequest.no_rek}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seksi 2: Informasi Operasional GOR */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Detail Operasional GOR
                </h3>
                <div className="bg-[#111] p-5 rounded-2xl border border-white/5 space-y-4">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Nama GOR</p>
                    <p className="font-bold text-white text-lg">{selectedRequest.nama_gor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Alamat Lengkap</p>
                    <p className="text-sm text-neutral-300 leading-relaxed">{selectedRequest.alamat_gor}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 mt-2">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Total Lapangan</p>
                      <p className="font-bold text-white text-sm">{selectedRequest.jml_lapangan} Lapangan</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Jam Operasional</p>
                      <p className="font-bold text-white text-sm">{selectedRequest.jam_buka} - {selectedRequest.jam_tutup}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Harga Sewa Rata-rata</p>
                      <p className="font-bold text-emerald-400 text-sm">Rp {selectedRequest.harga.toLocaleString('id-ID')}/jam</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seksi 3: Fasilitas Ekstra */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Fasilitas Tersedia</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.fasilitas && selectedRequest.fasilitas.length > 0 ? (
                    selectedRequest.fasilitas.map((fac, idx) => (
                      <span key={idx} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300">
                        {fac}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-500">Tidak ada data fasilitas.</span>
                  )}
                </div>
              </div>

              {/* Seksi 4: Validasi Foto Fisik */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Bukti Fisik / Foto GOR
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedRequest.foto_gor && selectedRequest.foto_gor.length > 0 ? (
                    selectedRequest.foto_gor.map((imgSrc, idx) => (
                      <div key={idx} className="aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-white/10 group relative cursor-pointer shadow-lg">
                        <img 
                          src={imgSrc.startsWith('/') ? `http://localhost:8000${imgSrc}` : imgSrc} 
                          alt={`Bukti Foto GOR ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                          <Search className="w-8 h-8 text-white mb-2" />
                          <span className="text-xs text-white font-medium uppercase tracking-wider">Perbesar Foto</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-6 bg-white/5 border border-white/10 rounded-xl text-center">
                      <ImageIcon className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                      <p className="text-neutral-400 text-sm">Tidak ada foto fisik yang diunggah.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Action Footer */}
            <div className="p-6 border-t border-white/5 bg-[#111]">
              {!showRejectReason ? (
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowRejectReason(true)}
                    disabled={actionLoading}
                    className="flex-1 py-4 bg-transparent border border-red-500/30 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" /> Tolak Pengajuan
                  </button>
                  <button 
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 py-4 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Setujui & Aktifkan
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                  <div>
                    <label className="block text-xs font-bold text-red-400 mb-2 uppercase tracking-wider">Alasan Penolakan</label>
                    <textarea 
                      required 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full bg-black border border-red-500/30 rounded-xl p-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none text-sm"
                      placeholder="Sebutkan alasan penolakan secara spesifik agar pengelola dapat memperbaiki data..."
                      rows="3"
                    ></textarea>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setShowRejectReason(false)} disabled={actionLoading} className="px-6 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm disabled:opacity-50">Batal</button>
                    <button onClick={handleReject} disabled={actionLoading} className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all flex justify-center items-center gap-2 text-sm shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50">
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Konfirmasi Penolakan'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
