import React, { useState, useEffect } from 'react';
import { Map, Plus, Edit3, Trash2, X, Loader2, MapPin, Search, Compass } from 'lucide-react';
import api from '@/lib/api';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Map className="w-8 h-8 text-[#D4AF37]" />
            Manajemen Area
          </h1>
          <p className="text-neutral-400 mt-2">
            Kelola wilayah operasional, kota/kabupaten, dan provinsi yang dicakup oleh JogjaCourt.
          </p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-yellow-500 text-black rounded-full font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Tambah Area
        </button>
      </div>

      {/* Control Bar (Search & Stats) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Kota atau Provinsi..." 
            className="w-full bg-[#111] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 text-sm text-neutral-400 font-medium px-5 py-3 bg-[#111] rounded-2xl border border-white/10 w-full md:w-auto justify-center">
          <Compass className="w-5 h-5 text-[#D4AF37]" />
          Total <span className="text-white font-bold text-lg mx-1">{areas.length}</span> Wilayah Terdaftar
        </div>
      </div>

      {/* Grid Cards for Areas */}
      {filteredAreas.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-3xl bg-[#111]/50">
          <Map className="w-16 h-16 text-neutral-600 mb-4" />
          <p className="text-white font-bold text-xl mb-1">Tidak Ada Area Ditemukan</p>
          <p className="text-neutral-500 text-sm max-w-md">JogjaCourt belum memiliki jangkauan di wilayah yang Anda cari, atau Anda belum mendaftarkan wilayah mana pun.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAreas.map((area) => (
            <div key={area.id} className="relative bg-gradient-to-br from-[#151515] to-[#0a0a0a] rounded-3xl p-6 border border-white/5 group hover:border-[#D4AF37]/30 transition-all hover:shadow-[0_10px_30px_rgba(212,175,55,0.05)] overflow-hidden flex flex-col h-full min-h-[220px]">
              
              {/* Background Watermark Icon */}
              <MapPin className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-[0.02] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                  {area.province}
                </span>
                
                {/* Actions that appear on hover */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-[-5px] group-hover:translate-y-0">
                  <button
                    onClick={() => handleOpenModal(area)}
                    className="p-2 bg-black/50 backdrop-blur-sm border border-white/10 text-white rounded-full hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all"
                    title="Edit Area"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(area.id, area.name)}
                    className="p-2 bg-black/50 backdrop-blur-sm border border-white/10 text-red-400 rounded-full hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                    title="Hapus Area"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="relative z-10 mt-auto">
                <h3 className="font-black text-2xl text-white mb-2 leading-tight">{area.name}</h3>
                <p className="text-sm text-neutral-400 line-clamp-3 leading-relaxed">
                  {area.description || "Tidak ada deskripsi spesifik untuk area ini. Area ini berfungsi sebagai titik cakupan untuk GOR Badminton lokal."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Premium Modal Tambah/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
          
          <div className="bg-[#111] max-w-lg w-full rounded-3xl border border-white/10 relative z-10 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-[#D4AF37]" />
                  {editingArea ? 'Edit Wilayah' : 'Buka Wilayah Baru'}
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Masukkan detail kota/kabupaten jangkauan operasional.
                </p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Nama Kota / Kabupaten <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    placeholder="Contoh: Yogyakarta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Provinsi <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({...formData, province: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    placeholder="Contoh: DI Yogyakarta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Deskripsi Singkat Wilayah</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] resize-none transition-all"
                    placeholder="Catatan informasi tambahan mengenai wilayah ini..."
                  />
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-white/5 mt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-yellow-500 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px]"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Area'}
                  </button>
                </div>
                
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
