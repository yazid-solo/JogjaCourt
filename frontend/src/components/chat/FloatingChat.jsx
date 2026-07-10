import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, UserCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api, { WS_URL } from '@/lib/api';

export default function FloatingChat({ adminId, adminName = "Admin GOR", forceOpen = false }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen, adminId]);

  // Handle WebSocket Connection & History
  useEffect(() => {
    if (!user || !isOpen || !adminId) return;

    // Fetch initial history
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/chat/history/${adminId}`);
        setMessages(res.data.messages || []);
      } catch (error) {
        console.error("Gagal memuat riwayat chat", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // Connect WebSocket
    const connectWs = () => {
      ws.current = new WebSocket(`${WS_URL}/chat/ws/${user.id}`);
      
      ws.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          // Hanya tangkap pesan jika berasal dari admin yang sedang kita chat
          if (msg.sender_id === adminId) {
            setMessages(prev => [...prev, msg]);
          }
        } catch (error) {
          console.error("Format pesan tidak valid");
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket terputus. Mencoba terhubung kembali...");
        setTimeout(connectWs, 3000);
      };
    };

    connectWs();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user, isOpen, adminId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws.current || !adminId) return;

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

    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
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
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#D4AF37] text-black rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center hover:scale-110 transition-transform z-50 group"
        >
          <MessageSquare className="w-6 h-6 group-hover:hidden" />
          <MessageSquare className="w-6 h-6 hidden group-hover:block animate-pulse" />
          {/* Notification Dot indicator could go here if unread msgs exist */}
        </button>
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
          </div>

          {/* Input Area */}
          <div className="p-4 bg-black/40 border-t border-white/10">
            <form onSubmit={handleSendMessage} className="flex gap-2 relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..." 
                className="flex-1 bg-black border border-white/10 rounded-full px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-black disabled:opacity-50 disabled:bg-[#D4AF37] hover:bg-yellow-500 transition-all flex-shrink-0 shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              >
                <Send className="w-4 h-4 ml-[-2px]" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
