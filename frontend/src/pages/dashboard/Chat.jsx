import React, { useState, useEffect, useRef } from 'react';
import { Send, UserCircle, MessageSquare, Loader2, Paperclip, Smile, Phone, Video, MoreVertical, Check, CheckCheck, Search, X, PhoneOff, MicOff, Trash2, Ban, ArrowLeft } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '@/context/AuthContext';
import api, { WS_URL, API_URL } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function Chat() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const activeContactRef = useRef(null);
  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Interactive States
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
  
  // WebRTC & Call States
  const [callState, setCallState] = useState({ active: false, type: null, status: '', incoming: false, caller: null }); 
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const fileInputRef = useRef(null);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const menuRef = useRef(null);
  const lastSendTime = useRef(0);
  const typingTimeoutRef = useRef(null);
  
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState({});

  const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      const res = await api.get('/chat/contacts');
      setContacts(res.data.contacts || []);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Fetch history when active contact changes
  const fetchHistory = async (contactId) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/chat/history/${contactId}`);
      setMessages(res.data.messages || []);
      api.post(`/chat/read/${contactId}`);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    fetchContacts();

    const connectWs = () => {
      ws.current = new WebSocket(`${WS_URL}/chat/ws/${user.id}`);
      
      ws.current.onopen = () => console.log("WebSocket connected");

      ws.current.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          // Handle WebRTC Signaling
          if (["offer", "answer", "ice_candidate", "call_end"].includes(msg.message_type)) {
            handleWebRTCSignal(msg);
            return;
          }
          
          // Regular Message
          if (msg.message_type === 'read_receipt') {
            // Update messages to be read
            setMessages(prev => prev.map(m => m.receiver_id === msg.sender_id ? { ...m, is_read: true } : m));
            // Update contacts list lastMessage if needed
            setContacts(prev => prev.map(c => c.id === msg.sender_id ? { ...c, is_read: true } : c));
            return;
          }

          // Regular Message via WebSocket fallback
          const currentActive = activeContactRef.current;
          
          if (currentActive && currentActive.id === msg.sender_id) {
            setMessages((prevMsgs) => {
              if (prevMsgs.some(m => m.id === msg.id)) return prevMsgs;
              return [...prevMsgs, msg];
            });
            api.post(`/chat/read/${msg.sender_id}`);
          }

          setContacts((prevContacts) => {
            const updatedContacts = [...prevContacts];
            const contactIdx = updatedContacts.findIndex(c => c.id === msg.sender_id);
            
            if (contactIdx >= 0) {
              updatedContacts[contactIdx].lastMessage = msg.message_type === 'file' ? '[Lampiran]' : msg.content;
              updatedContacts[contactIdx].time = msg.created_at;
              
              if (!currentActive || currentActive.id !== msg.sender_id) {
                updatedContacts[contactIdx].unreadCount = (updatedContacts[contactIdx].unreadCount || 0) + 1;
              } else {
                updatedContacts[contactIdx].is_read = true;
              }

              const [moved] = updatedContacts.splice(contactIdx, 1);
              updatedContacts.unshift(moved);
            } else {
              fetchContacts();
            }
            return updatedContacts;
          });
          
        } catch (error) {
          console.error("Error parsing WS message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting...");
        setTimeout(connectWs, 3000);
      };
    };

    connectWs();

    return () => {
      if (ws.current) ws.current.close();
      endCallLocally();
    };
  }, [user]);

  useEffect(() => {
    if (activeContact) {
      fetchHistory(activeContact.id);
      setShowEmojiPicker(false);
      api.post(`/chat/read/${activeContact.id}`);
    }
  }, [activeContact]);

  // Supabase Realtime Subscription & Typing Indicator
  useEffect(() => {
    if (!user) return;

    // Listen to new messages
    const messageChannel = supabase.channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        const newMsg = payload.new;
        
        const currentActive = activeContactRef.current;
        const isActive = currentActive && currentActive.id === newMsg.sender_id;
        
        if (isActive) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          api.post(`/chat/read/${newMsg.sender_id}`);
        }

        try {
          const audio = new Audio('/ting.mp3');
          audio.play().catch(e => console.log('Audio autoplay blocked', e));
        } catch(e) {}

        setContacts(prev => {
          const updated = [...prev];
          const contactIdx = updated.findIndex(c => c.id === newMsg.sender_id);
          
          if (contactIdx >= 0) {
            updated[contactIdx].lastMessage = newMsg.message_type === 'file' ? '[Lampiran]' : newMsg.content;
            updated[contactIdx].time = newMsg.created_at;
            if (!isActive) {
              updated[contactIdx].unreadCount = (updated[contactIdx].unreadCount || 0) + 1;
            } else {
              updated[contactIdx].is_read = true;
            }
            const [moved] = updated.splice(contactIdx, 1);
            updated.unshift(moved);
          } else {
            fetchContacts();
          }
          return updated;
        });
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

    // Typing Indicators
    const typingChannel = supabase.channel('typing_indicators')
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.receiver_id === user.id) {
          setTypingUsers(prev => ({
            ...prev,
            [payload.payload.sender_id]: true
          }));
          
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [payload.payload.sender_id]: false
            }));
          }, 2000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        // Cek jika yang diklik bukan tombol trigger (ikon smile)
        const triggerBtn = document.getElementById('emoji-trigger-btn');
        if (triggerBtn && triggerBtn.contains(event.target)) return;
        
        setShowEmojiPicker(false);
      }
      
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        const triggerBtn = document.getElementById('menu-trigger-btn');
        if (triggerBtn && triggerBtn.contains(event.target)) return;
        
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingHistory]);

  // Handle Video Element Attachments
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream, callState.active]);

  /* ================== WEBRTC LOGIC ================== */
  
  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection(rtcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.current && callState.caller) {
        ws.current.send(JSON.stringify({
          receiver_id: callState.caller,
          message_type: 'ice_candidate',
          content: JSON.stringify(event.candidate)
        }));
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnection.current = pc;
    return pc;
  };

  const startCall = async (type) => {
    if (!activeContact) return;
    setCallState({ active: true, type, status: 'MENGHUBUNGKAN...', incoming: false, caller: activeContact.id });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setLocalStream(stream);
      
      const pc = setupPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      ws.current.send(JSON.stringify({
        receiver_id: activeContact.id,
        message_type: 'offer',
        content: JSON.stringify({ sdp: offer, type })
      }));
      
      setCallState(prev => ({ ...prev, status: 'BERDERING...' }));
    } catch (err) {
      console.error("Gagal memulai panggilan", err);
      alert("Tidak dapat mengakses kamera/mikrofon");
      endCallLocally();
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: callState.type === 'video', audio: true });
      setLocalStream(stream);
      
      const pc = setupPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(callState.offerData).sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      ws.current.send(JSON.stringify({
        receiver_id: callState.caller,
        message_type: 'answer',
        content: JSON.stringify(answer)
      }));
      
      setCallState(prev => ({ ...prev, status: 'TERHUBUNG', incoming: false }));
    } catch (err) {
      console.error("Gagal menerima panggilan", err);
      endCallLocally();
    }
  };

  const endCallLocally = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setRemoteStream(null);
    setCallState({ active: false, type: null, status: '', incoming: false, caller: null });
  };

  const endCall = () => {
    if (ws.current && callState.caller) {
      ws.current.send(JSON.stringify({
        receiver_id: callState.caller,
        message_type: 'call_end'
      }));
    }
    endCallLocally();
  };

  const handleWebRTCSignal = async (msg) => {
    const data = msg.content ? JSON.parse(msg.content) : null;
    
    if (msg.message_type === 'offer') {
      const callerContact = contacts.find(c => c.id === msg.sender_id);
      if (!callerContact) return; // Prevent calls from unknown users for now
      
      setCallState({
        active: true,
        type: data.type,
        status: 'PANGGILAN MASUK',
        incoming: true,
        caller: msg.sender_id,
        callerName: callerContact.name,
        offerData: msg.content
      });
    } 
    else if (msg.message_type === 'answer') {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data));
        setCallState(prev => ({ ...prev, status: 'TERHUBUNG' }));
      }
    } 
    else if (msg.message_type === 'ice_candidate') {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data));
      }
    } 
    else if (msg.message_type === 'call_end') {
      endCallLocally();
    }
  };

  /* ================================================== */
  
  const showConfirm = (title, message, onConfirm) => {
    setDialogConfig({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };
  
  const showAlert = (title, message) => {
    setDialogConfig({ isOpen: true, type: 'alert', title, message, onConfirm: null });
  };
  
  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  // Real Menu Actions
  const handleClearChat = async () => {
    if (!activeContact) return;
    showConfirm(
      "Bersihkan Chat", 
      "Apakah Anda yakin ingin menghapus seluruh riwayat obrolan ini?", 
      async () => {
        try {
          await api.delete(`/chat/history/${activeContact.id}`);
          setMessages([]);
          setShowMenu(false);
          setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, lastMessage: '', time: '' } : c));
          closeDialog();
        } catch (error) {
          console.error("Gagal membersihkan chat:", error);
          showAlert("Error", "Terjadi kesalahan saat menghapus pesan.");
        }
      }
    );
  };

  const handleBlockUser = async () => {
    if (!activeContact) return;
    showConfirm(
      "Blokir Pengguna", 
      `Apakah Anda yakin ingin memblokir ${activeContact.name}? Mereka tidak akan bisa mengirim pesan kepada Anda lagi.`, 
      async () => {
        try {
          await api.post(`/chat/block/${activeContact.id}`);
          setShowMenu(false);
          setContacts(prev => prev.filter(c => c.id !== activeContact.id));
          setActiveContact(null);
          closeDialog();
          setTimeout(() => showAlert("Berhasil", `${activeContact.name} berhasil diblokir.`), 300);
        } catch (error) {
          console.error("Gagal memblokir:", error);
          showAlert("Error", "Terjadi kesalahan saat memblokir pengguna.");
        }
      }
    );
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (activeContact) {
      supabase.channel('typing_indicators').send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_id: user.id, receiver_id: activeContact.id }
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact || isSending) return;

    setIsSending(true);
    const payload = {
      receiver_id: activeContact.id,
      message_type: 'text',
      content: newMessage.trim()
    };
    
    sendMessageUIUpdate(payload);
  };

  const sendMessageUIUpdate = (payload) => {
    const optimisticMsg = {
      id: Date.now().toString(),
      sender_id: user.id,
      receiver_id: activeContact.id,
      content: payload.content || '',
      attachment_url: payload.attachment_url,
      message_type: payload.message_type || 'text',
      created_at: new Date().toISOString(),
      sender_name: user.name,
      sender_role: user.role
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setShowEmojiPicker(false);
    lastSendTime.current = Date.now();

    setContacts(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(c => c.id === activeContact.id);
      if (idx >= 0) {
        updated[idx].lastMessage = payload.message_type === 'file' ? '[Lampiran]' : payload.content;
        updated[idx].time = optimisticMsg.created_at;
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
      }
      return updated;
    });

    // Send to backend via REST POST (Mendukung Push Notification & Vercel)
    api.post('/chat/send', payload).catch(err => {
      console.error("Gagal mengirim pesan via API:", err);
    }).finally(() => {
      setIsSending(false);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeContact) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const payload = {
        receiver_id: activeContact.id,
        message_type: 'file',
        attachment_url: res.data.attachment_url,
        content: file.name
      };
      sendMessageUIUpdate(payload);
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
    const date = new Date(isoString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] max-w-6xl mx-auto flex flex-col md:flex-row gap-3 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>

      {/* CALL OVERLAY MODAL */}
      {callState.active && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#D4AF37]/20 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4">
            
            {/* Video Grid */}
            <div className="w-full flex justify-center gap-4 mb-8">
              {/* Remote Video */}
              <div className={`relative bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 ${callState.status === 'TERHUBUNG' ? 'w-2/3 aspect-video' : 'w-32 h-32 rounded-full border-[#D4AF37] shadow-[#D4AF37]/20'}`}>
                {callState.type === 'video' && remoteStream ? (
                   <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserCircle className="w-20 h-20 text-neutral-600" />
                  </div>
                )}
                {callState.status !== 'TERHUBUNG' && (
                  <>
                    <div className="absolute inset-0 rounded-full border border-[#D4AF37] animate-ping opacity-50"></div>
                    <div className="absolute -inset-4 rounded-full border border-[#D4AF37] animate-ping opacity-30" style={{ animationDelay: '0.2s' }}></div>
                  </>
                )}
              </div>
              
              {/* Local Video Picture-in-Picture */}
              {callState.type === 'video' && callState.status === 'TERHUBUNG' && (
                <div className="absolute bottom-28 right-10 w-48 aspect-video bg-neutral-900 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-50">
                   <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                </div>
              )}
            </div>

            <h2 className="text-3xl font-black text-white mb-2">{callState.callerName || activeContact?.name}</h2>
            <p className="text-[#D4AF37] font-bold tracking-widest text-sm animate-pulse">{callState.status}</p>
            <p className="text-neutral-500 mt-2 text-sm">{callState.type === 'video' ? 'Panggilan Video' : 'Panggilan Suara'}</p>
          </div>

          <div className="absolute bottom-16 inset-x-0 flex justify-center gap-6">
            {callState.incoming && callState.status === 'PANGGILAN MASUK' ? (
              <>
                <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-110 transition-all">
                  <Phone className="w-7 h-7" />
                </button>
                <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:scale-110 transition-all">
                  <PhoneOff className="w-7 h-7" />
                </button>
              </>
            ) : (
              <>
                <button className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all">
                  <MicOff className="w-7 h-7" />
                </button>
                <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:scale-110 transition-all">
                  <PhoneOff className="w-7 h-7" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`w-full md:w-1/3 md:min-w-[280px] bg-[#111] border border-white/10 rounded-3xl ${activeContact ? 'hidden md:flex' : 'flex'} flex-col overflow-hidden shadow-xl`}>
        <div className="p-5 border-b border-white/10 bg-black/40 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Pesan</h2>
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              {user?.role === 'super_admin' 
                ? 'Pusat bantuan & komunikasi Mitra GOR' 
                : 'Chat langsung dari Pelanggan & Super Admin'}
            </p>
          </div>
        </div>
        
        <div className="p-3 bg-black/20">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari percakapan..." 
              className="w-full bg-[#1a1a1a] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all" 
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll">
          {loadingContacts ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-sm font-medium">Belum ada obrolan masuk.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredContacts.map((contact) => (
                <div 
                  key={contact.id}
                  onClick={() => {
                    setActiveContact(contact);
                    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unreadCount: 0 } : c));
                  }}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex gap-4 items-center group ${
                    activeContact?.id === contact.id ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'hover:bg-white/5 text-white'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeContact?.id === contact.id ? 'bg-black/20 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                      <UserCircle className="w-7 h-7" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#111] rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-2 truncate">
                        <h3 className={`font-bold text-sm truncate ${activeContact?.id === contact.id ? 'text-black' : 'text-white'}`}>{contact.name}</h3>
                        {contact.role && (
                          <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full ${
                            activeContact?.id === contact.id 
                              ? (contact.role === 'super_admin' ? 'bg-black/20 text-black' : 'bg-black/10 text-black/70')
                              : (contact.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-neutral-800 text-neutral-400')
                          }`}>
                            {contact.role === 'super_admin' ? 'Super Admin' : (contact.role === 'admin' ? 'Mitra GOR' : 'Pelanggan')}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] whitespace-nowrap ml-2 ${activeContact?.id === contact.id ? 'text-black/60' : (contact.unreadCount > 0 ? 'text-[#10b981] font-bold' : 'text-neutral-500')}`}>
                        {contact.time ? formatTime(contact.time) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate font-medium pr-2 ${activeContact?.id === contact.id ? 'text-black/70' : (contact.unreadCount > 0 ? 'text-white' : 'text-neutral-400')}`}>
                        {contact.lastMessageSenderId === user.id ? <span className="font-bold opacity-75">Anda: </span> : ''}
                        {contact.lastMessage || '...'}
                      </p>
                      {contact.unreadCount > 0 && activeContact?.id !== contact.id && (
                        <div className="w-4 h-4 rounded-full bg-[#10b981] flex items-center justify-center text-[9px] font-bold text-white shadow-sm flex-shrink-0 animate-in zoom-in">
                          {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 bg-[#111] border border-white/10 rounded-3xl ${!activeContact ? 'hidden md:flex' : 'flex'} flex-col overflow-hidden relative shadow-2xl`}>
        <div className="absolute inset-0 z-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 px-4 md:px-6 border-b border-white/10 flex justify-between items-center bg-[#161616] z-30">
              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={() => setActiveContact(null)} className="md:hidden w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-neutral-800 flex items-center justify-center border-2 border-white/5 flex-shrink-0">
                  <UserCircle className="w-6 h-6 md:w-7 md:h-7 text-neutral-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-white text-lg tracking-tight flex items-center gap-2">
                    {activeContact.name}
                    {activeContact.role && (
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                        activeContact.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      }`}>
                        {activeContact.role === 'super_admin' ? 'Super Admin' : (activeContact.role === 'admin' ? 'Mitra GOR' : 'Pelanggan')}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-xs text-[#10b981] font-bold tracking-wide">Online</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-neutral-400 relative">
                <button onClick={() => startCall('audio')} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button onClick={() => startCall('video')} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button id="menu-trigger-btn" onClick={() => setShowMenu(!showMenu)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showMenu ? 'bg-white/10 text-white' : 'hover:bg-white/10'}`}>
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {/* Dropdown Menu */}
                {showMenu && (
                  <div ref={menuRef} className="absolute top-12 right-0 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 z-50">
                    <button onClick={() => { setShowContactInfo(true); setShowMenu(false); }} className="w-full px-4 py-3 text-left text-sm font-medium text-white hover:bg-white/5 flex items-center gap-3 transition-colors">
                      <UserCircle className="w-4 h-4 text-neutral-400" />
                      Info Kontak
                    </button>
                    <button onClick={handleClearChat} className="w-full px-4 py-3 text-left text-sm font-medium text-white hover:bg-white/5 flex items-center gap-3 transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                      Bersihkan Chat
                    </button>
                    <div className="h-px bg-white/10 my-1"></div>
                    <button onClick={handleBlockUser} className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors">
                      <Ban className="w-4 h-4" />
                      Blokir Pengguna
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info Modal */}
            {showContactInfo && activeContact && (
              <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-sm p-6 relative shadow-2xl transform animate-in zoom-in-95">
                  <button onClick={() => setShowContactInfo(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center mt-4">
                    <div className="w-24 h-24 rounded-full bg-neutral-800 border-4 border-[#D4AF37]/20 flex items-center justify-center mb-4">
                      <UserCircle className="w-16 h-16 text-neutral-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-1">{activeContact.name}</h2>
                    <p className="text-[#D4AF37] text-sm font-bold tracking-widest mb-6">Pelanggan Aktif</p>
                    
                    <div className="w-full bg-[#111] rounded-2xl p-4 border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 text-sm">Status ID</span>
                        <span className="text-white text-sm font-mono">{activeContact.id.split('-')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 text-sm">Media Bersama</span>
                        <span className="text-white text-sm font-bold">{messages.filter(m => m.attachment_url).length} File</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 custom-scroll flex flex-col">
              {loadingHistory ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="bg-white/5 px-6 py-3 rounded-full text-xs font-bold text-neutral-400 mb-4 tracking-widest uppercase">Hari Ini</div>
                  <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl max-w-sm">
                    <p className="text-sm font-bold text-white mb-1">Mulai Obrolan Baru</p>
                    <p className="text-xs text-neutral-400">Pesan dan panggilan dijamin kerahasiaannya.</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    const isImage = msg.attachment_url && msg.attachment_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                    
                    return (
                      <div key={msg.id} className={`flex w-full mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[85%] md:max-w-[70%] items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          
                          {/* Avatar */}
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex-shrink-0 flex items-center justify-center mb-1">
                              <UserCircle className="w-5 h-5 text-neutral-500" />
                            </div>
                          )}

                          {/* Message Content Container */}
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            
                            {/* Name Tag for received messages */}
                            {!isMe && (
                              <span className="text-[10px] font-bold text-neutral-500 mb-1 ml-1 flex items-center gap-1.5">
                                {msg.sender_name || activeContact.name}
                                {(msg.sender_role || activeContact.role) && (
                                  <span className="text-[8px] uppercase tracking-wider text-neutral-600 bg-white/5 px-1.5 py-0.5 rounded-sm">
                                    {(msg.sender_role || activeContact.role) === 'super_admin' ? 'Super Admin' : ((msg.sender_role || activeContact.role) === 'admin' ? 'Mitra GOR' : 'Pelanggan')}
                                  </span>
                                )}
                              </span>
                            )}

                            {/* Chat Bubble */}
                            <div className={`relative px-4 py-2 shadow-sm group ${
                              isMe 
                                ? 'bg-[#D4AF37] text-black rounded-2xl rounded-br-sm shadow-[#D4AF37]/10' 
                                : 'bg-[#222] text-white rounded-2xl rounded-bl-sm border border-white/5 shadow-black/50'
                            }`}>
                              
                              {/* Delete Option */}
                              <div className={`absolute top-1 ${isMe ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <button className="p-1.5 bg-black/50 text-neutral-400 hover:text-red-500 rounded-full hover:bg-black/80 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* File Attachment */}
                              {msg.attachment_url && (
                                <div className="mb-1.5">
                                  {isImage ? (
                                    <img src={`${API_URL.replace('/api/v1', '')}${msg.attachment_url}`} alt="Attachment" className="max-w-xs rounded-xl object-contain max-h-48" />
                                  ) : (
                                    <a href={`${API_URL.replace('/api/v1', '')}${msg.attachment_url}`} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2 rounded-xl border ${isMe ? 'bg-black/10 border-black/10' : 'bg-white/5 border-white/10'}`}>
                                      <Paperclip className="w-4 h-4" />
                                      <span className="text-xs font-bold underline truncate max-w-[150px]">{msg.content || 'Download File'}</span>
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Text Message */}
                              {msg.content && msg.message_type !== 'file' && (
                                <div className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap break-words">
                                  {msg.content}
                                </div>
                              )}

                              {/* Timestamp & Read Receipt */}
                              <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-black/60' : 'text-neutral-500'}`}>
                                <span className="text-[9px] font-bold">{formatTime(msg.created_at)}</span>
                                {isMe && <CheckCheck className={`w-3.5 h-3.5 ${msg.is_read ? 'text-blue-600' : 'text-current opacity-70'}`} />}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers[activeContact.id] && (
              <div className="flex justify-start px-6 pb-2 bg-[#111]">
                <div className="bg-[#1A1A1A] border border-[#333] text-neutral-400 py-2 px-4 rounded-2xl rounded-tl-sm text-sm italic flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}

            <div className="p-4 px-6 border-t border-white/10 bg-[#161616] z-10 relative">
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-24 left-6 z-50 animate-in slide-in-from-bottom-2 shadow-2xl rounded-2xl overflow-hidden border border-white/10">
                  <EmojiPicker 
                    theme="dark" 
                    onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)} 
                    width={300}
                    height={400}
                  />
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-3 items-center relative">
                <button id="emoji-trigger-btn" type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-3 transition-colors rounded-full hover:bg-white/5 ${showEmojiPicker ? 'text-[#D4AF37]' : 'text-neutral-400'}`}>
                  <Smile className="w-6 h-6" />
                </button>
                
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="p-3 text-neutral-400 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-white/5 mr-1 disabled:opacity-50">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                
                <input 
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                  placeholder={uploading ? "Mengunggah..." : "Ketik pesan Anda..."} 
                  disabled={uploading}
                  className="flex-1 bg-[#222] border border-white/5 rounded-full px-5 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all placeholder:text-neutral-600 disabled:opacity-50"
                />
                
                <button type="submit" disabled={!newMessage.trim() || uploading} className="w-14 h-14 bg-[#D4AF37] rounded-full flex items-center justify-center text-black hover:bg-yellow-500 disabled:opacity-50 disabled:hover:bg-[#D4AF37] transition-all hover:scale-105 flex-shrink-0 shadow-lg shadow-[#D4AF37]/20">
                  <Send className="w-6 h-6 ml-[-2px]" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 z-10">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-12 h-12 text-neutral-600" />
            </div>
            <h3 className="text-white font-black text-2xl mb-2 tracking-tight">JogjaCourt Web</h3>
            <p className="text-sm font-medium text-neutral-400 max-w-sm text-center">Kirim pesan dan lakukan panggilan suara maupun video dengan mudah.</p>
          </div>
        )}
      </div>

      {/* Custom Global Dialog Overlay */}
      {dialogConfig.isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-white mb-2">{dialogConfig.title}</h3>
            <p className="text-neutral-400 text-sm mb-6 leading-relaxed">{dialogConfig.message}</p>
            <div className="flex justify-end gap-3">
              {dialogConfig.type === 'confirm' && (
                <button onClick={closeDialog} className="px-5 py-2.5 rounded-xl font-semibold text-neutral-300 hover:bg-white/10 transition-colors text-sm">
                  Batal
                </button>
              )}
              <button 
                onClick={() => {
                  if (dialogConfig.type === 'confirm' && dialogConfig.onConfirm) {
                    dialogConfig.onConfirm();
                  } else {
                    closeDialog();
                  }
                }} 
                className={`px-5 py-2.5 rounded-xl font-semibold text-black transition-colors text-sm shadow-lg ${
                  dialogConfig.title === 'Error' || dialogConfig.title === 'Blokir Pengguna' || dialogConfig.title === 'Bersihkan Chat'
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                    : 'bg-[#D4AF37] hover:bg-yellow-500 shadow-[#D4AF37]/20'
                }`}
              >
                {dialogConfig.type === 'confirm' ? 'Ya, Lanjutkan' : 'Mengerti'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
