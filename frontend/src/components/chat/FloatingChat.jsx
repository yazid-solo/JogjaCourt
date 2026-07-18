import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, UserCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChatNotif } from '@/context/ChatNotifContext';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function FloatingChat({ forceOpen = false }) {
  const { user } = useAuth();
  const { unreadCount, latestMsg, clearUnread } = useChatNotif();
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const adminName = "Admin Pusat";
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  // Fetch Super Admin ID
  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    const fetchSuperAdmin = async () => {
      try {
        const res = await api.get('/users/super-admin');
        setAdminId(res.data.id);
      } catch (error) {
        console.error("Gagal mendapatkan kontak admin pusat", error);
      }
    };
    fetchSuperAdmin();
  }, [user]);

  // Saat chat dibuka, hapus counter unread
  useEffect(() => {
    if (isOpen) clearUnread();
  }, [isOpen, clearUnread]);

  // Handle Supabase Realtime Connection & History
  useEffect(() => {
    if (!user || !isOpen || !adminId) return;

    // Fetch initial history
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/chat/history/${adminId}`);
        setMessages(res.data.messages || []);
        // Tandai sebagai sudah dibaca
        api.post(`/chat/read/${adminId}`);
      } catch (error) {
        console.error("Gagal memuat riwayat chat", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    const messageChannel = supabase.channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        const newMsg = payload.new;
        if (newMsg.sender_id === adminId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          api.post(`/chat/read/${adminId}`);
          
          try {
            const audio = new Audio('/ting.mp3');
            audio.play().catch(() => {});
          } catch(e) {}
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`
      }, (payload) => {
        const updatedMsg = payload.new;
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      .subscribe();

    const typingChannel = supabase.channel('typing_indicators')
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.receiver_id === user.id && payload.payload.sender_id === adminId) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user, isOpen, adminId]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (adminId) {
      supabase.channel('typing_indicators').send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_id: user.id, receiver_id: adminId }
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !adminId || isSending) return;

    setIsSending(true);
    const payload = {
      receiver_id: adminId,
      content: newMessage.trim()
    };

    const optimisticMsg = {
      id: Date.now().toString(),
      sender_id: user.id,
      receiver_id: adminId,
      content: newMessage.trim(),
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    // Kirim via REST POST
    try {
      await api.post('/chat/send', payload);
    } catch (err) {
      console.error("Gagal mengirim via API:", err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  if (!user || user.role !== 'customer') return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); clearUnread(); }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#D4AF37] text-black rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center hover:scale-110 transition-transform z-[60]"
        >
          <MessageSquare className="w-6 h-6" />
          {/* Badge Notifikasi Merah */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-[#0a0a0a] animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Toast Notifikasi Pesan Masuk (saat chat tutup) */}
      {!isOpen && latestMsg && (
        <div
          onClick={() => { setIsOpen(true); clearUnread(); }}
          className="fixed bottom-24 right-6 z-50 max-w-[260px] bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-2xl p-3 shadow-2xl cursor-pointer hover:border-[#D4AF37]/60 transition-all animate-in slide-in-from-right-5 fade-in duration-300"
        >
          <p className="text-[11px] font-bold text-[#D4AF37] mb-0.5">💬 {latestMsg.sender_name}</p>
          <p className="text-xs text-white/80 line-clamp-2">{latestMsg.content}</p>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(false)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                <UserCircle className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{adminName}</h3>
                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#111] to-black/80">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
                <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Belum ada obrolan.</p>
                <p className="text-xs mt-1">Kirim pesan pertama Anda sekarang!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-1`}>
                    {!isMe && (
                      <span className="text-[10px] font-bold text-neutral-500 mb-1 ml-1">
                        {adminName}
                      </span>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isMe 
                        ? 'bg-[#D4AF37] text-black rounded-tr-sm shadow-[0_4px_15px_rgba(212,175,55,0.2)]' 
                        : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                    }`}>
                      <p className="text-[13px] leading-relaxed">{msg.content}</p>
                      <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-neutral-500'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start px-5 mt-2">
                <div className="bg-[#1A1A1A] border border-[#333] text-neutral-400 py-2 px-4 rounded-2xl rounded-tl-sm text-sm italic flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-black/40 border-t border-white/10">
            <form onSubmit={handleSendMessage} className="flex gap-2 relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={handleTyping}
                placeholder="Tulis pesan ke Pusat..." 
                className="flex-1 bg-black border border-white/10 rounded-full px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
              <button 
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className={`p-3 rounded-full flex items-center justify-center transition-all ${
                  isSending || !newMessage.trim() 
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                    : 'bg-[#D4AF37] text-black hover:bg-yellow-400 hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                }`}>
                <Send className="w-4 h-4 ml-[-2px]" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
