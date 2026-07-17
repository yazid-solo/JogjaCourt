import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { WS_URL } from '@/lib/api';

const ChatNotifContext = createContext();

export function useChatNotif() {
  return useContext(ChatNotifContext);
}

export function ChatNotifProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMsg, setLatestMsg] = useState(null); // { sender_name, content }
  const ws = useRef(null);
  const reconnectTimer = useRef(null);

  // Nada notifikasi ringan via Web Audio API (tidak butuh file .mp3)
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
      // Tidak semua browser mendukung AudioContext saat tidak ada interaksi pengguna
    }
  }, []);

  const connectWs = useCallback(() => {
    if (!user) return;
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(`${WS_URL}/chat/ws/${user.id}`);

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Hanya proses pesan teks biasa (bukan sinyal WebRTC / read_receipt)
        if (msg.message_type && ['offer','answer','ice_candidate','call_end','read_receipt'].includes(msg.message_type)) return;
        if (msg.sender_id && msg.sender_id !== user.id && msg.content) {
          setUnreadCount(prev => prev + 1);
          setLatestMsg({ sender_name: msg.sender_name || 'Pesan Baru', content: msg.content });
          playNotifSound();
          // Browser Notification jika tab tidak aktif
          if (document.hidden && Notification.permission === 'granted') {
            new Notification(`💬 ${msg.sender_name || 'Pesan Baru'}`, {
              body: msg.content,
              icon: '/favicon.ico',
            });
          }
        }
      } catch (e) { /* abaikan */ }
    };

    ws.current.onclose = () => {
      reconnectTimer.current = setTimeout(connectWs, 4000);
    };

    ws.current.onerror = () => {
      ws.current?.close();
    };
  }, [user, playNotifSound]);

  useEffect(() => {
    if (!user) return;
    // Minta izin Browser Notification
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    connectWs();
    return () => {
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [user, connectWs]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
    setLatestMsg(null);
  }, []);

  return (
    <ChatNotifContext.Provider value={{ unreadCount, latestMsg, clearUnread }}>
      {children}
    </ChatNotifContext.Provider>
  );
}
