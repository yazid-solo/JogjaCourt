import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await api.put(`/notifications/${notification.id}/read`);
      fetchNotifications();
    }
    setIsOpen(false);
    
    // Extract path from link if available, otherwise just go to notifications page
    if (notification.link) {
      navigate(notification.link);
    } else {
      if (user?.role === 'customer') {
        navigate('/my-bookings');
      } else {
        navigate('/dashboard/notifications');
      }
    }
  };

  const latestNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-neutral-400 hover:text-white relative p-2 focus:outline-none transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute -right-12 sm:right-0 mt-2 w-[85vw] max-w-[320px] sm:w-96 sm:max-w-none bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/40">
            <h3 className="font-bold text-white">Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full font-bold">
                {unreadCount} Baru
              </span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {latestNotifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>Belum ada notifikasi.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {latestNotifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 ${
                      !notif.is_read ? 'bg-[#D4AF37]/5' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-1 ${!notif.is_read ? 'text-white font-semibold' : 'text-neutral-300'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-neutral-400 line-clamp-2 mb-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: id })}
                      </span>
                    </div>
                    {!notif.is_read && (
                      <button 
                        onClick={(e) => handleMarkAsRead(e, notif.id)}
                        className="self-center p-1.5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                        title="Tandai sudah dibaca"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/5 bg-black/40 text-center">
            <Link 
              to={user?.role === 'customer' ? '/my-bookings' : '/dashboard/notifications'} 
              onClick={() => setIsOpen(false)}
              className="text-sm font-bold text-[#D4AF37] hover:text-white transition-colors"
            >
              Lihat Semua Notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
