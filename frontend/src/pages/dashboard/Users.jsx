import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, ShieldAlert, ShieldCheck, Search, MoreVertical, Edit3, Trash2, Ban, CheckCircle, Shield, Users as UsersIcon, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const [isUpdating, setIsUpdating] = useState(null); 
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { user } = useAuth();

  const fetchUsers = async (currentPage = page) => {
    try {
      const res = await api.get(`/users?page=${currentPage}&size=50`);
      setUsers(res.data.data || []);
      setTotalPages(res.data.total_pages || 1);
    } catch (error) {
      console.error("Gagal memuat pengguna", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchUsers(page);
    } else {
      setLoading(false);
    }
  }, [user, page]);

  const handleToggleStatus = async (userId, currentStatus) => {
    setIsUpdating(userId);
    try {
      await api.put(`/users/${userId}/status`, { is_active: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal mengubah status");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (newRole === 'super_admin') {
      alert("Tidak dapat mengatur pengguna menjadi Super Admin melalui antarmuka ini.");
      return;
    }
    
    setIsUpdating(userId);
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal mengubah peran");
    } finally {
      setIsUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
          <Shield className="absolute inset-0 m-auto w-8 h-8 text-[#D4AF37] animate-pulse" />
        </div>
      </div>
    );
  }

  if (user?.role !== 'super_admin') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full text-center py-20 bg-gradient-to-b from-red-900/20 to-black rounded-[3rem] border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/10 blur-[100px] pointer-events-none"></div>
        <ShieldAlert className="w-24 h-24 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h2 className="text-3xl font-black text-white mb-3">Akses Terlarang</h2>
        <p className="text-neutral-400 max-w-md text-sm md:text-base">Hanya entitas <strong className="text-red-400">Super Admin (Root)</strong> yang memiliki otorisasi untuk mengakses pusat kendali keamanan sistem ini.</p>
      </motion.div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 md:pb-12 px-2 sm:px-0">
      
      {/* Cinematic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#111] border border-white/5 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20">
                <UsersIcon className="w-8 h-8 text-[#D4AF37]" />
              </div>
              Pusat Pengguna
            </h1>
            <p className="text-neutral-400 mt-3 text-sm sm:text-base max-w-lg">
              Kontrol penuh atas seluruh identitas, level akses, dan status penangguhan (banning) dalam ekosistem JogjaCourt.
            </p>
          </div>
          
          {/* Quick Stats Dashboard */}
          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-black/60 border border-white/5 rounded-2xl p-4 sm:px-6 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Total Entitas</p>
              <p className="text-2xl sm:text-3xl font-black text-white">{users.length}</p>
            </div>
            <div className="flex-1 md:flex-none bg-black/60 border border-white/5 rounded-2xl p-4 sm:px-6 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/10 transition-colors"></div>
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Total Mitra</p>
              <p className="text-2xl sm:text-3xl font-black text-[#D4AF37]">{users.filter(u => u.role === 'admin').length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filter / Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-2 flex flex-col lg:flex-row gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] sticky top-20 z-40 backdrop-blur-xl"
      >
        <div className="relative w-full flex-1">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pindai nama atau email pengguna..." 
            className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-transparent focus:border-[#D4AF37]/50 rounded-2xl py-4 pl-14 pr-4 text-white font-medium focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/10 transition-all placeholder:text-neutral-600"
          />
        </div>
        
        {/* Dynamic Role Segmented Control */}
        <div className="flex bg-black p-1.5 rounded-2xl border border-white/5 w-full lg:w-auto shrink-0">
          {[
            { id: 'all', label: 'Semua Akun' },
            { id: 'customer', label: 'Pelanggan' },
            { id: 'admin', label: 'Mitra GOR' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`relative flex-1 lg:flex-none px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all z-10 ${
                roleFilter === tab.id ? 'text-black' : 'text-neutral-500 hover:text-white'
              }`}
            >
              {roleFilter === tab.id && (
                <motion.div 
                  layoutId="activeRoleFilter"
                  className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-yellow-500 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.4)] -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Modern Card-Based Grid for Mobile & Desktop (Replaces old table) */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredUsers.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="col-span-full flex flex-col items-center justify-center p-12 bg-white/[0.02] border-2 border-dashed border-white/10 rounded-3xl"
            >
              <ShieldAlert className="w-16 h-16 text-neutral-600 mb-4" />
              <p className="text-white font-black text-xl mb-1">Entitas Tidak Ditemukan</p>
              <p className="text-neutral-500 text-sm">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
            </motion.div>
          ) : (
            filteredUsers.map((u, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={u.id} 
                className={`group relative bg-[#0a0a0a] border rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-6 ${
                  u.role === 'super_admin' ? 'border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.05)]' :
                  u.role === 'admin' ? 'border-[#D4AF37]/20 hover:border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.02)]' :
                  'border-white/5 hover:border-white/20'
                }`}
              >
                {/* Background Glows */}
                {u.role === 'super_admin' && <div className="absolute inset-0 bg-purple-500/5 rounded-3xl pointer-events-none"></div>}
                {u.role === 'admin' && <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-3xl pointer-events-none"></div>}

                {/* Bagian Kiri: Profile Info */}
                <div className="w-full xl:w-[40%] flex items-start gap-4 relative z-10 border-b xl:border-b-0 xl:border-r border-white/5 pb-5 xl:pb-0 xl:pr-6">
                  <div className="relative">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-black overflow-hidden border-2 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-lg ${
                      u.role === 'super_admin' ? 'bg-purple-900 border-purple-500/50 text-purple-200' :
                      u.role === 'admin' ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]' :
                      'bg-neutral-800 border-neutral-600 text-white'
                    }`}>
                      {u.profile_image ? (
                        <img src={u.profile_image} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {/* Status Indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-[#0a0a0a] ${
                      u.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-black text-white text-base sm:text-lg truncate tracking-tight">{u.name}</h3>
                    <p className="text-xs text-neutral-400 truncate mb-1">{u.email}</p>
                    {u.phone && <p className="text-[10px] text-neutral-500 font-mono bg-white/5 inline-block px-2 py-0.5 rounded-md border border-white/5">{u.phone}</p>}
                  </div>
                </div>

                {/* Bagian Tengah: Role Control */}
                <div className="w-full xl:flex-1 relative z-10">
                  <div className="bg-black/40 rounded-xl p-3 sm:p-4 border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Otoritas</span>
                    {u.role === 'super_admin' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 font-black text-xs border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <ShieldCheck className="w-3.5 h-3.5" /> ROOT
                      </span>
                    ) : (
                      <div className="relative">
                        <select 
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          disabled={isUpdating === u.id}
                          className={`appearance-none font-black text-xs px-3 py-1.5 pr-8 rounded-lg outline-none cursor-pointer border transition-all ${
                            u.role === 'admin' 
                              ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]' 
                              : 'bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <option value="customer" className="bg-black text-white">Customer</option>
                          <option value="admin" className="bg-black text-[#D4AF37]">Mitra GOR</option>
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {isUpdating === u.id ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <MoreVertical className="w-3 h-3 text-current opacity-50" />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bagian Kanan: Status Action */}
                <div className="w-full xl:w-[30%] flex items-center justify-between xl:justify-end xl:gap-6 relative z-10 pt-5 xl:pt-0 border-t xl:border-t-0 xl:border-l border-white/5 xl:pl-6">
                  <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                    u.is_active ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {u.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline xl:hidden 2xl:inline">{u.is_active ? 'Sistem Aktif' : 'Terblokir'}</span>
                  </span>
                  
                  {u.role !== 'super_admin' ? (
                    <button 
                      onClick={() => handleToggleStatus(u.id, u.is_active)}
                      disabled={isUpdating === u.id}
                      className={`text-xs font-black px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
                        u.is_active 
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20'
                      }`}
                    >
                      {isUpdating === u.id ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> PROSES...</>
                      ) : (
                        <>{u.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />} {u.is_active ? 'BLOKIR' : 'AKTIFKAN'}</>
                      )}
                    </button>
                  ) : (
                    <span className="text-[10px] text-neutral-600 font-black uppercase bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">Protected</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Sebelumnya
          </button>
          
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-[#D4AF37] font-black">{page}</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">{totalPages}</span>
          </div>
          
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-6 py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl font-bold text-sm text-[#D4AF37] hover:bg-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
