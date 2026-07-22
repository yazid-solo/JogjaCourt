import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Bell, Check, CheckCircle2, AlertTriangle, ShieldCheck, UserCircle, Loader2, SlidersHorizontal, Filter, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '@/components/blocks/NotificationBell';

export default function Notifications() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'transaksi', 'peringatan'
  
  const filterRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(n => {
    // 1. Status Filter
    if (statusFilter === 'unread' && n.is_read) return false;
    if (statusFilter === 'read' && !n.is_read) return false;
    
    // 2. Type Filter (Inferred from title)
    if (typeFilter !== 'all') {
      const titleLower = (n.title || '').toLowerCase();
      const isTransaksi = titleLower.includes('bayar') || titleLower.includes('booking') || titleLower.includes('diverifikasi') || titleLower.includes('diterima');
      const isPeringatan = titleLower.includes('tolak') || titleLower.includes('batal') || titleLower.includes('peringatan') || titleLower.includes('gagal');
      
      if (typeFilter === 'transaksi' && !isTransaksi) return false;
      if (typeFilter === 'peringatan' && !isPeringatan) return false;
    }
    
    return true;
  });

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const getIcon = (title, isRead) => {
    const titleLower = (title || '').toLowerCase();
    const colorClass = isRead ? "text-neutral-500" : "text-[#D4AF37]";
    
    if (titleLower.includes('berhasil') || titleLower.includes('diverifikasi') || titleLower.includes('diterima')) {
      return <CheckCircle2 className={`w-5 h-5 ${colorClass}`} />;
    }
    if (titleLower.includes('tolak') || titleLower.includes('batal') || titleLower.includes('gagal')) {
      return <AlertTriangle className={`w-5 h-5 ${colorClass}`} />;
    }
    if (titleLower.includes('login') || titleLower.includes('password') || titleLower.includes('keamanan')) {
      return <ShieldCheck className={`w-5 h-5 ${colorClass}`} />;
    }
    return <Bell className={`w-5 h-5 ${colorClass}`} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
        <p className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm animate-pulse">Memuat Notifikasi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4AF37] selection:text-black pb-20 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      <header className="h-16 sm:h-20 bg-black/50 backdrop-blur-xl border-b border-white/5 flex items-center px-4 sm:px-6 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img src="/Logo.svg" alt="Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-[#D4AF37] blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
            </div>
            <span className="font-black text-xl hidden sm:block tracking-tight">JogjaCourt</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/explore" className="text-sm font-bold text-neutral-400 hover:text-[#D4AF37] transition-colors hidden sm:block">
              Eksplor GOR
            </Link>
            <Link to="/my-bookings" className="text-sm font-bold text-neutral-400 hover:text-[#D4AF37] transition-colors hidden sm:block">
              Jadwal Saya
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/profile" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-900 border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
                  )}
                </div>
              </Link>
              <NotificationBell />
              <button onClick={logout} className="text-xs sm:text-sm font-bold bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-full hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-all">
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
              </div>
              Pusat Notifikasi
            </h1>
            <p className="text-neutral-400 mt-2 text-base sm:text-lg">Semua pembaruan terkait pesanan dan akun Anda.</p>
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#111] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl transition-all text-sm font-bold shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:scale-105"
            >
              <Check className="w-4 h-4" />
              Tandai Semua Dibaca
            </button>
          )}
        </motion.div>

        {notifications.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-6 relative" ref={filterRef}>
            <div className="text-neutral-400 text-sm font-medium">
              Menampilkan <strong className="text-white">{filteredNotifications.length}</strong> dari <strong className="text-white">{notifications.length}</strong>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all border z-20 relative ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                    : 'bg-[#111] border-white/10 text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filter
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#D4AF37] text-black text-[10px] font-black ml-1 shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute right-0 top-full mt-3 w-[300px] sm:w-[320px] bg-[#111]/95 backdrop-blur-3xl border border-[#D4AF37]/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                      <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                        <Filter className="w-4 h-4 text-[#D4AF37]" />
                        Filter Notifikasi
                      </h3>
                      {activeFiltersCount > 0 && (
                        <button 
                          onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
                          className="text-xs font-bold text-[#D4AF37] hover:text-white transition-colors flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Reset
                        </button>
                      )}
                    </div>
                    
                    {/* Body */}
                    <div className="p-5 space-y-6">
                      {/* Status */}
                      <div>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Berdasarkan Status</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'all', label: 'Semua Status' },
                            { id: 'unread', label: 'Belum Dibaca' },
                            { id: 'read', label: 'Sudah Dibaca' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setStatusFilter(opt.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                statusFilter === opt.id 
                                  ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                                  : 'bg-black/50 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Kategori */}
                      <div>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Berdasarkan Kategori</p>
                        <div className="flex flex-col gap-2">
                          {[
                            { id: 'all', label: 'Semua Kategori', icon: <Bell className="w-3.5 h-3.5" /> },
                            { id: 'transaksi', label: 'Transaksi & Pemesanan', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                            { id: 'peringatan', label: 'Peringatan & Batal', icon: <AlertTriangle className="w-3.5 h-3.5" /> }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setTypeFilter(opt.id)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border w-full text-left ${
                                typeFilter === opt.id 
                                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                                  : 'bg-black/50 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20'
                              }`}
                            >
                              <div className={`p-1.5 rounded-md ${typeFilter === opt.id ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-neutral-500'}`}>
                                {opt.icon}
                              </div>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {filteredNotifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-[#111]/50 backdrop-blur-md border border-white/5 rounded-3xl"
          >
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Bell className="w-10 h-10 text-neutral-600 opacity-50" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Tidak ada notifikasi</h2>
            <p className="text-neutral-400 max-w-md mx-auto">
              {notifications.length > 0 ? "Tidak ada notifikasi yang sesuai dengan filter Anda." : "Saat ini Anda tidak memiliki notifikasi baru. Pembaruan akan muncul di sini."}
            </p>
            {(statusFilter !== 'all' || typeFilter !== 'all') && (
              <button 
                onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
                className="mt-6 px-6 py-2.5 bg-[#D4AF37] text-black font-bold rounded-full hover:bg-white transition-colors shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                Hapus Filter
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notif) => (
                <motion.div 
                  variants={itemVariants}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`bg-[#111]/80 backdrop-blur-xl border ${notif.is_read ? 'border-white/5 opacity-70' : 'border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]'} rounded-2xl p-5 sm:p-6 transition-all hover:border-[#D4AF37]/50 cursor-pointer group relative overflow-hidden`}
                >
                  {!notif.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
                  )}
                  <div className="flex gap-4 sm:gap-5">
                    <div className="shrink-0 mt-1">
                      <div className={`p-2 rounded-xl transition-colors ${notif.is_read ? 'bg-white/5 group-hover:bg-white/10' : 'bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20'}`}>
                        {getIcon(notif.title, notif.is_read)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h3 className={`font-bold text-lg ${notif.is_read ? 'text-neutral-300' : 'text-white'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-xs text-neutral-500 font-medium whitespace-nowrap bg-black/50 px-3 py-1 rounded-full border border-white/5">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: id })}
                        </span>
                      </div>
                      <p className={`text-sm ${notif.is_read ? 'text-neutral-500' : 'text-neutral-300'}`}>
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
