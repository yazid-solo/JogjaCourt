import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, ShieldAlert, ShieldCheck, Search, MoreVertical, Edit3, Trash2, Ban, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isUpdating, setIsUpdating] = useState(null); // stores user ID being updated
  
  const { user } = useAuth();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Gagal memuat pengguna", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

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
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-[#111]/50 rounded-3xl border border-white/5">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-neutral-400 max-w-md">Hanya Super Admin yang memiliki hak istimewa (privilege) untuk mengakses halaman manajemen inti ini.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#D4AF37]" />
            Manajemen Pengguna
          </h1>
          <p className="text-neutral-400 mt-2">
            Pusat kendali akun pemain, mitra GOR, dan hak akses aplikasi.
          </p>
        </div>
        
        {/* Stats Summary */}
        <div className="flex gap-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl px-5 py-3 text-center">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Total Pengguna</p>
            <p className="text-xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-2xl px-5 py-3 text-center">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Mitra GOR</p>
            <p className="text-xl font-bold text-[#D4AF37]">{users.filter(u => u.role === 'admin').length}</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#111] border border-white/5 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan email atau nama..." 
            className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border-separate border-spacing-y-3">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-neutral-500 px-4">
              <th className="px-6 font-bold pb-2">Profil Pengguna</th>
              <th className="px-6 font-bold pb-2 text-center">Role / Otoritas</th>
              <th className="px-6 font-bold pb-2 text-center">Status Akun</th>
              <th className="px-6 font-bold pb-2 text-right">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12">
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-[#111]/50 border-2 border-dashed border-white/5 rounded-3xl">
                    <ShieldAlert className="w-12 h-12 text-neutral-600 mb-3" />
                    <p className="text-white font-bold text-lg">Tidak Ada Data</p>
                    <p className="text-neutral-500 text-sm">Pengguna tidak ditemukan.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="bg-[#111] hover:bg-[#151515] transition-colors group shadow-sm">
                  {/* User Profile Column */}
                  <td className="p-4 rounded-l-2xl border-y border-l border-white/5 group-hover:border-white/10">
                    <div className="flex items-center gap-4 pl-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-800 to-black overflow-hidden border border-white/10 flex-shrink-0 relative group-hover:border-[#D4AF37]/50 transition-colors">
                        {u.profile_picture ? (
                          <img src={u.profile_picture} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-neutral-400 text-lg">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {/* Active Dot */}
                        {u.is_active && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#111] rounded-full"></div>}
                      </div>
                      <div>
                        <p className="font-bold text-white text-[15px]">{u.name}</p>
                        <p className="text-xs text-neutral-400">{u.email}</p>
                        {u.phone && <p className="text-[10px] text-neutral-500 mt-0.5">{u.phone}</p>}
                      </div>
                    </div>
                  </td>
                  
                  {/* Role Column */}
                  <td className="p-4 border-y border-white/5 group-hover:border-white/10 text-center align-middle">
                    {u.role === 'super_admin' ? (
                      <span className="inline-flex items-center justify-center w-32 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 font-bold text-xs border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                        SUPER ADMIN
                      </span>
                    ) : (
                      <div className="inline-block relative">
                        <select 
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          disabled={isUpdating === u.id}
                          className={`w-32 py-1.5 px-3 rounded-lg font-bold text-xs appearance-none text-center cursor-pointer border transition-all ${
                            u.role === 'admin' 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' 
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                          }`}
                        >
                          <option value="customer" className="bg-black text-white">Customer</option>
                          <option value="admin" className="bg-black text-white">Mitra GOR</option>
                        </select>
                        {isUpdating === u.id && <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-white" />}
                      </div>
                    )}
                  </td>
                  
                  {/* Status Column */}
                  <td className="p-4 border-y border-white/5 group-hover:border-white/10 text-center align-middle">
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                        u.is_active 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                          : 'text-red-400 bg-red-500/10 border-red-500/20'
                      }`}>
                        {u.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        {u.is_active ? 'Aktif' : 'Banned'}
                      </span>
                    </div>
                  </td>
                  
                  {/* Action Column */}
                  <td className="p-4 rounded-r-2xl border-y border-r border-white/5 group-hover:border-white/10 text-right align-middle pr-6">
                    {u.role !== 'super_admin' ? (
                      <button 
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        disabled={isUpdating === u.id}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ml-auto ${
                          u.is_active 
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20'
                        }`}
                      >
                        {u.is_active ? 'Suspend Akun' : 'Pulihkan Akun'}
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-500 italic block">Dilindungi</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
