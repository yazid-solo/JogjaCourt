import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { MessageSquare, CheckCircle2, Trash2, ShieldAlert, Star, Search, Clock, MessageSquareQuote, Check, Reply, X, Loader2, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminTestimonials() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState('ALL');
  const [replyModal, setReplyModal] = useState(null);
  const [replyForm, setReplyForm] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/testimonials/admin');
      setTestimonials(res.data);
    } catch (err) {
      console.error("Gagal memuat testimoni:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      fetchTestimonials();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleApprove = async (testiId) => {
    try {
      setTestimonials(prev => prev.map(t => t.id === testiId ? { ...t, is_approved: true } : t));
      await api.put(`/testimonials/admin/${testiId}/approve`);
    } catch (err) {
      console.error(err);
      alert("Gagal menyetujui ulasan.");
      fetchTestimonials(); 
    }
  };

  const handleDelete = async (testiId) => {
    if (!window.confirm("Hapus ulasan ini secara permanen dari aplikasi?")) return;
    try {
      setTestimonials(prev => prev.filter(t => t.id !== testiId)); 
      await api.delete(`/testimonials/admin/${testiId}`);
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus ulasan.");
      fetchTestimonials(); 
    }
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyModal) return;
    try {
      setSubmittingReply(true);
      const res = await api.put(`/testimonials/admin/${replyModal.id}/reply`, { reply: replyForm });
      setTestimonials(prev => prev.map(t => t.id === replyModal.id ? res.data : t));
      setReplyModal(null);
      setReplyForm('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Gagal mengirim balasan.");
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
          <MessageSquareQuote className="absolute inset-0 m-auto w-8 h-8 text-[#D4AF37] animate-pulse" />
        </div>
      </div>
    );
  }

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-32 bg-[#0a0a0a] rounded-[3rem] border-2 border-dashed border-red-500/20 m-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] pointer-events-none"></div>
        <ShieldAlert className="w-24 h-24 text-red-500 mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-bounce" />
        <h2 className="text-3xl font-black text-white mb-3">AKSES DITOLAK</h2>
        <p className="text-neutral-400 max-w-md text-lg">Fitur ulasan eksklusif untuk Mitra GOR dan Super Admin.</p>
      </div>
    );
  }

  const filteredTestimonials = testimonials.filter(t => {
    const matchesSearch = t.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = filterRating === 'ALL' ? true : t.rating === parseInt(filterRating);
    return matchesSearch && matchesRating;
  });

  const pendingCount = testimonials.filter(t => !t.is_approved).length;
  const avgRating = testimonials.length > 0 
    ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1) 
    : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-12 px-2 sm:px-0">
      
      {/* Header Section */}
      <motion.div variants={itemVariants} className="relative bg-[#111] border border-white/5 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <MessageSquareQuote className="w-8 h-8 text-emerald-500" />
              </div>
              Pusat Ulasan
            </h1>
            <p className="text-neutral-400 mt-3 text-sm sm:text-base max-w-lg">
              {user?.role === 'super_admin' 
                ? 'Pantau sentimen pelanggan dan kontrol moderasi ulasan publik (Super Admin).'
                : 'Pantau ulasan dari member dan berikan respon yang baik untuk menjaga reputasi GOR Anda.'}
            </p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-[#0a0a0a] border border-white/5 hover:border-white/10 rounded-2xl p-4 text-center transition-all shadow-inner">
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Total Rata-rata</p>
              <p className="text-2xl font-black text-[#D4AF37] flex items-center justify-center gap-1.5 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                {avgRating} <Star className="w-5 h-5 fill-current" />
              </p>
            </div>
            <div className="flex-1 md:flex-none bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(249,115,22,0.15)] relative overflow-hidden">
              <div className="absolute inset-0 bg-orange-500/10 animate-pulse"></div>
              <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-1 relative z-10">Menunggu (Pending)</p>
              <p className="text-2xl font-black text-orange-400 relative z-10">{pendingCount}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Control Bar */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lacak berdasarkan nama atau kalimat..." 
            className="w-full bg-[#111] border border-white/5 hover:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold placeholder:text-neutral-600 placeholder:font-normal"
          />
        </div>
        
        <select 
          value={filterRating} 
          onChange={(e) => setFilterRating(e.target.value)}
          className="w-full md:w-auto bg-[#111] border border-white/5 text-white rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 appearance-none cursor-pointer font-bold transition-all hover:bg-white/[0.02]"
        >
          <option value="ALL">🌟 Tampilkan Semua Rating</option>
          <option value="5">⭐⭐⭐⭐⭐ Bintang 5</option>
          <option value="4">⭐⭐⭐⭐ Bintang 4</option>
          <option value="3">⭐⭐⭐ Bintang 3</option>
          <option value="2">⭐⭐ Bintang 2</option>
          <option value="1">⭐ Bintang 1</option>
        </select>
      </motion.div>

      {/* Testimonials 3D Masonry/Grid */}
      <motion.div variants={itemVariants} className="relative">
        <AnimatePresence mode="popLayout">
          {filteredTestimonials.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-[3rem] bg-[#0a0a0a]">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-5">
                <MessageSquare className="w-10 h-10 text-neutral-600" />
              </div>
              <p className="text-white font-black text-2xl mb-2">Tidak Ada Data Ulasan</p>
              <p className="text-neutral-500 text-sm max-w-md">Belum ada pelanggan yang meninggalkan feedback pada metrik ini.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:gap-6">
              {filteredTestimonials.map((testim, idx) => (
                <motion.div 
                  layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}
                  key={testim.id} 
                  className={`bg-[#0a0a0a] rounded-[2rem] p-5 sm:p-6 border transition-all flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-6 relative overflow-hidden group hover:-translate-y-1 ${
                    testim.is_approved 
                      ? 'border-white/5 hover:border-emerald-500/30 hover:shadow-[0_15px_40px_rgba(16,185,129,0.1)]' 
                      : 'border-orange-500/30 hover:border-orange-500/50 hover:shadow-[0_15px_40px_rgba(249,115,22,0.15)] bg-gradient-to-b from-[#0a0a0a] to-orange-500/[0.02]'
                  }`}
                >
                  
                  {/* Decorative Glow */}
                  {testim.is_approved ? (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                  ) : (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[40px] pointer-events-none"></div>
                  )}

                  {/* Kiri: User & Status & Rating */}
                  <div className="w-full xl:w-[25%] flex flex-col relative z-10 border-b xl:border-b-0 xl:border-r border-white/5 pb-4 xl:pb-0 xl:pr-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#111] overflow-hidden border border-white/10 shadow-inner flex items-center justify-center relative flex-shrink-0">
                          {testim.user_profile_image ? (
                            <img src={testim.user_profile_image} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            <UserCircle className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-white text-sm sm:text-[15px] truncate max-w-[150px] xl:max-w-[120px]">{testim.user_name}</p>
                          <p className="text-[9px] sm:text-[10px] font-mono text-neutral-500 mt-0.5">
                            {format(new Date(testim.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      {/* Rating */}
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${i < testim.rating ? 'fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]' : 'text-white/5 fill-white/5'}`} 
                          />
                        ))}
                      </div>
                      <div className="flex">
                        {testim.is_approved ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            <CheckCircle2 className="w-3 h-3" /> Publik
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)] animate-pulse">
                            <Clock className="w-3 h-3" /> Tertunda
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tengah: Content Box & Reply */}
                  <div className="w-full xl:flex-1 flex flex-col justify-center relative z-10 gap-3">
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 relative shadow-inner">
                      <MessageSquareQuote className="absolute top-2 left-2 w-8 h-8 text-white/[0.02]" />
                      <p className="text-xs sm:text-sm text-neutral-300 relative z-10 leading-relaxed min-h-[40px]">
                        "{testim.content}"
                      </p>
                      
                      {testim.venue_name && (
                        <div className="mt-3 pt-3 border-t border-white/5 relative z-10 flex items-center justify-between">
                           <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Tempat Main:</p>
                           <p className="text-[10px] sm:text-[11px] text-[#D4AF37] font-black bg-[#D4AF37]/10 px-2 py-1 rounded-md border border-[#D4AF37]/20">{testim.venue_name}</p>
                        </div>
                      )}
                    </div>

                    {/* Admin Reply Box */}
                    {testim.admin_reply && (
                      <div className="bg-blue-500/5 p-3 sm:p-4 rounded-2xl border border-blue-500/10 relative shadow-inner xl:ml-4">
                        <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-500/10 border-l border-t border-blue-500/20 rotate-[-45deg]"></div>
                        <p className="text-[9px] sm:text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Reply className="w-3 h-3" /> Respon Pengelola
                        </p>
                        <p className="text-[11px] sm:text-xs text-blue-100/70 italic leading-relaxed">"{testim.admin_reply}"</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Kanan: Actions */}
                  <div className="w-full xl:w-[20%] flex flex-col justify-center gap-2 relative z-10 pt-4 xl:pt-0 border-t xl:border-t-0 xl:border-l border-white/5 xl:pl-6">
                    <button onClick={() => { setReplyModal(testim); setReplyForm(testim.admin_reply || ''); }}
                      className="w-full flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white py-3 rounded-xl text-xs font-black transition-all border border-blue-500/20 shadow-inner hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    >
                      <Reply className="w-4 h-4" /> BALAS
                    </button>
                    
                    {user?.role === 'super_admin' ? (
                      !testim.is_approved ? (
                        <button onClick={() => handleApprove(testim.id)}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white py-3 rounded-xl text-xs font-black transition-all border border-emerald-500/20 shadow-inner hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                          <Check className="w-4 h-4" /> SETUJUI
                        </button>
                      ) : (
                        <button onClick={() => handleDelete(testim.id)}
                          className="w-full flex items-center justify-center gap-2 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-xl text-xs font-black transition-all border border-red-500/10 hover:border-red-500 shadow-inner"
                        >
                          <Trash2 className="w-4 h-4" /> MUSNAHKAN
                        </button>
                      )
                    ) : (
                       <button onClick={() => {}} disabled
                          className="w-full flex items-center justify-center gap-2 bg-white/5 text-neutral-600 py-3 rounded-xl text-xs font-black cursor-not-allowed border border-white/5 shadow-inner"
                        >
                          --
                        </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Glassmorphism Reply Modal */}
      <AnimatePresence>
        {replyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setReplyModal(null)}></div>
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-2xl w-full max-w-lg rounded-[2rem] border border-white/10 relative z-10 shadow-[0_0_50px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] pointer-events-none"></div>
              
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                    <Reply className="w-6 h-6 text-blue-500" />
                    Beri Tanggapan
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                    Balasan ini bersifat publik dan terlihat oleh semua orang.
                  </p>
                </div>
                <button onClick={() => setReplyModal(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 relative z-10">
                <div className="bg-black/50 p-5 rounded-2xl border border-white/5 mb-6 shadow-inner relative">
                  <MessageSquareQuote className="absolute top-2 right-2 w-16 h-16 text-white/5 pointer-events-none" />
                  <p className="font-black text-sm text-white mb-2">{replyModal.user_name}</p>
                  <p className="text-sm text-neutral-300 italic relative z-10">"{replyModal.content}"</p>
                </div>

                <form onSubmit={submitReply}>
                  <div className="mb-6">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">
                      Pesan Formal (Representasi GOR / Sistem)
                    </label>
                    <textarea required value={replyForm} onChange={(e) => setReplyForm(e.target.value)}
                      placeholder="Terima kasih atas ulasan Anda. Kami akan terus..."
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[120px] transition-all shadow-inner resize-none"
                    />
                  </div>

                  <button type="submit" disabled={submittingReply || !replyForm.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Terbitkan Tanggapan Secara Global'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
