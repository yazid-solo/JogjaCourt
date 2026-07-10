import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#D4AF37]" />
            Pusat Notifikasi
          </h1>
          <p className="text-neutral-400 mt-1">Pembaruan terbaru tentang akun dan aktivitas Anda.</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-400">Memuat notifikasi...</div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Belum ada notifikasi</h3>
            <p className="text-neutral-400">Saat ada pembaruan penting, semuanya akan muncul di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-6 transition-colors flex gap-4 sm:gap-6 cursor-pointer hover:bg-white/5 ${
                  !notif.is_read ? 'bg-[#D4AF37]/5' : ''
                }`}
              >
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-neutral-800 flex-shrink-0 items-center justify-center border border-white/5">
                  <Bell className={`w-5 h-5 ${!notif.is_read ? 'text-[#D4AF37]' : 'text-neutral-400'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <h3 className={`text-base sm:text-lg ${!notif.is_read ? 'text-white font-bold' : 'text-neutral-300 font-medium'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: id })}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-4 ${!notif.is_read ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    {notif.message}
                  </p>

                  {!notif.is_read && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:text-white transition-colors bg-[#D4AF37]/10 px-3 py-1.5 rounded-full"
                    >
                      <Check className="w-3.5 h-3.5" /> Tandai dibaca
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
