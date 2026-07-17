import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, Plus, MapPin, Edit3, Trash2, X, PlusCircle, CalendarX, Search, Phone, ChevronRight, CheckCircle, Ban, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal States
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form States
  const [venueForm, setVenueForm] = useState({ name: '', address: '', area_id: '', description: '', phone: '', image_url: '', maps_url: '' });
  const [courtForm, setCourtForm] = useState({ name: '', court_type: 'double', rental_type: 'both', price_regular: '', price_peak: '', price_monthly: '' });
  const [blockForm, setBlockForm] = useState({ block_date: '', start_time: '', end_time: '', reason: '' });
  const [courtBlocks, setCourtBlocks] = useState([]);

  const fetchData = async (currentPage = page) => {
    try {
      const [resVenues, resAreas, resCourts] = await Promise.all([
        api.get(`/venues?page=${currentPage}&size=50`),
        api.get('/areas'),
        api.get('/courts')
      ]);
      
      const courts = resCourts.data;
      const fetchedVenues = resVenues.data.data || [];
      const venuesWithCourts = fetchedVenues.map(venue => ({
        ...venue,
        courts: courts.filter(c => c.venue_id === venue.id)
      }));

      setVenues(venuesWithCourts);
      setTotalPages(resVenues.data.total_pages || 1);
      setAreas(resAreas.data);
    } catch (error) {
      console.error("Gagal memuat data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...venueForm,
        facilities: [] // Simplified for now
      };

      if (selectedVenueId) {
        await api.put(`/venues/${selectedVenueId}`, payload);
      } else {
        await api.post('/venues', payload);
      }
      
      setShowVenueModal(false);
      setVenueForm({ name: '', address: '', area_id: '', description: '', phone: '', image_url: '', maps_url: '' });
      setSelectedVenueId(null);
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal menyimpan GOR");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVenue = (venue) => {
    setVenueForm({
      name: venue.name,
      address: venue.address,
      area_id: venue.area_id || '',
      description: venue.description || '',
      phone: venue.phone || '',
      image_url: venue.image_url || '',
      maps_url: venue.maps_url || ''
    });
    setSelectedVenueId(venue.id);
    setShowVenueModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploadingImage(true);
    try {
      const res = await api.post('/venues/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setVenueForm({ ...venueForm, image_url: res.data.image_url });
    } catch (error) {
      alert("Gagal mengunggah gambar");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (user?.role !== 'super_admin') {
      alert("Hanya Super Admin yang memiliki hak untuk menghapus GOR.");
      return;
    }
    if (window.confirm("Yakin ingin menghapus GOR ini? Tindakan ini tidak dapat dibatalkan.")) {
      try {
        await api.delete(`/venues/${venueId}`);
        await fetchData();
      } catch (error) {
        alert(error.response?.data?.detail || "Gagal menghapus GOR");
      }
    }
  };

  const handleCreateCourt = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...courtForm,
        venue_id: selectedVenueId,
        price_regular: parseFloat(courtForm.price_regular),
        price_peak: parseFloat(courtForm.price_peak),
        price_monthly: courtForm.price_monthly ? parseFloat(courtForm.price_monthly) : null
      };

      if (selectedCourt) {
        await api.put(`/courts/${selectedCourt.id}`, payload);
      } else {
        await api.post('/courts', payload);
      }
      
      setShowCourtModal(false);
      setCourtForm({ name: '', court_type: 'double', rental_type: 'both', price_regular: '', price_peak: '', price_monthly: '' });
      setSelectedCourt(null);
      await fetchData(); 
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal menyimpan Lapangan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCourt = (court, venueId) => {
    setCourtForm({
      name: court.name,
      court_type: court.court_type,
      rental_type: court.rental_type,
      price_regular: court.price_regular,
      price_peak: court.price_peak,
      price_monthly: court.price_monthly || ''
    });
    setSelectedVenueId(venueId);
    setSelectedCourt(court);
    setShowCourtModal(true);
  };

  const handleDeleteCourt = async (courtId) => {
    if (window.confirm("Yakin ingin menghapus Lapangan ini?")) {
      try {
        await api.delete(`/courts/${courtId}`);
        await fetchData();
      } catch (error) {
        alert(error.response?.data?.detail || "Gagal menghapus Lapangan");
      }
    }
  };

  const handleOpenBlockModal = async (court) => {
    setSelectedCourt(court);
    setBlockForm({ block_date: '', start_time: '', end_time: '', reason: '' });
    setShowBlockModal(true);
    await fetchCourtBlocks(court.id);
  };

  const fetchCourtBlocks = async (courtId) => {
    try {
      const res = await api.get(`/courts/${courtId}/blocks`);
      setCourtBlocks(res.data);
    } catch (err) {
      console.error("Gagal memuat jadwal blokir", err);
    }
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...blockForm,
        start_time: blockForm.start_time.length === 5 ? `${blockForm.start_time}:00` : blockForm.start_time,
        end_time: blockForm.end_time.length === 5 ? `${blockForm.end_time}:00` : blockForm.end_time,
      };
      await api.post(`/courts/${selectedCourt.id}/blocks`, payload);
      setBlockForm({ block_date: '', start_time: '', end_time: '', reason: '' });
      await fetchCourtBlocks(selectedCourt.id);
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal memblokir jadwal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (window.confirm("Yakin ingin membuka kembali jadwal (menghapus blokir) ini?")) {
      try {
        await api.delete(`/courts/${selectedCourt.id}/blocks/${blockId}`);
        await fetchCourtBlocks(selectedCourt.id);
      } catch (error) {
        alert(error.response?.data?.detail || "Gagal menghapus blokir jadwal");
      }
    }
  };

  const formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
          <MapPin className="absolute inset-0 m-auto w-8 h-8 text-[#D4AF37] animate-pulse" />
        </div>
      </div>
    );
  }

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-12 px-2 sm:px-0">
      
      {/* Cinematic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#111] border border-white/5 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <MapPin className="w-8 h-8 text-[#D4AF37]" />
              </div>
              Manajemen GOR
            </h1>
            <p className="text-neutral-400 mt-3 text-sm sm:text-base max-w-lg">
              {user?.role === 'super_admin' ? 'Pusat kendali operasional GOR, lapangan, dan harga sewa di seluruh JogjaCourt.' : 'Kelola operasional GOR, lapangan, dan pengaturan harga sewa milik Anda.'}
            </p>
          </div>
          
          <button 
            onClick={() => {
              setVenueForm({ name: '', address: '', area_id: '', description: '', phone: '', image_url: '', maps_url: '' });
              setSelectedVenueId(null);
              setShowVenueModal(true);
            }}
            className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base hover:from-yellow-400 hover:to-yellow-600 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] w-full md:w-auto overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Tambah GOR Baru</span>
          </button>
        </div>
      </motion.div>

      {/* Advanced Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-2 flex shadow-[0_10px_30px_rgba(0,0,0,0.5)] sticky top-20 z-40 backdrop-blur-xl"
      >
        <div className="relative w-full">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Telusuri berdasarkan nama GOR atau lokasi..." 
            className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-transparent focus:border-[#D4AF37]/50 rounded-2xl py-4 pl-14 pr-4 text-white font-medium focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/10 transition-all placeholder:text-neutral-600"
          />
        </div>
      </motion.div>

      {/* Venues Grid (3D Animated) */}
      <div className="grid grid-cols-1 gap-5 sm:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredVenues.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-[3rem] bg-[#111]/30 backdrop-blur-sm"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-12 h-12 text-neutral-600" />
              </div>
              <p className="text-white font-black text-2xl mb-2">Entitas GOR Tidak Ditemukan</p>
              <p className="text-neutral-500 text-base max-w-md">Data GOR tidak ada atau tidak sesuai dengan kata kunci pencarian Anda. Silakan tambahkan entitas baru.</p>
            </motion.div>
          ) : (
            filteredVenues.map((venue, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                key={venue.id} 
                className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-500 hover:shadow-[0_15px_50px_rgba(212,175,55,0.15)] flex flex-col xl:flex-row relative"
              >
                {/* 3D Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/0 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                {/* Image Header */}
                <div className="h-48 sm:h-56 xl:h-auto xl:w-[30%] flex-shrink-0 bg-neutral-900 relative overflow-hidden">
                  {venue.image_url ? (
                    <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover transform scale-100 group-hover:scale-110 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-gradient-to-br from-neutral-900 to-black">
                      <ImageIcon className="w-16 h-16 opacity-30" />
                    </div>
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent"></div>

                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl backdrop-blur-md border shadow-lg ${venue.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                      {venue.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {venue.is_active ? 'SISTEM AKTIF' : 'MENUNGGU VERIFIKASI'}
                    </span>
                  </div>

                  {/* Floating Actions (Edit/Delete) */}
                  <div className="absolute top-4 right-4 flex gap-2 translate-y-[-20px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    <button onClick={() => handleEditVenue(venue)} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/20 text-white rounded-xl flex items-center justify-center hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-black transition-all shadow-lg active:scale-90">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteVenue(venue.id)} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/20 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:border-red-500 hover:text-white transition-all shadow-lg active:scale-90">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Side Content (Desktop) */}
                <div className="flex-1 flex flex-col xl:flex-row p-5 sm:p-6 gap-6 relative z-10 xl:-mt-0 -mt-10">
                  {/* Venue Details */}
                  <div className="flex-1 flex flex-col xl:border-r border-white/5 xl:pr-6">
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-3 line-clamp-2 drop-shadow-md tracking-tight">{venue.name}</h3>
                    
                    <div className="flex flex-col gap-2.5 mb-6">
                      <p className="text-sm text-neutral-400 flex items-start gap-2.5 line-clamp-3">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#D4AF37]" />
                      <span className="leading-snug">{venue.address}</span>
                    </p>
                    {venue.phone && (
                      <p className="text-sm text-neutral-400 flex items-center gap-2.5">
                        <Phone className="w-4 h-4 flex-shrink-0 text-[#D4AF37]" />
                        <a href={`https://wa.me/${venue.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors font-mono font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                          {venue.phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                  
                {/* Courts Module */}
                <div className="w-full xl:w-[45%] flex flex-col bg-black/40 rounded-2xl p-4 sm:p-5 border border-white/5 backdrop-blur-sm relative overflow-hidden group/courts">
                    <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover/courts:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white tracking-widest uppercase text-[11px] text-neutral-400">Database Lapangan</span>
                        <span className="text-[10px] font-black bg-white/10 text-white px-2 py-0.5 rounded-full border border-white/10">{venue.courts?.length || 0}</span>
                      </div>
                      <button 
                        onClick={() => { 
                          setCourtForm({ name: '', court_type: 'double', rental_type: 'both', price_regular: '', price_peak: '', price_monthly: '' });
                          setSelectedCourt(null);
                          setSelectedVenueId(venue.id); 
                          setShowCourtModal(true); 
                        }}
                        className="text-[11px] bg-white/5 hover:bg-[#D4AF37] text-white hover:text-black px-3 py-1.5 rounded-lg font-black transition-all flex items-center gap-1.5 border border-white/10 hover:border-[#D4AF37] shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> INJEKSI DATA
                      </button>
                    </div>

                    <div className="relative z-10">
                      {venue.courts?.length > 0 ? (
                        <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                          {venue.courts.map(c => (
                            <div key={c.id} className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-[#111] p-3.5 rounded-xl border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.02]">
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-sm text-white block truncate mb-1">{c.name}</span>
                                <div className="flex flex-wrap gap-2 items-center">
                                  <span className="text-[11px] font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/20">
                                    {formatIDR(c.price_regular)}/jam
                                  </span>
                                  {c.price_monthly && (
                                    <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                      👑 {formatIDR(c.price_monthly)}/bln
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenBlockModal(c); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-neutral-400 hover:text-orange-400 hover:bg-orange-500/20 border border-transparent hover:border-orange-500/30 transition-all" title="Blokir Jadwal">
                                  <CalendarX className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleEditCourt(c, venue.id); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-neutral-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 border border-transparent hover:border-[#D4AF37]/30 transition-all" title="Edit Data">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteCourt(c.id); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-neutral-400 hover:text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all" title="Hapus Lapangan">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                          <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest">Belum ada data lapangan</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-4">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Sebelumnya
          </button>
          
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-[#D4AF37] font-black">{page}</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">{totalPages}</span>
          </div>
          
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-6 py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl font-bold text-sm text-[#D4AF37] hover:bg-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Selanjutnya
          </button>
        </div>
      )}

      {/* --- MODALS (Rebuilt with Framer Motion for Glassmorphism & Spring Physics) --- */}
      <AnimatePresence>
        {/* Modal Tambah/Edit GOR */}
        {showVenueModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowVenueModal(false)}></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] relative z-10 flex flex-col max-h-[95vh]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#D4AF37]/20 blur-[100px] pointer-events-none"></div>

              {/* Header */}
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{selectedVenueId ? 'Modifikasi GOR' : 'Registrasi GOR Baru'}</h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">Injeksi data profil fasilitas olahraga ke dalam sistem</p>
                </div>
                <button onClick={() => setShowVenueModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Container */}
              <div className="overflow-y-auto flex-1 relative z-10">
                <form onSubmit={handleCreateVenue} className="p-6 sm:p-8 space-y-6 custom-scrollbar">
                  {/* Nama GOR */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Nama Fasilitas <span className="text-red-500">*</span></label>
                    <input required type="text" value={venueForm.name} onChange={e => setVenueForm({...venueForm, name: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white font-bold placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:outline-none transition-all shadow-inner" 
                      placeholder="Misal: GOR Suka Jaya Badminton" 
                    />
                  </div>

                  {/* Grid: Area & Telp */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Region Area <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select required value={venueForm.area_id} onChange={e => setVenueForm({...venueForm, area_id: e.target.value})} 
                          className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:outline-none appearance-none transition-all shadow-inner"
                        >
                          <option value="">Pilih Area Geografis...</option>
                          {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <ChevronRight className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none rotate-90" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Kontak WhatsApp <span className="text-red-500">*</span></label>
                      <input required type="text" value={venueForm.phone} onChange={e => setVenueForm({...venueForm, phone: e.target.value})} 
                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white font-bold placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:outline-none transition-all shadow-inner font-mono" 
                        placeholder="08123456789" 
                      />
                    </div>
                  </div>

                  {/* Alamat Lengkap */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Alamat Lengkap <span className="text-red-500">*</span></label>
                    <textarea required value={venueForm.address} onChange={e => setVenueForm({...venueForm, address: e.target.value})} rows="3" 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white font-bold placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:outline-none transition-all resize-none shadow-inner" 
                      placeholder="Detail alamat operasional..." 
                    ></textarea>
                  </div>

                  {/* Google Maps URL */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Google Maps URL</label>
                    <input type="url" value={venueForm.maps_url} onChange={e => setVenueForm({...venueForm, maps_url: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white font-bold placeholder:text-neutral-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all shadow-inner font-mono text-sm" 
                      placeholder="https://maps.app.goo.gl/..." 
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div className="bg-white/[0.02] p-5 sm:p-6 rounded-3xl border border-white/5">
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Aset Visual GOR</label>
                    <div className="flex flex-col gap-5">
                      <input type="url" value={venueForm.image_url} onChange={e => setVenueForm({...venueForm, image_url: e.target.value})} 
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-bold text-sm placeholder:text-neutral-600 focus:border-[#D4AF37] focus:outline-none transition-all" 
                        placeholder="Paste URL gambar langsung di sini..." 
                      />
                      
                      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                        {venueForm.image_url ? (
                          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/30 flex-shrink-0 shadow-lg">
                            <img src={venueForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-neutral-600 flex-shrink-0 bg-black/50">
                            <ImageIcon className="w-8 h-8 opacity-50 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Preview</span>
                          </div>
                        )}
                        
                        <div className="w-full sm:flex-1">
                          <input type="file" id="venue-image" accept="image/*" onChange={handleImageUpload} className="hidden" />
                          <label htmlFor="venue-image" 
                            className="flex items-center justify-center px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer font-bold text-white transition-all text-center group"
                          >
                            {isUploadingImage ? (
                              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Mengunggah Aset...</>
                            ) : (
                              <><MapPin className="w-5 h-5 mr-2 text-neutral-400 group-hover:text-white transition-colors" /> Pilih Berkas Gambar</>
                            )}
                          </label>
                          <p className="text-xs text-neutral-500 mt-3 font-medium">Format: JPG/PNG/WebP. Maks 5MB.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:justify-end border-t border-white/5">
                    <button type="button" onClick={() => setShowVenueModal(false)} className="px-8 py-4 rounded-2xl font-bold text-white bg-white/5 hover:bg-white/10 transition-all">
                      Batalkan
                    </button>
                    <button disabled={isSubmitting || isUploadingImage} type="submit" 
                      className="px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-black rounded-2xl hover:from-yellow-400 hover:to-yellow-600 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> <span>Memproses...</span></> : (selectedVenueId ? 'Simpan Perubahan' : 'Injeksi Data')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Tambah/Edit Lapangan */}
        {showCourtModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCourtModal(false)}></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 right-0 w-64 h-32 bg-blue-500/10 blur-[100px] pointer-events-none"></div>

              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{selectedCourt ? 'Modifikasi Lapangan' : 'Tambah Lapangan Baru'}</h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">Atur parameter dan matriks harga sewa lapangan</p>
                </div>
                <button onClick={() => setShowCourtModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/30">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 relative z-10">
                <form onSubmit={handleCreateCourt} className="p-6 sm:p-8 space-y-6 custom-scrollbar">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Identitas Lapangan <span className="text-red-500">*</span></label>
                    <input required type="text" value={courtForm.name} onChange={e => setCourtForm({...courtForm, name: e.target.value})} 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white font-bold placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:outline-none transition-all shadow-inner" 
                      placeholder="Contoh: Lapangan Utama (Sintetis)" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Tipe Arena <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select value={courtForm.court_type} onChange={e => setCourtForm({...courtForm, court_type: e.target.value})} 
                          className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#D4AF37] focus:outline-none appearance-none transition-all shadow-inner"
                        >
                          <option value="double">BWF Double / Standar</option>
                          <option value="single">Single</option>
                        </select>
                        <ChevronRight className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Mode Sewa <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select value={courtForm.rental_type} onChange={e => setCourtForm({...courtForm, rental_type: e.target.value})} 
                          className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#D4AF37] focus:outline-none appearance-none transition-all shadow-inner"
                        >
                          <option value="hourly">Reguler (Per Jam)</option>
                          <option value="monthly">Membership (Bulanan)</option>
                          <option value="both">Hybrid (Reguler + Membership)</option>
                        </select>
                        <ChevronRight className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 rotate-90 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px]"></div>
                    <h3 className="text-sm font-black text-white mb-5 flex items-center gap-2 uppercase tracking-widest">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div> Matriks Harga
                    </h3>
                    
                    <div className="space-y-4 relative z-10">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-2">Harga Siang (08:00-16:59) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500 font-black">IDR</span>
                          <input required type="number" min="0" value={courtForm.price_regular} onChange={e => setCourtForm({...courtForm, price_regular: e.target.value})} 
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-4 pl-14 text-white font-black font-mono placeholder:text-neutral-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 focus:outline-none transition-all" placeholder="30000" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-2">Harga Malam (17:00-23:59) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500 font-black">IDR</span>
                          <input required type="number" min="0" value={courtForm.price_peak} onChange={e => setCourtForm({...courtForm, price_peak: e.target.value})} 
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-4 pl-14 text-white font-black font-mono placeholder:text-neutral-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 focus:outline-none transition-all" placeholder="45000" />
                        </div>
                      </div>

                      {(courtForm.rental_type === 'monthly' || courtForm.rental_type === 'both') && (
                        <div className="pt-4 mt-2 border-t border-white/5">
                          <label className="block text-xs font-bold text-purple-400 mb-2 flex items-center gap-1.5"><span className="text-sm">👑</span> Harga Membership (Sebulan)</label>
                          <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500 font-black">IDR</span>
                            <input type="number" min="0" value={courtForm.price_monthly} onChange={e => setCourtForm({...courtForm, price_monthly: e.target.value})} 
                              className="w-full bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 pl-14 text-white font-black font-mono placeholder:text-neutral-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition-all" placeholder="300000" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={() => setShowCourtModal(false)} className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white bg-white/5 hover:bg-white/10 transition-all">Batal</button>
                    <button disabled={isSubmitting} type="submit" className="w-full sm:flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : (selectedCourt ? 'Perbarui Database' : 'Tambahkan Lapangan')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Blokir Jadwal */}
        {showBlockModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowBlockModal(false)}></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a]/95 backdrop-blur-2xl border border-red-500/20 w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(239,68,68,0.15)] relative z-10 flex flex-col max-h-[95vh]"
            >
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-white/5 bg-gradient-to-r from-red-900/20 to-transparent">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                    <CalendarX className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" /> Kunci Jadwal Khusus
                  </h2>
                  <p className="text-xs sm:text-sm text-red-400 mt-1 font-bold">{selectedCourt?.name}</p>
                </div>
                <button onClick={() => setShowBlockModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <div className="p-6 sm:p-8 space-y-8">
                  
                  <form onSubmit={handleCreateBlock} className="bg-red-950/10 border border-red-500/20 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 blur-[60px] pointer-events-none"></div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2 mb-6 uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Tetapkan Parameter Blokir
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-2">Tanggal Eksekusi <span className="text-red-500">*</span></label>
                        <input required type="date" value={blockForm.block_date} onChange={e => setBlockForm({...blockForm, block_date: e.target.value})} 
                          className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white font-bold font-mono focus:border-red-500 focus:outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-2">Waktu Mulai <span className="text-red-500">*</span></label>
                        <input required type="time" value={blockForm.start_time} onChange={e => setBlockForm({...blockForm, start_time: e.target.value})} 
                          className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white font-bold font-mono focus:border-red-500 focus:outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 mb-2">Waktu Selesai <span className="text-red-500">*</span></label>
                        <input required type="time" value={blockForm.end_time} onChange={e => setBlockForm({...blockForm, end_time: e.target.value})} 
                          className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white font-bold font-mono focus:border-red-500 focus:outline-none transition-all" />
                      </div>
                    </div>
                    
                    <div className="mt-5 relative z-10">
                      <label className="block text-xs font-bold text-neutral-400 mb-2">Justifikasi Blokir (Opsional)</label>
                      <input type="text" value={blockForm.reason} onChange={e => setBlockForm({...blockForm, reason: e.target.value})} 
                        className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white font-bold placeholder:text-neutral-600 focus:border-red-500 focus:outline-none transition-all" placeholder="Contoh: Renovasi, Turnamen Khusus..." />
                    </div>
                    
                    <div className="mt-6 flex justify-end relative z-10">
                      <button disabled={isSubmitting} type="submit" 
                        className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-800 text-white font-black px-10 py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                      >
                        {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : <><Ban className="w-5 h-5" /> Kunci Jadwal</>}
                      </button>
                    </div>
                  </form>

                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2 mb-5 uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-neutral-500"></div> Daftar Jadwal Terkunci ({courtBlocks.length})
                    </h3>
                    
                    {courtBlocks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 text-center">
                        <CalendarX className="w-12 h-12 text-neutral-600 mb-4" />
                        <p className="text-base font-black text-white">Sistem Terbuka Penuh</p>
                        <p className="text-sm text-neutral-500 mt-1 max-w-sm">Tidak ada matriks waktu yang dikunci oleh admin untuk lapangan ini.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courtBlocks.map((block) => (
                          <div key={block.id} className="bg-[#111] p-5 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-red-500/50 transition-all flex flex-col justify-between">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
                            
                            <div>
                              <p className="text-lg font-black text-white font-mono tracking-tight">
                                {new Date(block.block_date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                              </p>
                              
                              <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-sm font-black font-mono mt-3 border border-red-500/20 shadow-inner">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                {block.start_time.substring(0, 5)} ➔ {block.end_time.substring(0, 5)} WIB
                              </div>
                              
                              {block.reason && (
                                <p className="text-sm text-neutral-400 mt-4 bg-black/50 p-3 rounded-xl border border-white/5 font-medium">
                                  <strong className="text-[#D4AF37] block text-xs uppercase tracking-widest mb-1">Keterangan</strong>
                                  {block.reason}
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-5 flex justify-end">
                              <button onClick={() => handleDeleteBlock(block.id)}
                                className="text-sm font-black text-neutral-400 hover:text-white bg-white/5 hover:bg-green-500/20 hover:border-green-500/50 border border-transparent px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" /> Buka Kunci
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
