import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserCircle, Mail, Shield, ChevronRight, ArrowLeft, Ticket, 
  Settings, HelpCircle, FileText, LogOut, Camera, Trophy, 
  Activity, Star, CreditCard, Bell, Loader2, X, Trash2
} from 'lucide-react';
import api from '@/lib/api';
import NotificationBell from '@/components/blocks/NotificationBell';

const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_bookings: 0, completed: 0, total_spent: 0 });
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Edit Form States
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Password Form States
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/bookings');
        const myBookings = res.data;
        const completed = myBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
        
        const totalSpent = completed.reduce((acc, curr) => acc + parseFloat(curr.total_price), 0);
        
        setStats({
          total_bookings: myBookings.length,
          completed: completed.length,
          total_spent: totalSpent
        });
        
        if (user) {
          setEditForm({ name: user.name || '', phone: user.phone || '' });
        }
      } catch (error) {
        console.error("Gagal memuat riwayat", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await api.post('/auth/me/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      window.location.reload(); // Reload to refresh user context
    } catch (error) {
      console.error(error);
      alert('Gagal mengunggah foto profil.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm('Yakin ingin menghapus foto profil?')) return;
    
    setUploadingImage(true);
    try {
      await api.delete('/auth/me/profile-image');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus foto profil.');
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await api.put('/auth/me', editForm);
      alert('Profil berhasil diperbarui!');
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.detail || 'Gagal memperbarui profil');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', passwordForm);
      alert('Kata sandi berhasil diubah!');
      setIsPasswordModalOpen(false);
      setPasswordForm({ current_password: '', new_password: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Gagal mengubah kata sandi');
    } finally {
      setSavingPassword(false);
    }
  };

  const formatLoyalty = (amount) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'Jt';
    } else if (amount > 0) {
      return formatIDR(amount).replace('Rp', '').trim();
    }
    return '0';
  };

  const membershipLevel = stats.completed >= 5 ? 'Member Gold' : stats.completed >= 1 ? 'Member Silver' : 'Member Bronze';
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#D4AF37] selection:text-black pb-20 md:pb-0">
      
      {/* App-like Header */}
      <header className="h-16 bg-[#111]/80 backdrop-blur-lg border-b border-white/5 flex items-center px-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <span className="font-bold text-lg absolute left-1/2 -translate-x-1/2">Profil Saya</span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        {/* Profile Card Section */}
        <section className="p-6">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="relative group">
                <div 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-black border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Ubah Foto Profil"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                  ) : user?.profile_image ? (
                    <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
                  ) : (
                    <UserCircle className="w-12 h-12 md:w-16 md:h-16 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                  )}
                </div>
                <div 
                  className="absolute bottom-0 right-0 w-7 h-7 bg-[#D4AF37] rounded-full border-2 border-[#1a1a1a] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Ubah Foto Profil"
                >
                  <Camera className="w-3.5 h-3.5 text-black" />
                </div>
                {user?.profile_image && (
                  <div 
                    className="absolute top-0 right-0 w-7 h-7 bg-red-500 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer z-10"
                    onClick={handleDeleteImage}
                    title="Hapus Foto Profil"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-black text-white mb-1">{user?.name || 'Pelanggan'}</h1>
                <p className="text-sm text-neutral-400 mb-2">{user?.email}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                  membershipLevel === 'Member Gold' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20' :
                  membershipLevel === 'Member Silver' ? 'bg-gray-400/10 border-gray-400/20' :
                  'bg-orange-700/10 border-orange-700/20'
                }`}>
                  <Star className={`w-3.5 h-3.5 ${
                    membershipLevel === 'Member Gold' ? 'text-[#D4AF37] fill-[#D4AF37]' :
                    membershipLevel === 'Member Silver' ? 'text-gray-400 fill-gray-400' :
                    'text-orange-700 fill-orange-700'
                  }`} />
                  <span className={`text-xs font-bold ${
                    membershipLevel === 'Member Gold' ? 'text-[#D4AF37]' :
                    membershipLevel === 'Member Silver' ? 'text-gray-400' :
                    'text-orange-700'
                  }`}>{membershipLevel}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111] rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/5 hover:bg-[#1a1a1a] transition-colors cursor-default">
              <Ticket className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-2xl font-black text-white">{stats.total_bookings}</span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mt-1">Total Tiket</span>
            </div>
            <div className="bg-[#111] rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/5 hover:bg-[#1a1a1a] transition-colors cursor-default">
              <Trophy className="w-6 h-6 text-emerald-500 mb-2" />
              <span className="text-2xl font-black text-white">{stats.completed}</span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mt-1">Laga Sukses</span>
            </div>
            <div className="bg-[#111] rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/5 hover:bg-[#1a1a1a] transition-colors cursor-default">
              <Activity className="w-6 h-6 text-purple-500 mb-2" />
              <span className="text-xl md:text-2xl font-black text-white">{formatLoyalty(stats.total_spent)}</span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mt-1">Loyalitas</span>
            </div>
          </div>
        </section>

        {/* Action Menus */}
        <section className="px-6 space-y-6 mb-12">
          {/* Akun */}
          <div>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Akun</h3>
            <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="w-full flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">Pengaturan Profil</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Ubah nama & nomor telepon</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600 shrink-0" />
              </button>
              
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">Keamanan & Sandi</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Ubah kata sandi Anda</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600 shrink-0" />
              </button>
              
              <button className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left opacity-50 cursor-not-allowed">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">Metode Pembayaran</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Segera hadir</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600 shrink-0" />
              </button>
            </div>
          </div>

          {/* Lainnya */}
          <div>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Bantuan & Informasi</h3>
            <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
              <button 
                onClick={() => setIsHelpModalOpen(true)}
                className="w-full flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">Pusat Bantuan</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Hubungi CS atau baca FAQ</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600 shrink-0" />
              </button>
              <button 
                onClick={() => setIsTermsModalOpen(true)}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">Syarat & Ketentuan</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Kebijakan privasi JogjaCourt</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600 shrink-0" />
              </button>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full bg-[#1a0f0f] border border-red-500/20 text-red-500 font-bold p-4 rounded-3xl flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors mt-6"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar dari Akun</span>
          </button>
          <div className="text-center pt-6">
            <p className="text-xs text-neutral-600">JogjaCourt v1.0.0</p>
          </div>
        </section>
      </main>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] max-w-sm w-full rounded-3xl border border-white/10 relative p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Pengaturan Profil</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Nomor Telepon</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  placeholder="08123456789"
                  className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={savingEdit}
                className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-xl hover:bg-yellow-500 transition-colors mt-4 flex items-center justify-center disabled:opacity-50"
              >
                {savingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] max-w-sm w-full rounded-3xl border border-white/10 relative p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Ubah Kata Sandi</h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Kata Sandi Lama</label>
                <input 
                  type="password" 
                  required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Kata Sandi Baru</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={savingPassword}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-colors mt-4 flex items-center justify-center disabled:opacity-50"
              >
                {savingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ubah Kata Sandi'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pusat Bantuan Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] max-w-lg w-full rounded-3xl border border-white/10 relative p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-[#D4AF37]" />
                Pusat Bantuan
              </h2>
              <button onClick={() => setIsHelpModalOpen(false)} className="text-neutral-500 hover:text-white bg-white/5 rounded-full p-2 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-2">FAQ (Pertanyaan Umum)</h3>
                
                <div className="space-y-4 mt-4">
                  <div className="bg-black border border-white/5 rounded-xl p-4">
                    <p className="font-bold text-white mb-1 text-sm">Bagaimana cara membatalkan pesanan?</p>
                    <p className="text-sm text-neutral-400 leading-relaxed">Pesanan yang sudah dibayar lunas (Confirmed) tidak dapat dibatalkan melalui aplikasi. Silakan hubungi admin GOR secara langsung untuk negosiasi pembatalan.</p>
                  </div>
                  
                  <div className="bg-black border border-white/5 rounded-xl p-4">
                    <p className="font-bold text-white mb-1 text-sm">Apakah ada biaya tambahan?</p>
                    <p className="text-sm text-neutral-400 leading-relaxed">Pemesanan lapangan melalui JogjaCourt adalah gratis. Anda hanya membayar harga lapangan sesuai yang ditetapkan oleh pihak GOR.</p>
                  </div>
                  
                  <div className="bg-black border border-white/5 rounded-xl p-4">
                    <p className="font-bold text-white mb-1 text-sm">Bagaimana cara menjadi Member Gold?</p>
                    <p className="text-sm text-neutral-400 leading-relaxed">Tingkatkan terus jumlah laga sukses Anda. Selesaikan minimal 5 pesanan untuk otomatis naik level menjadi Member Gold dan dapatkan *badge* spesial di profil Anda!</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-xl p-5 border border-green-500/20 text-center">
                <h4 className="font-bold text-white mb-2">Butuh Bantuan Langsung?</h4>
                <p className="text-sm text-neutral-400 mb-4">Tim Customer Service kami siap membantu Anda setiap hari (08:00 - 22:00).</p>
                <a href="https://wa.me/6283835782010" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-6 rounded-full transition-colors text-sm">
                  Hubungi via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Syarat & Ketentuan Modal */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] max-w-lg w-full rounded-3xl border border-white/10 relative p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#111] pt-2 pb-4 z-10 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#D4AF37]" />
                Syarat & Ketentuan
              </h2>
              <button onClick={() => setIsTermsModalOpen(false)} className="text-neutral-500 hover:text-white bg-white/5 rounded-full p-2 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-5 text-sm text-neutral-300 leading-relaxed">
              <div>
                <h3 className="font-bold text-white mb-2 text-base">1. Pendahuluan</h3>
                <p>Selamat datang di JogjaCourt. Dengan menggunakan aplikasi kami, Anda menyetujui seluruh syarat dan ketentuan yang berlaku. Harap baca dengan saksama sebelum melakukan transaksi pemesanan lapangan.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-white mb-2 text-base">2. Kebijakan Pemesanan</h3>
                <p>Pemesanan lapangan baru dianggap sah apabila pelanggan telah melakukan pembayaran dan status pesanan berubah menjadi "Lunas". Pesanan yang belum dibayar dalam batas waktu yang ditentukan akan dibatalkan secara otomatis.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-white mb-2 text-base">3. Kebijakan Pembatalan & Pengembalian Dana</h3>
                <p>Uang yang telah dibayarkan (Lunas) tidak dapat dikembalikan melalui platform JogjaCourt. Setiap perselisihan atau permintaan *refund* wajib diselesaikan secara kekeluargaan antara pelanggan dan pihak Mitra GOR bersangkutan.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-white mb-2 text-base">4. Privasi & Data Pribadi</h3>
                <p>JogjaCourt berkomitmen menjaga kerahasiaan data pribadi Anda. Data seperti email, nomor telepon, dan riwayat pesanan hanya digunakan untuk keperluan internal transaksi dan peningkatan layanan kami, serta tidak akan dijual ke pihak ketiga.</p>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2 text-base">5. Perubahan Syarat & Ketentuan</h3>
                <p>JogjaCourt berhak mengubah syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Pengguna diharapkan untuk rutin mengecek halaman ini secara berkala.</p>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-white/10 text-center">
              <button 
                onClick={() => setIsTermsModalOpen(false)}
                className="bg-white text-black font-bold py-2.5 px-8 rounded-full hover:bg-neutral-200 transition-colors"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

