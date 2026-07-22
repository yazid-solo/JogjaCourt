import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Bell, Check, CheckCircle2, AlertTriangle, ShieldCheck, UserCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '@/components/blocks/NotificationBell';

export default function Notifications() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

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

  const getIcon = (type, isRead) => {
    const colorClass = isRead ? "text-neutral-500" : "text-[#D4AF37]";
    switch(type) {
      case 'success': return <CheckCircle2 className={`w-5 h-5 ${colorClass}`} />;
      case 'warning': return <AlertTriangle className={`w-5 h-5 ${colorClass}`} />;
      case 'security': return <ShieldCheck className={`w-5 h-5 ${colorClass}`} />;
      default: return <Bell className={`w-5 h-5 ${colorClass}`} />;
    }
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

        {/* Filter Tabs */}
        {notifications.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === 'all' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'}`}
            >
              Semua Notifikasi
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${filter === 'unread' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'}`}
            >
              Belum Dibaca
              {unreadCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${filter === 'unread' ? 'bg-black/20' : 'bg-[#D4AF37]/20 text-[#D4AF37]'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === 'read' ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'}`}
            >
              Sudah Dibaca
            </button>
          </motion.div>
        )}

        {filteredNotifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-[#111]/50 backdrop-blur-md border border-white/5 rounded-3xl"
          >
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-neutral-600 opacity-50" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Belum ada notifikasi</h2>
            <p className="text-neutral-400 max-w-md mx-auto">
              Saat ini Anda tidak memiliki notifikasi baru. Pembaruan akan muncul di sini.
            </p>
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
                  exit={{ opacity: 0, x: 20 }}
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`bg-[#111]/80 backdrop-blur-xl border ${notif.is_read ? 'border-white/5 opacity-70' : 'border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]'} rounded-2xl p-5 sm:p-6 transition-all hover:border-[#D4AF37]/50 cursor-pointer group`}
                >
                  <div className="flex gap-4 sm:gap-5">
                    <div className="shrink-0 mt-1">
                      <div className={`p-2 rounded-xl ${notif.is_read ? 'bg-white/5' : 'bg-[#D4AF37]/10'}`}>
                        {getIcon(notif.type, notif.is_read)}
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
