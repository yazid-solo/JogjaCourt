import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

const ChatNotifContext = createContext();

export function useChatNotif() {
  return useContext(ChatNotifContext);
}

export function ChatNotifProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMsg, setLatestMsg] = useState(null);
  const [contacts, setContacts] = useState([]);
  const previousUnreadCount = useRef(0);
  const pollInterval = useRef(null);
  const lastNotifiedTime = useRef(0);
  const isFirstFetch = useRef(true);
  const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BBY03YcvnV2vPEOCOCD6cILSgEEcNKk1f4W16fC9YIlhWLnZnGWuyn0qyJegBYqSMg8jPMV6MS2BTP_e71S6yDo';

  // Function untuk merubah Base64 URL-safe VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const playNotifSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Ignore
    }
  }, []);

  const fetchContactsAndUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/chat/contacts');
      const contactList = res.data.contacts || [];
      setContacts(contactList);
      
      let totalUnread = 0;
      let newestUnreadMsg = null;
      let newestTime = 0;

      contactList.forEach(c => {
        totalUnread += c.unreadCount;
        if (c.unreadCount > 0) {
          const msgTime = new Date(c.time).getTime();
          if (msgTime > newestTime) {
            newestTime = msgTime;
            newestUnreadMsg = {
              sender_name: c.name,
              content: c.lastMessage
            };
          }
        }
      });

      setUnreadCount(totalUnread);

      // Logika Notifikasi Kelas Kakap:
      // Hanya muncul jika ada pesan yang benar-benar BARU (timestamp lebih besar)
      if (isFirstFetch.current) {
        // Pada saat awal load, jangan munculkan toast untuk pesan lama, cukup set baseline waktunya.
        lastNotifiedTime.current = newestTime;
        isFirstFetch.current = false;
      } else if (totalUnread > 0 && newestTime > lastNotifiedTime.current && newestUnreadMsg) {
        setLatestMsg(newestUnreadMsg);
        playNotifSound();
        lastNotifiedTime.current = newestTime;
      }
      
      previousUnreadCount.current = totalUnread;

    } catch (err) {
      console.error("Gagal polling pesan:", err);
    }
  }, [user, playNotifSound]);

  // Subscribe ke Push Notif
  const subscribeToPush = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        // Kirim ke backend
        await api.post('/notifications/subscribe', subscription);
      } catch (err) {
        console.error("Gagal subscribe push notification:", err);
      }
    }
  }, [VAPID_PUBLIC_KEY]);

  useEffect(() => {
    if (!user) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') subscribeToPush();
      });
    } else if (Notification.permission === 'granted') {
      subscribeToPush();
    }

    // Awal load
    fetchContactsAndUnread();
    
    // Polling tiap 15 detik untuk mengurangi beban serverless (Vercel)
    pollInterval.current = setInterval(fetchContactsAndUnread, 15000);

    return () => {
      clearInterval(pollInterval.current);
    };
  }, [user, fetchContactsAndUnread, subscribeToPush]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
    setLatestMsg(null);
    previousUnreadCount.current = 0;
  }, []);

  return (
    <ChatNotifContext.Provider value={{ unreadCount, latestMsg, clearUnread, contacts, fetchContactsAndUnread }}>
      {children}
    </ChatNotifContext.Provider>
  );
}
