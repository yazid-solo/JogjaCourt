import React, { useState, useEffect } from 'react';
import { Map, Plus, Edit3, Trash2, X, Loader2, MapPin, Search, Compass } from 'lucide-react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    province: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/areas');
      setAreas(res.data);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data area");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleOpenModal = (area = null) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        name: area.name,
        province: area.province,
        description: area.description || ''
      });
    } else {
      setEditingArea(null);
      setFormData({ name: '', province: '', description: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingArea) {
        await api.put(`/areas/${editingArea.id}`, formData);
      } else {
        await api.post('/areas', formData);
      }
      setModalOpen(false);
      fetchAreas();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Gagal menyimpan data area");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menonaktifkan area ${name}?`)) return;
    try {
      await api.delete(`/areas/${id}`);
      fetchAreas();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus area");
    }
  };

  const filteredAreas = areas.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.province.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
          <Map className="absolute inset-0 m-auto w-8 h-8 text-[#D4AF37] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-12 px-2 sm:px-0">
      
      {/* Cinematic Header */}
      <motion.div variants={itemVariants} className="relative bg-[#111] border border-white/5 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Map className="w-8 h-8 text-blue-500" />
              </div>
              Manajemen Area
            </h1>
            <p className="text-neutral-400 mt-3 text-sm sm:text-base max-w-lg">
              Kelola wilayah operasional, kota/kabupaten, dan provinsi yang dicakup oleh aplikasi secara real-time.
            </p>
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:-translate-y-1"
          >
            <Plus className="w-5 h-5" />
            Tambah Area
          </button>
        </div>
      </motion.div>

      {/* Control Bar (Search & Stats) */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Kota atau Provinsi..." 
            className="w-full bg-[#111] border border-white/5 hover:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-neutral-600 placeholder:font-normal"
          />
        </div>
        
        <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest px-6 py-4 bg-[#111] rounded-2xl border border-white/5 w-full md:w-auto justify-center text-neutral-400 shadow-inner">
          <Compass className="w-5 h-5 text-blue-500" />
          Total <span className="text-white text-lg mx-1">{areas.length}</span> Wilayah
        </div>
      </motion.div>

      {/* Grid Cards for Areas */}
      <motion.div variants={itemVariants} className="relative">
        <AnimatePresence mode="popLayout">
          {filteredAreas.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-[3rem] bg-[#0a0a0a]">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-5">
                <Map className="w-10 h-10 text-neutral-600" />
              </div>
              <p className="text-white font-black text-2xl mb-2">Tidak Ada Area Ditemukan</p>
              <p className="text-neutral-500 text-sm max-w-md">Sistem belum memiliki jangkauan di wilayah yang Anda cari, atau Anda belum mendaftarkan wilayah mana pun.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
              {filteredAreas.map((area, idx) => (
                <motion.div 
                  layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}
                  key={area.id} 
                  className="relative bg-[#0a0a0a] rounded-[2rem] p-5 sm:p-6 border border-white/5 group hover:border-blue-500/30 transition-all hover:shadow-[0_15px_40px_rgba(59,130,246,0.1)] overflow-hidden flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-6 min-h-[160px]"
                >
                  
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                  <MapPin className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-[0.02] group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700 pointer-events-none" />

                  {/* Kiri: Provinsi & Kota */}
                  <div className="w-full xl:w-[40%] flex flex-col relative z-10 border-b xl:border-b-0 xl:border-r border-white/5 pb-4 xl:pb-0 xl:pr-6">
                    <span className="inline-flex w-max items-center px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase shadow-inner mb-3">
                      {area.province}
                    </span>
                    <h3 className="font-black text-2xl text-white tracking-tight leading-none">{area.name}</h3>
                  </div>

                  {/* Tengah: Deskripsi */}
                  <div className="w-full xl:flex-1 relative z-10">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-3">
                        {area.description || "Tidak ada deskripsi spesifik. Area ini berfungsi sebagai titik pusat cakupan operasional sistem."}
                      </p>
                    </div>
                  </div>
                  
                  {/* Kanan: Aksi */}
                  <div className="w-full xl:w-auto flex xl:flex-col gap-2 relative z-10 pt-4 xl:pt-0 xl:pl-4">
                    <button onClick={() => handleOpenModal(area)} className="flex-1 xl:flex-none xl:w-10 xl:h-10 flex items-center justify-center bg-white/5 xl:bg-black/50 backdrop-blur-sm border border-white/10 text-white rounded-xl hover:bg-blue-500 hover:border-blue-500 transition-all py-3 xl:py-0" title="Edit Area">
                      <Edit3 className="w-4 h-4" /> <span className="xl:hidden ml-2 text-xs font-bold">EDIT</span>
                    </button>
                    <button onClick={() => handleDelete(area.id, area.name)} className="flex-1 xl:flex-none xl:w-10 xl:h-10 flex items-center justify-center bg-white/5 xl:bg-black/50 backdrop-blur-sm border border-white/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all py-3 xl:py-0" title="Hapus Area">
                      <Trash2 className="w-4 h-4" /> <span className="xl:hidden ml-2 text-xs font-bold">HAPUS</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Glassmorphism Modal Tambah/Edit */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setModalOpen(false)}></div>
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-2xl w-full max-w-lg rounded-[2rem] border border-white/10 relative z-10 shadow-[0_0_50px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] pointer-events-none"></div>
              
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                    <MapPin className="w-6 h-6 text-blue-500" />
                    {editingArea ? 'Modifikasi Area' : 'Area Baru'}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                    Atur data wilayah operasional
                  </p>
                </div>
                <button onClick={() => setModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 relative z-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Nama Kota / Kabupaten <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                      placeholder="Contoh: Kota Yogyakarta"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Provinsi <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                      placeholder="Contoh: DI Yogyakarta"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Deskripsi Spesifik</label>
                    <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all shadow-inner"
                      placeholder="Catatan internal..."
                    />
                  </div>

                  <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-white/5">
                    <button type="button" onClick={() => setModalOpen(false)} className="w-full sm:w-auto px-6 py-4 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 transition-colors">
                      Batal
                    </button>
                    <button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black rounded-2xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[150px]">
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Injeksi Data'}
                    </button>
                  </div>
                  
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
