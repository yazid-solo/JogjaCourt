import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCircle2, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Bell className="w-6 h-6 text-[#D4AF37]" />
            </div>
            Pusat Notifikasi
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">Pembaruan sistem, transaksi, dan aktivitas penting terkait akun Anda.</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-6 py-3 bg-[#111] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl transition-all text-sm font-bold shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:scale-105"
          >
            <CheckCircle2 className="w-4 h-4" />
            Tandai Semua Dibaca
          </button>
        )}
      </motion.div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-[80px] pointer-events-none"></div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
             <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
                <Bell className="absolute inset-0 m-auto w-6 h-6 text-[#D4AF37] animate-pulse" />
              </div>
              <p className="text-neutral-400 font-bold tracking-widest uppercase text-[11px]">Memuat Notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 text-center flex flex-col items-center relative z-10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-5 border-2 border-dashed border-white/10">
              <Bell className="w-10 h-10 text-neutral-600" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Bebas Tugas</h3>
            <p className="text-neutral-500 max-w-xs text-sm">Saat ada pembaruan penting, semuanya akan muncul di sini secara otomatis.</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-white/5 relative z-10">
            <AnimatePresence>
              {notifications.map((notif) => (
                <motion.div 
                  variants={itemVariants}
                  layout
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-5 sm:p-6 transition-all flex gap-4 sm:gap-5 cursor-pointer relative overflow-hidden group ${
                    !notif.is_read ? 'bg-[#D4AF37]/[0.03] hover:bg-[#D4AF37]/[0.06]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Unread Glow Indicator */}
                  {!notif.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#D4AF37] to-yellow-600 shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
                  )}

                  <div className={`hidden sm:flex w-12 h-12 rounded-2xl flex-shrink-0 items-center justify-center border shadow-inner ${
                    !notif.is_read ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#111] border-white/5'
                  }`}>
                    {getIcon(notif.type, notif.is_read)}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1">
                      <h3 className={`text-base tracking-tight ${!notif.is_read ? 'text-white font-black' : 'text-neutral-300 font-bold'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest whitespace-nowrap bg-black/40 px-2 py-1 rounded-md border border-white/5">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: id })}
                      </span>
                    </div>
                    
                    <p className={`text-sm mt-1 leading-relaxed ${!notif.is_read ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {notif.message}
                    </p>

                    {!notif.is_read && (
                      <div className="mt-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#D4AF37] hover:text-black transition-colors bg-[#D4AF37]/10 hover:bg-[#D4AF37] px-3 py-1.5 rounded-lg border border-[#D4AF37]/20 uppercase tracking-widest"
                        >
                          <Check className="w-3.5 h-3.5" /> Tandai Dibaca
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
