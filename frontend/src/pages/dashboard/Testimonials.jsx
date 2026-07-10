import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { MessageSquare, CheckCircle2, Trash2, ShieldAlert, Star, Search, Clock, MessageSquareQuote, Check, Reply, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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
      // Optimistic update
      setTestimonials(prev => prev.map(t => t.id === testiId ? { ...t, is_approved: true } : t));
      await api.put(`/testimonials/admin/${testiId}/approve`);
    } catch (err) {
      console.error(err);
      alert("Gagal menyetujui ulasan.");
      fetchTestimonials(); // Revert on fail
    }
  };

  const handleDelete = async (testiId) => {
    if (!window.confirm("Hapus ulasan ini secara permanen dari aplikasi?")) return;
    try {
      setTestimonials(prev => prev.filter(t => t.id !== testiId)); // Optimistic update
      await api.delete(`/testimonials/admin/${testiId}`);
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus ulasan.");
      fetchTestimonials(); // Revert on fail
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
        <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-[#111]/50 rounded-3xl border border-white/5">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-neutral-400 max-w-md">Fitur ulasan hanya tersedia untuk Mitra GOR dan Super Admin.</p>
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <MessageSquareQuote className="w-8 h-8 text-[#D4AF37]" />
            Ulasan Pelanggan
          </h1>
          <p className="text-neutral-400 mt-2">
            {user?.role === 'super_admin' 
              ? 'Pusat moderasi. Tinjau dan setujui ulasan dari pengguna sebelum dipublikasikan.'
              : 'Pantau ulasan pelanggan untuk GOR Anda dan berikan balasan terbaik.'}
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl px-5 py-3 text-center min-w-[100px]">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Rata-rata</p>
            <p className="text-xl font-bold text-[#D4AF37] flex items-center justify-center gap-1">
              {avgRating} <Star className="w-4 h-4 fill-current" />
            </p>
          </div>
          <div className="bg-[#111] border border-orange-500/30 rounded-2xl px-5 py-3 text-center min-w-[100px] shadow-[0_0_15px_rgba(249,115,22,0.1)]">
            <p className="text-[10px] text-orange-400/80 font-bold uppercase tracking-wider mb-1">Menunggu</p>
            <p className="text-xl font-bold text-orange-400">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#111] border border-white/5 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 relative w-full sm:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama atau isi ulasan..." 
            className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
          />
        </div>
        
        {/* Rating Filter */}
        <select 
          value={filterRating} 
          onChange={(e) => setFilterRating(e.target.value)}
          className="bg-black/50 border border-white/10 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] appearance-none min-w-[150px] cursor-pointer"
        >
          <option value="ALL">Semua Rating</option>
          <option value="5">Bintang 5</option>
          <option value="4">Bintang 4</option>
          <option value="3">Bintang 3</option>
          <option value="2">Bintang 2</option>
          <option value="1">Bintang 1</option>
        </select>
      </div>

      {/* Testimonials Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border-separate border-spacing-y-3">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-neutral-500 px-4">
              <th className="px-6 font-bold pb-2">Profil Pengguna</th>
              <th className="px-6 font-bold pb-2 text-center">Rating</th>
              <th className="px-6 font-bold pb-2">Isi Ulasan</th>
              <th className="px-6 font-bold pb-2 text-center">Status</th>
              <th className="px-6 font-bold pb-2 text-right">Moderasi</th>
            </tr>
          </thead>
          <tbody>
            {filteredTestimonials.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12">
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-[#111]/50 border-2 border-dashed border-white/5 rounded-3xl">
                    <MessageSquare className="w-12 h-12 text-neutral-600 mb-3" />
                    <p className="text-white font-bold text-lg">Ulasan Kosong</p>
                    <p className="text-neutral-500 text-sm">Tidak ada testimoni yang sesuai dengan kriteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTestimonials.map((testim) => (
                <tr key={testim.id} className="bg-[#111] hover:bg-[#151515] transition-colors group shadow-sm">
                  {/* Profil Pengguna */}
                  <td className="p-4 rounded-l-2xl border-y border-l border-white/5 group-hover:border-white/10">
                    <div className="flex items-center gap-4 pl-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-800 to-black overflow-hidden border border-white/10 flex-shrink-0 relative">
                        {testim.user_profile_image ? (
                          <img src={testim.user_profile_image} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-neutral-400 text-lg">
                            {testim.user_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-[15px]">{testim.user_name}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          {format(new Date(testim.created_at), 'dd MMM yyyy, HH:mm', { locale: id })} WIB
                        </p>
                        {testim.venue_name && (
                           <p className="text-[10px] text-[#D4AF37] font-bold mt-0.5">{testim.venue_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Rating */}
                  <td className="p-4 border-y border-white/5 group-hover:border-white/10 text-center align-middle">
                    <div className="flex justify-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < testim.rating ? 'fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]' : 'text-neutral-800 fill-neutral-800'}`} 
                        />
                      ))}
                    </div>
                  </td>
                  
                  {/* Isi Ulasan */}
                  <td className="p-4 border-y border-white/5 group-hover:border-white/10 align-middle w-1/3">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 relative">
                      <MessageSquareQuote className="absolute top-2 left-2 w-8 h-8 text-white/5" />
                      <p className="text-sm text-neutral-300 relative z-10 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                        "{testim.content}"
                      </p>
                      
                      {testim.admin_reply && (
                        <div className="mt-3 pt-3 border-t border-white/10 relative z-10">
                          <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider mb-1">Balasan Super Admin:</p>
                          <p className="text-xs text-neutral-400 italic">"{testim.admin_reply}"</p>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Status */}
                  <td className="p-4 border-y border-white/5 group-hover:border-white/10 text-center align-middle">
                    <div className="flex justify-center">
                      {testim.is_approved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dipublikasikan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                          <Clock className="w-3.5 h-3.5" /> Menunggu Review
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Aksi */}
                  <td className="p-4 rounded-r-2xl border-y border-r border-white/5 group-hover:border-white/10 text-right align-middle pr-6">
                    <div className="flex items-center justify-end gap-2">
                      {user?.role === 'super_admin' && !testim.is_approved && (
                        <button
                          onClick={() => handleApprove(testim.id)}
                          className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-emerald-500/20"
                        >
                          <Check className="w-4 h-4" /> Setujui
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setReplyModal(testim);
                          setReplyForm(testim.admin_reply || '');
                        }}
                        className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-blue-500/20"
                      >
                        <Reply className="w-4 h-4" /> Balas
                      </button>

                      {user?.role === 'super_admin' && (
                        <button
                          onClick={() => handleDelete(testim.id)}
                          className="p-2 bg-white/5 hover:bg-red-500 text-neutral-400 hover:text-white rounded-xl transition-all border border-white/5 hover:border-red-500"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] max-w-md w-full rounded-3xl border border-white/10 relative p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setReplyModal(null);
                setReplyForm('');
              }}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Reply className="w-5 h-5 text-[#D4AF37]" /> Balas Ulasan
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              Balasan Anda akan dipublikasikan dan dapat dilihat oleh semua orang.
            </p>

            <div className="bg-black/50 p-4 rounded-xl border border-white/5 mb-6">
              <p className="font-bold text-sm text-white mb-1">{replyModal.user_name}</p>
              <p className="text-sm text-neutral-400 italic">"{replyModal.content}"</p>
            </div>

            <form onSubmit={submitReply}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Pesan Balasan</label>
                <textarea
                  required
                  value={replyForm}
                  onChange={(e) => setReplyForm(e.target.value)}
                  placeholder="Ketik balasan Anda di sini..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] min-h-[120px]"
                />
              </div>

              <button 
                type="submit"
                disabled={submittingReply || !replyForm.trim()}
                className="w-full bg-[#D4AF37] text-black font-bold py-3.5 rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submittingReply && <Loader2 className="w-5 h-5 animate-spin" />}
                {submittingReply ? 'Menyimpan...' : 'Kirim Balasan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
