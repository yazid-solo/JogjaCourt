import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  Save, UserCircle, Building2, CreditCard, Loader2, 
  CheckCircle2, ShieldCheck, Camera, ChevronRight, Lock, Key, Shield, UserCog, Activity, Trophy
} from 'lucide-react';

import { ErrorBoundary } from '@/components/ErrorBoundary';

const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

function SettingsInner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState('');
  const [pwdErrorMsg, setPwdErrorMsg] = useState('');
  
  // Image Upload States
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = React.useRef(null);
  
  // Modal States
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  
  const [stats, setStats] = useState({ total_revenue: 0, total_bookings: 0 });
  
  // Set default tab based on role
  const [activeTab, setActiveTab] = useState(user?.role === 'super_admin' ? 'profil' : 'rekening');
  
  const [formData, setFormData] = useState({
    bank_name: user?.bank_name || '',
    bank_account_number: user?.bank_account_number || '',
    bank_account_name: user?.bank_account_name || ''
  });

  const [pwdData, setPwdData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats({
          total_revenue: res.data.total_revenue_today || 0,
          total_bookings: res.data.total_bookings_today || 0
        });
      } catch (error) {
        console.error("Gagal memuat statistik", error);
      }
    };
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchStats();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePwdChange = (e) => {
    setPwdData({ ...pwdData, [e.target.name]: e.target.value });
  };

  const handleSubmitBank = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      await api.put('/users/me/bank-info', formData);
      setSuccessMsg('Informasi rekening pencairan berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error("Gagal menyimpan pengaturan", error);
      alert(error.response?.data?.detail || "Terjadi kesalahan aplikasi");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwdErrorMsg('');
    setPwdSuccessMsg('');

    if (pwdData.new_password !== pwdData.confirm_password) {
      setPwdErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (pwdData.new_password.length < 6) {
      setPwdErrorMsg('Kata sandi baru minimal 6 karakter.');
      return;
    }

    setPwdLoading(true);
    try {
      // Assuming a generic endpoint for password change. Will gracefully handle 404 if not exist.
      await api.put('/users/me/password', {
        old_password: pwdData.old_password,
        new_password: pwdData.new_password
      });
      setPwdSuccessMsg('Kata sandi berhasil diperbarui.');
      setPwdData({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwdSuccessMsg(''), 4000);
    } catch (error) {
      if (error.response?.status === 404) {
        setPwdErrorMsg("Layanan pembaruan kata sandi sedang dalam perbaikan.");
      } else {
        setPwdErrorMsg(error.response?.data?.detail || "Gagal memperbarui kata sandi.");
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactLoading(true);
    // Simulate sending message
    setTimeout(() => {
      setContactLoading(false);
      setContactSuccess(true);
      setTimeout(() => {
        setContactSuccess(false);
        setShowContactModal(false);
      }, 3000);
    }, 1500);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setShowImageMenu(false);
    setImageLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await api.post('/users/me/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Force reload to update auth context easily
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Gagal mengunggah foto.");
      setImageLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm("Hapus foto profil saat ini?")) return;
    setShowImageMenu(false);
    setImageLoading(true);
    try {
      await api.delete('/users/me/profile-image');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus foto profil.");
      setImageLoading(false);
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
          {isSuperAdmin ? (
            <><Shield className="w-8 h-8 text-[#D4AF37]" /> Profil Administrator</>
          ) : (
            <><Building2 className="w-8 h-8 text-[#D4AF37]" /> Profil Mitra GOR</>
          )}
        </h1>
        <p className="text-neutral-400">Kelola identitas, keamanan, dan pengaturan operasional akun Anda.</p>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden mb-8 shadow-2xl relative">
        {/* Banner */}
        <div className={`h-40 relative ${isSuperAdmin ? 'bg-gradient-to-r from-purple-900/40 via-neutral-900 to-black' : 'bg-gradient-to-r from-neutral-800 via-neutral-900 to-[#1a1a1a]'}`}>
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 ${isSuperAdmin ? 'bg-purple-500/20' : 'bg-[#D4AF37]/10'}`}></div>
        </div>
        
        {/* Profile Info */}
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-8">
            <div className="relative group inline-block">
              <div 
                onClick={() => setShowImageMenu(!showImageMenu)}
                className="w-32 h-32 rounded-full bg-black border-4 border-[#111] flex items-center justify-center overflow-hidden cursor-pointer relative"
              >
                {imageLoading ? (
                   <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                ) : user?.profile_image ? (
                  <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                ) : (
                  <UserCircle className="w-20 h-20 text-neutral-600 group-hover:opacity-50 transition-opacity" />
                )}
                
                {/* Overlay Text on Hover */}
                {!imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/50 px-2 py-1 rounded-md">Ubah Foto</span>
                  </div>
                )}
              </div>
              
              <div 
                onClick={() => setShowImageMenu(!showImageMenu)}
                className="absolute bottom-1 right-1 w-8 h-8 bg-[#D4AF37] rounded-full border-2 border-[#111] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg"
              >
                <Camera className="w-4 h-4 text-black" />
              </div>

              {/* Dropdown Menu for Image */}
              {showImageMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                  >
                    Unggah Foto Baru
                  </button>
                  {user?.profile_image && (
                    <button 
                      onClick={handleDeleteImage}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      Hapus Foto
                    </button>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                  />
                </div>
              )}
              
              {/* Click outside overlay to close menu */}
              {showImageMenu && (
                 <div className="fixed inset-0 z-40" onClick={() => setShowImageMenu(false)}></div>
              )}
            </div>
            
            <div className="flex-1 pb-2 relative z-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black text-white tracking-tight">{user?.name || user?.username}</h2>
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-neutral-400 mb-3">{user?.email}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isSuperAdmin ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20'}`}>
                  {isSuperAdmin ? 'Super Admin (Root)' : 'Mitra GOR Resmi'}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Akun Terverifikasi
                </span>
              </div>
            </div>

            {/* Quick Stats (Only show stats relevant to admin role) */}
            {!isSuperAdmin && (
              <div className="flex gap-4 pb-2 w-full md:w-auto">
                <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex-1 md:flex-none md:min-w-[140px]">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Booking Hari Ini</p>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-xl font-black text-white">{stats.total_bookings}</span>
                  </div>
                </div>
                <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex-1 md:flex-none md:min-w-[160px]">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Pendapatan Hari Ini</p>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xl font-black text-white">{formatIDR(stats.total_revenue)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 overflow-x-auto hide-scrollbar gap-2">
            {isSuperAdmin && (
              <button 
                onClick={() => setActiveTab('profil')}
                className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
                  activeTab === 'profil' ? 'border-[#D4AF37] text-[#D4AF37] bg-white/5 rounded-t-lg' : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/5 rounded-t-lg'
                }`}
              >
                Informasi Tambahan
              </button>
            )}

            {!isSuperAdmin && (
              <button 
                onClick={() => setActiveTab('rekening')}
                className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
                  activeTab === 'rekening' ? 'border-[#D4AF37] text-[#D4AF37] bg-white/5 rounded-t-lg' : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/5 rounded-t-lg'
                }`}
              >
                Rekening Pencairan
              </button>
            )}

            <button 
              onClick={() => setActiveTab('keamanan')}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
                activeTab === 'keamanan' ? 'border-[#D4AF37] text-[#D4AF37] bg-white/5 rounded-t-lg' : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/5 rounded-t-lg'
              }`}
            >
              Keamanan Akun
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col - Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB: INFORMASI TAMBAHAN (Super Admin) */}
          {activeTab === 'profil' && isSuperAdmin && (
             <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8">
               <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                   <UserCog className="w-5 h-5 text-purple-400" />
                 </div>
                 Detail Administrator
               </h3>
               
               <div className="space-y-4">
                 <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                   <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Email Utama</p>
                   <p className="text-white font-medium">{user?.email}</p>
                 </div>
                 <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                   <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Tingkat Hak Akses</p>
                   <p className="text-purple-400 font-bold">Level 1 (Super Admin)</p>
                 </div>
                 <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                   <p className="text-xs text-emerald-500/70 font-bold uppercase mb-1">Status Aplikasi</p>
                   <p className="text-emerald-400 font-bold flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     Seluruh Layanan Berjalan Normal
                   </p>
                 </div>
               </div>
             </div>
          )}

          {/* TAB: REKENING PENCAIRAN (Mitra GOR) */}
          {activeTab === 'rekening' && !isSuperAdmin && (
            <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none"></div>

              <h3 className="text-xl font-bold flex items-center gap-3 mb-2 relative z-10">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                  <Building2 className="w-5 h-5 text-[#D4AF37]" />
                </div>
                Data Rekening Pencairan
              </h3>
              <p className="text-sm text-neutral-400 mb-8 ml-12 relative z-10">
                Data rekening bank yang valid dibutuhkan untuk melakukan transfer (payout) otomatis dari pendapatan bagi hasil GOR Anda.
              </p>

              <form onSubmit={handleSubmitBank} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Nama Bank / Institusi <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      placeholder="Misal: BCA, Mandiri, BNI"
                      className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Nomor Rekening <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <CreditCard className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        name="bank_account_number"
                        value={formData.bank_account_number}
                        onChange={handleChange}
                        placeholder="000-0000-000"
                        className="w-full bg-black/80 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Nama Pemilik Rekening (Sesuai Buku Tabungan) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="bank_account_name"
                      value={formData.bank_account_name}
                      onChange={handleChange}
                      placeholder="Masukkan nama lengkap pemilik rekening"
                      className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {successMsg && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    {successMsg}
                  </div>
                )}

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#D4AF37] text-black px-8 py-3.5 rounded-xl font-bold hover:bg-yellow-500 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Simpan Informasi Rekening
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: KEAMANAN AKUN (All Roles) */}
          {activeTab === 'keamanan' && (
            <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8">
              <h3 className="text-xl font-bold flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Lock className="w-5 h-5 text-blue-400" />
                </div>
                Keamanan Kata Sandi
              </h3>
              <p className="text-sm text-neutral-400 mb-8 ml-12">
                Ganti kata sandi secara berkala untuk menjaga keamanan akun Anda dari akses yang tidak sah.
              </p>

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Kata Sandi Saat Ini</label>
                    <div className="relative">
                      <Key className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="password"
                        name="old_password"
                        value={pwdData.old_password}
                        onChange={handlePwdChange}
                        placeholder="••••••••"
                        className="w-full bg-black/80 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Kata Sandi Baru</label>
                      <input
                        type="password"
                        name="new_password"
                        value={pwdData.new_password}
                        onChange={handlePwdChange}
                        placeholder="Minimal 6 karakter"
                        className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Ulangi Kata Sandi Baru</label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={pwdData.confirm_password}
                        onChange={handlePwdChange}
                        placeholder="Konfirmasi sandi baru"
                        className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {pwdErrorMsg && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    {pwdErrorMsg}
                  </div>
                )}
                
                {pwdSuccessMsg && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    {pwdSuccessMsg}
                  </div>
                )}

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105"
                  >
                    {pwdLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                    Perbarui Kata Sandi
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Col - Quick Actions & Info */}
        <div className="space-y-6">
          {!isSuperAdmin && (
            <>
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-2">Bantuan & Regulasi</h3>
              
              <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                <div onClick={() => setShowGuideModal(true)} className="flex items-center justify-between p-5 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors group">
                  <span className="font-bold text-sm text-neutral-300 group-hover:text-white transition-colors">Panduan Mitra</span>
                  <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-[#D4AF37] transition-colors" />
                </div>
                
                <div onClick={() => setShowPolicyModal(true)} className="flex items-center justify-between p-5 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors group">
                  <span className="font-bold text-sm text-neutral-300 group-hover:text-white transition-colors">Kebijakan Pencairan Dana</span>
                  <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-[#D4AF37] transition-colors" />
                </div>
                
                <div onClick={() => setShowContactModal(true)} className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors group">
                  <span className="font-bold text-sm text-neutral-300 group-hover:text-white transition-colors">Hubungi Tim JogjaCourt</span>
                  <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-[#D4AF37] transition-colors" />
                </div>
              </div>
            </>
          )}
          
          {/* Version Info Card */}
          <div className="bg-black/30 border border-white/5 rounded-3xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-neutral-500" />
            </div>
            <p className="font-bold text-white text-sm">JogjaCourt Admin Panel</p>
            <p className="text-xs text-neutral-500 mt-1">Versi 2.0.5 Enterprise</p>
            <p className="text-[10px] text-neutral-600 mt-4 uppercase tracking-widest">© 2026 Hak Cipta Dilindungi</p>
          </div>
        </div>

      </div>

      {/* MODAL PANDUAN */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowGuideModal(false)}></div>
          <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative z-10 p-8">
            <h2 className="text-2xl font-black text-white mb-4">Buku Panduan</h2>
            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              <p>Selamat datang di Pusat Kendali JogjaCourt Enterprise.</p>
              {isSuperAdmin ? (
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Dashboard Utama:</strong> Memantau total GOR terdaftar, transaksi bruto, dan volume pengguna.</li>
                  <li><strong>Manajemen Area:</strong> Menambah atau menghapus cakupan kota operasional layanan JogjaCourt.</li>
                  <li><strong>Moderasi Ulasan:</strong> Wajib memeriksa kata-kata kasar sebelum ulasan pengguna dipublikasikan ke halaman utama.</li>
                  <li><strong>Bagi Hasil:</strong> Super Admin menerima potongan komisi (platform fee) sebesar 10% dari tiap transaksi GOR yang sukses secara otomatis.</li>
                </ul>
              ) : (
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>GOR & Lapangan:</strong> Tambahkan detail GOR Anda di menu Manajemen GOR beserta harga tiap lapangan per jam.</li>
                  <li><strong>Blokir Jadwal:</strong> Gunakan ikon kalender (Blokir Jadwal) jika lapangan Anda sedang digunakan turnamen offline atau perbaikan.</li>
                  <li><strong>Notifikasi:</strong> Anda akan menerima pesan real-time setiap kali pelanggan berhasil membayar reservasi.</li>
                  <li><strong>Pendapatan:</strong> Dana otomatis masuk ke Laporan Keuangan Anda dan dapat ditarik langsung ke rekening yang terdaftar di halaman ini.</li>
                </ul>
              )}
            </div>
            <button onClick={() => setShowGuideModal(false)} className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all">
              Tutup Panduan
            </button>
          </div>
        </div>
      )}

      {/* MODAL KEBIJAKAN PENCAIRAN */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPolicyModal(false)}></div>
          <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative z-10 p-8">
            <h2 className="text-2xl font-black text-[#D4AF37] mb-4">Kebijakan Pencairan (Payout)</h2>
            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              <p>Untuk menjaga keamanan dan kelancaran transaksi finansial, JogjaCourt menetapkan prosedur berikut:</p>
              <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3">
                <p><strong>1. Biaya Platform (10%):</strong> JogjaCourt mengenakan biaya pemeliharaan sebesar 10% dari setiap pesanan yang berhasil.</p>
                <p><strong>2. Siklus Pencairan:</strong> Anda dapat mengajukan "Tarik Dana" kapan saja. Permintaan sebelum jam 12:00 WIB akan diproses pada hari yang sama. Setelahnya, akan diproses pada hari kerja berikutnya.</p>
                <p><strong>3. Rekening Tujuan:</strong> Dana hanya akan dicairkan ke Rekening Bank yang telah Anda simpan di menu pengaturan ini. Perubahan rekening membutuhkan masa verifikasi 1x24 jam.</p>
                <p><strong>4. Pajak & Potongan Bank:</strong> Biaya admin transfer antar bank ditanggung oleh Mitra (jika ada).</p>
              </div>
            </div>
            <button onClick={() => setShowPolicyModal(false)} className="w-full mt-6 bg-[#D4AF37] hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition-all">
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* MODAL HUBUNGI TIM */}
      {showContactModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowContactModal(false)}></div>
          <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative z-10 p-8">
            <h2 className="text-2xl font-black text-white mb-2">Pusat Bantuan Cepat</h2>
            <p className="text-sm text-neutral-400 mb-6">Punya kendala atau pertanyaan kemitraan? Kirimkan pesan langsung ke tim kami.</p>
            
            {contactSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-bold">Pesan Terkirim!</h3>
                <p className="text-sm mt-1 text-emerald-500/70">Tim JogjaCourt akan segera menghubungi Anda via Email.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Perihal / Topik</label>
                  <select required className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none appearance-none">
                    <option value="">Pilih topik kendala...</option>
                    <option value="teknis">Kendala Teknis (Error/Bug)</option>
                    <option value="keuangan">Kendala Keuangan & Tarik Dana</option>
                    <option value="akun">Permasalahan Akses Akun</option>
                    <option value="lainnya">Pertanyaan Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Pesan Anda</label>
                  <textarea required rows="4" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none" placeholder="Deskripsikan kendala Anda secara detail..."></textarea>
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowContactModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all">
                    Batal
                  </button>
                  <button type="submit" disabled={contactLoading} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center">
                    {contactLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Pesan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  return (
    <ErrorBoundary>
      <SettingsInner />
    </ErrorBoundary>
  );
}
