import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, UserCircle, Loader2, Smile, Paperclip, Bot, Sparkles, Calendar, CreditCard, HelpCircle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '@/context/AuthContext';
import { useChatNotif } from '@/context/ChatNotifContext';
import api, { API_URL } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const notificationSound = typeof window !== 'undefined' ? new Audio('/ting.mp3') : null;
if (notificationSound) {
  notificationSound.preload = 'auto';
}

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
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  
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

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) && !event.target.closest('#emoji-trigger-btn')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            return [...prev, { ...newMsg, is_bot: newMsg.message_type === 'bot_text' }];
          });
          api.post(`/chat/read/${adminId}`);
          
          try {
            if (notificationSound) {
              notificationSound.currentTime = 0;
              const playPromise = notificationSound.play();
              if (playPromise !== undefined) {
                playPromise.catch(e => console.log('Audio autoplay blocked', e));
              }
            }
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
    const content = newMessage.trim();
    const payload = {
      receiver_id: adminId,
      content: content
    };

    // Optimistically add message
    const tempId = `temp-${Date.now()}`;
    const tempUserMsg = {
      id: tempId,
      sender_id: user.id,
      receiver_id: adminId,
      content: content,
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    const isFirstManualMessage = messages.filter(m => m.sender_id === user.id && !m.is_bot).length === 0;
    
    setMessages(prev => [...prev, tempUserMsg]);
    setNewMessage('');

    try {
      await api.post('/chat/send', payload);
      
      if (isFirstManualMessage) {
        setTimeout(() => {
          api.post('/chat/bot-send', { 
            content: "Sistem telah meneruskan obrolan ini ke Tim Support kami. Pesan Anda berikutnya akan dibalas langsung oleh staf manusia. Mohon tunggu sebentar ya!" 
          }).catch(err => console.error("Error triggering bot handoff:", err));
        }, 1000);
      }
    } catch (err) {
      console.error("Gagal mengirim via API:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = async (text) => {
    if (!adminId) return;
    try {
      const tempId = `temp-${Date.now()}`;
      const tempUserMsg = {
        id: tempId,
        sender_id: user.id,
        receiver_id: adminId,
        content: text,
        created_at: new Date().toISOString(),
        is_read: false
      };
      setMessages(prev => [...prev, tempUserMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      api.post('/chat/send', {
        receiver_id: adminId,
        content: text,
        message_type: 'text'
      }).catch(err => console.error("Error sending quick reply:", err));

      setTimeout(() => {
        let botResponse = "";
        if (text.includes("Jadwal")) {
          botResponse = "Anda dapat melihat ketersediaan jadwal terkini melalui menu 'Eksplor GOR'. Semua data jadwal 100% realtime.";
        } else if (text.includes("Pembayaran")) {
          botResponse = "Kami mendukung berbagai metode seperti Transfer Bank, e-Wallet, maupun QRIS. Batas waktu pembayaran adalah 15 menit.";
        } else if (text.includes("Bantuan")) {
          botResponse = "Mohon ketikkan keluhan atau kendala Anda secara detail. Admin JogjaCourt akan segera mengambil alih obrolan ini.";
        } else {
          botResponse = "Terima kasih atas pesannya! Admin kami sedang *online* dan akan merespons Anda dalam beberapa menit ke depan.";
        }

        api.post('/chat/bot-send', { content: botResponse })
          .catch(err => console.error("Error triggering bot response:", err));
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !adminId) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const payload = {
        receiver_id: adminId,
        message_type: 'file',
        attachment_url: res.data.attachment_url,
        content: file.name
      };
      
      await api.post('/chat/send', payload);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Gagal mengunggah file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };
  if (!user || user.role !== 'customer') return null;

  return (
    <>
      {/* Tombol Buka Chat */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); clearUnread(); }}
          className="flex fixed z-40 bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-[60px] md:h-[60px] bg-[#D4AF37] text-black rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] hover:scale-110 items-center justify-center transition-all duration-300"
        >
          <MessageSquare className="w-6 h-6 md:w-7 md:h-7" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-red-500 rounded-full border-2 border-black flex items-center justify-center text-[10px] md:text-xs font-black text-white animate-bounce shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Toast Notifikasi Pesan Masuk (saat chat tutup) */}
      {!isOpen && latestMsg && (
        <div
          onClick={() => { setIsOpen(true); clearUnread(); }}
          className="fixed bottom-20 right-4 md:bottom-24 md:right-6 z-50 max-w-[260px] bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-2xl p-3 shadow-2xl cursor-pointer hover:border-[#D4AF37]/60 transition-all animate-in slide-in-from-right-5 fade-in duration-300"
        >
          <p className="text-[11px] font-bold text-[#D4AF37] mb-0.5">💬 {latestMsg.sender_name}</p>
          <p className="text-xs text-white/80 line-clamp-2">{latestMsg.content}</p>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full h-[100dvh] sm:w-80 sm:h-[500px] sm:max-h-[80vh] md:w-96 bg-[#111]/90 backdrop-blur-xl sm:border border-white/10 sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex-col z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden">
          {/* Header */}
          <div className="p-4 pt-6 sm:pt-4 border-b border-white/10 bg-black/40 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(false)}>
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
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="relative mb-5">
                  <div className="absolute inset-0 bg-[#D4AF37] blur-2xl opacity-20 rounded-full animate-pulse"></div>
                  <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-yellow-600 rounded-full flex items-center justify-center relative shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                    <Bot className="w-8 h-8 text-black" />
                    <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1 border border-[#111]">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 p-4 rounded-3xl w-full shadow-xl">
                  <h3 className="text-lg font-black text-white mb-1">Halo, {user?.name?.split(' ')[0]}! 👋</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                    Saya adalah Asisten Virtual JogjaCourt. Ada yang bisa saya atau Admin bantu hari ini?
                  </p>
                  <div className="flex justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-1`}>
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1">
                        {msg.is_bot ? (
                          <div className="w-4 h-4 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                            <Bot className="w-2.5 h-2.5" />
                          </div>
                        ) : null}
                        <span className="text-[10px] font-bold text-neutral-500">
                          {msg.is_bot ? 'Asisten JogjaCourt' : adminName}
                        </span>
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isMe 
                        ? 'bg-[#D4AF37] text-black rounded-tr-sm shadow-[0_4px_15px_rgba(212,175,55,0.2)]' 
                        : msg.is_bot 
                          ? 'bg-[#1a1a1a] text-white rounded-tl-sm border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                          : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                    }`}>
                      {/* File Attachment */}
                      {msg.attachment_url && (
                        <div className="mb-1.5">
                          {msg.attachment_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img src={`${API_URL.replace('/api/v1', '')}${msg.attachment_url}`} alt="Attachment" className="max-w-[150px] sm:max-w-[200px] rounded-xl object-contain max-h-48" />
                          ) : (
                            <a href={`${API_URL.replace('/api/v1', '')}${msg.attachment_url}`} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2 rounded-xl border ${isMe ? 'bg-black/10 border-black/10' : 'bg-white/5 border-white/10'}`}>
                              <Paperclip className="w-4 h-4" />
                              <span className="text-xs font-bold underline truncate max-w-[120px]">{msg.content || 'Download File'}</span>
                            </a>
                          )}
                        </div>
                      )}
                      {/* Text Message */}
                      {msg.content && msg.message_type !== 'file' && (
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
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

          {/* Quick Reply Chips */}
          <div className="px-3 py-2.5 bg-gradient-to-t from-black/60 to-transparent z-10 overflow-x-auto scrollbar-hide flex gap-2 w-full">
              {[
                { text: 'Tanya Jadwal', icon: <Calendar className="w-3 h-3" /> },
                { text: 'Cara Pembayaran', icon: <CreditCard className="w-3 h-3" /> },
                { text: 'Bicara dgn Admin', icon: <UserCircle className="w-3 h-3" /> },
                { text: 'Butuh Bantuan', icon: <HelpCircle className="w-3 h-3" /> }
              ].map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(qr.text)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-full text-[10px] font-bold text-[#D4AF37] whitespace-nowrap hover:bg-[#D4AF37] hover:text-black transition-all shadow-[0_0_10px_rgba(212,175,55,0.1)]"
                >
                  {qr.icon}
                  {qr.text}
                </button>
              ))}
            </div>

          {/* Input Area */}
          <div className="p-3 bg-black/40 border-t border-white/10 relative">
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-50 animate-in slide-in-from-bottom-2 shadow-2xl rounded-2xl overflow-hidden border border-white/10">
                <EmojiPicker 
                  theme="dark" 
                  onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)} 
                  width={280}
                  height={350}
                />
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2 relative items-center">
              <button id="emoji-trigger-btn" type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 transition-colors rounded-full hover:bg-white/5 ${showEmojiPicker ? 'text-[#D4AF37]' : 'text-neutral-400'}`}>
                <Smile className="w-5 h-5" />
              </button>
              
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="p-2 text-neutral-400 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-white/5 disabled:opacity-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </button>

              <input 
                type="text" 
                value={newMessage}
                onChange={handleTyping}
                placeholder="Tulis pesan..." 
                className="flex-1 bg-black border border-white/10 rounded-full px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-colors min-w-0"
              />
              <button 
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className={`p-2 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
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
