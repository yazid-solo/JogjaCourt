import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, Plus, MapPin, Edit3, Trash2, X, PlusCircle, CalendarX, Search, Phone, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

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

  const fetchData = async () => {
    try {
      const [resVenues, resAreas, resCourts] = await Promise.all([
        api.get('/venues'),
        api.get('/areas'),
        api.get('/courts')
      ]);
      
      const courts = resCourts.data;
      const venuesWithCourts = resVenues.data.map(venue => ({
        ...venue,
        courts: courts.filter(c => c.venue_id === venue.id)
      }));

      setVenues(venuesWithCourts);
      setAreas(resAreas.data);
    } catch (error) {
      console.error("Gagal memuat data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    if (window.confirm("Yakin ingin menghapus GOR ini?")) {
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
      await fetchData(); // Refresh data to show new court
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
      // Pastikan format time dari HTML input sudah "HH:MM" dan tambahkan ":00" agar kompatibel jika backend butuh time format penuh
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
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-8 sm:pb-12 px-3 sm:px-0">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">Manajemen GOR</h1>
          <p className="text-sm sm:text-base text-neutral-400 mt-2 line-clamp-2">
            {user?.role === 'super_admin' ? 'Kelola semua GOR terdaftar di JogjaCourt.' : 'Kelola daftar GOR dan lapangan milik Anda.'}
          </p>
        </div>
        <button 
          onClick={() => {
            setVenueForm({ name: '', address: '', area_id: '', description: '', phone: '', image_url: '', maps_url: '' });
            setSelectedVenueId(null);
            setShowVenueModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black px-5 sm:px-6 py-3 sm:py-3.5 rounded-full font-bold text-sm sm:text-base hover:from-yellow-400 hover:to-yellow-600 hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all shadow-lg flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah GOR</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari GOR atau alamat..." 
          className="w-full bg-black border border-white/10 rounded-2xl py-3 sm:py-3.5 pl-12 pr-4 text-sm sm:text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all"
        />
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-8">
        {filteredVenues.length === 0 ? (
          <div className="col-span-full py-12 sm:py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-3xl bg-[#111]/50">
            <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-600 mb-4" />
            <p className="text-white font-bold text-lg sm:text-xl mb-2">Tidak Ada GOR Ditemukan</p>
            <p className="text-neutral-500 text-sm sm:text-base">Coba ubah kata kunci pencarian atau tambahkan GOR baru.</p>
          </div>
        ) : (
          filteredVenues.map((venue) => (
            <div key={venue.id} className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden group hover:border-white/10 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col">
              
              {/* Image Header */}
              <div className="h-40 sm:h-48 bg-neutral-900 relative overflow-hidden">
                {venue.image_url ? (
                  <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-gradient-to-br from-neutral-800 to-black">
                    <MapPin className="w-10 h-10 sm:w-12 sm:h-12 opacity-50" />
                  </div>
                )}
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"></div>

                {/* Status Badge */}
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                  <span className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-md border transition-all ${venue.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                    {venue.is_active ? '✓ AKTIF' : '⏳ VERIFIKASI'}
                  </span>
                </div>

                {/* Actions (Edit/Delete) - Hidden on mobile, visible on hover for desktop */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-[-10px] group-hover:translate-y-0">
                  <button onClick={() => handleEditVenue(venue)} className="w-8 h-8 sm:w-9 sm:h-9 bg-black/60 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-black transition-all shadow-lg flex-shrink-0">
                    <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button onClick={() => handleDeleteVenue(venue.id)} className="w-8 h-8 sm:w-9 sm:h-9 bg-black/60 backdrop-blur-md border border-white/20 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500 hover:border-red-500 hover:text-white transition-all shadow-lg flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Venue Details */}
              <div className="p-4 sm:p-6 flex-1 flex flex-col">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5 line-clamp-2">{venue.name}</h3>
                
                <div className="flex flex-col gap-2 mb-5 sm:mb-6">
                  <p className="text-xs sm:text-sm text-neutral-400 flex items-start gap-2 line-clamp-2">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-[#D4AF37]" />
                    {venue.address}
                  </p>
                  {venue.phone && (
                    <p className="text-xs sm:text-sm text-neutral-400 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-[#D4AF37]" />
                      <a href={`https://wa.me/${venue.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors truncate">
                        {venue.phone}
                      </a>
                    </p>
                  )}
                </div>
                
                {/* Courts Section */}
                <div className="mt-auto bg-black/40 rounded-2xl p-3 sm:p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white">Lapangan</span>
                      <span className="text-[10px] sm:text-xs font-bold bg-white/10 text-neutral-300 px-2 py-0.5 rounded-full">{venue.courts?.length || 0}</span>
                    </div>
                    <button 
                      onClick={() => { 
                        setCourtForm({ name: '', court_type: 'double', rental_type: 'both', price_regular: '', price_peak: '', price_monthly: '' });
                        setSelectedCourt(null);
                        setSelectedVenueId(venue.id); 
                        setShowCourtModal(true); 
                      }}
                      className="text-[10px] sm:text-xs bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold transition-all flex items-center gap-1 border border-[#D4AF37]/20"
                    >
                      <PlusCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Tambah
                    </button>
                  </div>

                  {venue.courts?.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {venue.courts.map(c => (
                        <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#111] p-2.5 sm:p-3 rounded-xl border border-white/5 group/court hover:border-white/10 transition-colors">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-white block truncate">{c.name}</span>
                            <span className="text-xs text-[#D4AF37]">{formatIDR(c.price_regular)}<span className="text-neutral-500 ml-1">/jam</span></span>
                            {c.price_monthly && (
                              <span className="text-xs text-neutral-400 ml-2">👑 {formatIDR(c.price_monthly)}/bln</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenBlockModal(c); }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-white/5 text-neutral-400 hover:text-orange-400 hover:bg-orange-400/10 transition-colors" title="Blokir">
                              <CalendarX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleEditCourt(c, venue.id); }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-white/5 text-neutral-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors" title="Edit">
                              <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteCourt(c.id); }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-white/5 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Hapus">
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 sm:py-6 text-center">
                      <p className="text-xs sm:text-sm text-neutral-500">Belum ada lapangan.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah/Edit GOR */}
      {showVenueModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowVenueModal(false)}></div>
          
          <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="flex justify-between items-start sm:items-center p-4 sm:p-6 border-b border-white/5 bg-gradient-to-r from-black to-black/50">
              <div className="flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-white">{selectedVenueId ? 'Edit Data GOR' : 'Daftarkan GOR Baru'}</h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">Isi data lengkap GOR badminton Anda</p>
              </div>
              <button onClick={() => setShowVenueModal(false)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 ml-3">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Form Container */}
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleCreateVenue} className="p-4 sm:p-6 space-y-5 custom-scrollbar">
                {/* Nama GOR */}
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-neutral-200 mb-2.5">
                    Nama GOR <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={venueForm.name} 
                    onChange={e => setVenueForm({...venueForm, name: e.target.value})} 
                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-base sm:text-lg text-white placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                    placeholder="Misal: GOR Suka Jaya Badminton" 
                  />
                </div>

                {/* Grid: Area & Telp */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-neutral-200 mb-2.5">
                      Area / Kota <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        required 
                        value={venueForm.area_id} 
                        onChange={e => setVenueForm({...venueForm, area_id: e.target.value})} 
                        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-base sm:text-lg text-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none appearance-none transition-all pr-12"
                      >
                        <option value="">Pilih Area...</option>
                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none rotate-90" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-neutral-200 mb-2.5">
                      No. Telp / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={venueForm.phone} 
                      onChange={e => setVenueForm({...venueForm, phone: e.target.value})} 
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-base sm:text-lg text-white placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                      placeholder="08123456789" 
                    />
                  </div>
                </div>

                {/* Alamat Lengkap */}
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-neutral-200 mb-2.5">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    required 
                    value={venueForm.address} 
                    onChange={e => setVenueForm({...venueForm, address: e.target.value})} 
                    rows="3" 
                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-base sm:text-lg text-white placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all resize-none" 
                    placeholder="Jl. Raya Badminton No. 1..." 
                  ></textarea>
                </div>

                {/* Google Maps URL */}
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-neutral-200 mb-2.5">
                    URL Google Maps (Opsional)
                  </label>
                  <input 
                    type="url" 
                    value={venueForm.maps_url} 
                    onChange={e => setVenueForm({...venueForm, maps_url: e.target.value})} 
                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-base sm:text-lg text-white placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                    placeholder="https://maps.app.goo.gl/..." 
                  />
                </div>

                {/* Image Upload Section */}
                <div className="bg-gradient-to-br from-black/60 to-black/40 p-4 sm:p-5 rounded-2xl border border-white/5">
                  <label className="block text-sm sm:text-base font-semibold text-neutral-200 mb-4">Foto / Gambar GOR</label>
                  <div className="flex flex-col gap-4">
                    {/* URL Input */}
                    <input 
                      type="url" 
                      value={venueForm.image_url} 
                      onChange={e => setVenueForm({...venueForm, image_url: e.target.value})} 
                      className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-sm sm:text-base text-white placeholder:text-neutral-600 focus:border-[#D4AF37] focus:outline-none transition-all" 
                      placeholder="Atau paste URL gambar langsung di sini..." 
                    />
                    
                    {/* Preview & Upload */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      {/* Preview */}
                      {venueForm.image_url ? (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-white/10 flex-shrink-0">
                          <img src={venueForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-neutral-600 flex-shrink-0 bg-black/50">
                          <MapPin className="w-8 h-8 opacity-50 mb-1" />
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Preview</span>
                        </div>
                      )}
                      
                      {/* Upload Input */}
                      <div className="w-full sm:flex-1">
                        <input 
                          type="file" 
                          id="venue-image" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                        <label 
                          htmlFor="venue-image" 
                          className="flex items-center justify-center px-4 sm:px-6 py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer text-sm sm:text-base font-semibold text-white transition-all text-center"
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                              Mengunggah...
                            </>
                          ) : (
                            '📸 Pilih File Gambar Lokal'
                          )}
                        </label>
                        <p className="text-xs sm:text-sm text-neutral-500 mt-2 text-center sm:text-left">
                          Format JPG, PNG, atau WebP. Maks 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 p-3.5 sm:p-4 rounded-xl">
                  <p className="text-xs sm:text-sm text-blue-300 flex items-start gap-2">
                    <span className="text-lg mt-0.5">ℹ️</span>
                    <span>Data GOR akan segera diverifikasi oleh admin. Anda akan menerima notifikasi saat status berubah.</span>
                  </p>
                </div>

                {/* Buttons */}
                <div className="sticky bottom-0 bg-gradient-to-t from-[#111] via-[#111] to-transparent pt-4 sm:pt-6 pb-1 flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button 
                    type="button" 
                    onClick={() => setShowVenueModal(false)} 
                    className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg text-white bg-white/5 hover:bg-white/10 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    disabled={isSubmitting || isUploadingImage} 
                    type="submit" 
                    className="px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-bold text-base sm:text-lg rounded-2xl hover:from-yellow-400 hover:to-yellow-600 hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      selectedVenueId ? '✓ Simpan' : '+ Daftarkan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Lapangan */}
      {showCourtModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCourtModal(false)}></div>
          
          <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh] sm:max-h-[95vh]">
            {/* Header */}
            <div className="flex justify-between items-start sm:items-center p-4 sm:p-6 border-b border-white/5 bg-gradient-to-r from-black to-black/50">
              <div className="flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-white">{selectedCourt ? 'Edit Lapangan' : 'Tambah Lapangan'}</h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">Konfigurasi lapangan GOR dengan detail pricing.</p>
              </div>
              <button onClick={() => setShowCourtModal(false)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 ml-3">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Form Container dengan Scrollbar */}
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleCreateCourt} className="p-4 sm:p-6 space-y-5 custom-scrollbar">
                {/* Nama Lapangan */}
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-neutral-200 mb-2.5">
                    Nama / Nomor Lapangan <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={courtForm.name} 
                    onChange={e => setCourtForm({...courtForm, name: e.target.value})} 
                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-base sm:text-lg text-white placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                    placeholder="Contoh: Lapangan A (Karpet)" 
                  />
                </div>

                {/* Jenis Lapangan */}
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-neutral-200 mb-2.5">
                    Jenis Lapangan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={courtForm.court_type} 
                      onChange={e => setCourtForm({...courtForm, court_type: e.target.value})} 
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-base sm:text-lg text-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none appearance-none transition-all pr-12"
                    >
                      <option value="double">BWF Double / Standar</option>
                      <option value="single">Single</option>
                    </select>
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none rotate-90" />
                  </div>
                </div>

                {/* Tipe Rental */}
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-neutral-200 mb-2.5">
                    Tipe Rental <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={courtForm.rental_type} 
                      onChange={e => setCourtForm({...courtForm, rental_type: e.target.value})} 
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-base sm:text-lg text-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none appearance-none transition-all pr-12"
                    >
                      <option value="hourly">Per Jam Saja</option>
                      <option value="monthly">Member/Bulanan Saja</option>
                      <option value="both">Kedua-duanya (Per Jam + Member)</option>
                    </select>
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none rotate-90" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Pilih jenis rental yang ingin ditawarkan untuk lapangan ini</p>
                </div>

                {/* Pricing Section */}
                <div className="bg-gradient-to-br from-black/60 to-black/40 p-4 sm:p-5 rounded-2xl border border-white/5">
                  <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#D4AF37] rounded-full"></div>
                    Pengaturan Harga
                  </h3>
                  
                  {/* Price Fields Grid - Responsive */}
                  <div className="space-y-4">
                    {/* Harga Siang */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-neutral-300 mb-2">Harga Siang (08:00-16:59) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm sm:text-base font-medium">Rp</span>
                        <input 
                          required 
                          type="number" 
                          min="0" 
                          value={courtForm.price_regular} 
                          onChange={e => setCourtForm({...courtForm, price_regular: e.target.value})} 
                          className="w-full bg-black border border-white/10 rounded-xl p-3.5 sm:p-4 pl-11 sm:pl-12 text-base sm:text-lg text-white placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                          placeholder="Contoh: 30000" 
                        />
                      </div>
                    </div>

                    {/* Harga Malam */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-neutral-300 mb-2">Harga Malam (17:00-23:59) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm sm:text-base font-medium">Rp</span>
                        <input 
                          required 
                          type="number" 
                          min="0" 
                          value={courtForm.price_peak} 
                          onChange={e => setCourtForm({...courtForm, price_peak: e.target.value})} 
                          className="w-full bg-black border border-white/10 rounded-xl p-3.5 sm:p-4 pl-11 sm:pl-12 text-base sm:text-lg text-white placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                          placeholder="Contoh: 45000" 
                        />
                      </div>
                    </div>

                    {/* Harga Member/Bulanan - Conditional */}
                    {(courtForm.rental_type === 'monthly' || courtForm.rental_type === 'both') && (
                      <div className="pt-2 border-t border-white/5">
                        <label className="block text-xs sm:text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2">
                          <span className="text-lg">👑</span> Harga Member/Bulanan (Opsional)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm sm:text-base font-medium">Rp</span>
                          <input 
                            type="number" 
                            min="0" 
                            value={courtForm.price_monthly} 
                            onChange={e => setCourtForm({...courtForm, price_monthly: e.target.value})} 
                            className="w-full bg-black border border-white/10 rounded-xl p-3.5 sm:p-4 pl-11 sm:pl-12 text-base sm:text-lg text-white placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                            placeholder="Contoh: 300000" 
                          />
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-500 mt-2.5 bg-white/5 p-2.5 rounded-lg border border-white/5">
                          💡 Paket bulanan memberikan akses penuh seharian (08:00-23:59). Biarkan kosong jika hanya menerima booking per jam.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 sm:p-4 rounded-xl">
                  <p className="text-xs sm:text-sm text-emerald-300 flex items-start gap-2">
                    <span className="text-lg mt-0.5">✓</span>
                    <span>Perubahan harga akan langsung berlaku untuk booking baru. Booking yang sudah dikonfirmasi tidak terpengaruh.</span>
                  </p>
                </div>

                {/* Submit Button */}
                <div className="sticky bottom-0 bg-gradient-to-t from-[#111] via-[#111] to-transparent pt-4 sm:pt-6 pb-1">
                  <button 
                    disabled={isSubmitting} 
                    type="submit" 
                    className="w-full py-4 sm:py-5 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-bold text-base sm:text-lg rounded-2xl hover:from-yellow-400 hover:to-yellow-600 hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      selectedCourt ? '✓ Simpan Perubahan' : '+ Tambahkan Lapangan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Blokir Jadwal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowBlockModal(false)}></div>
          
          <div className="bg-[#111] border border-white/10 w-full max-w-4xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[92vh] sm:max-h-[95vh]">
            {/* Header */}
            <div className="flex justify-between items-start sm:items-center p-4 sm:p-6 border-b border-white/5 bg-gradient-to-r from-black/40 to-black/20">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2 mb-1">
                  <CalendarX className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500 flex-shrink-0" />
                  <span>Blokir Jadwal</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#D4AF37] font-semibold truncate">{selectedCourt?.name}</p>
              </div>
              <button onClick={() => setShowBlockModal(false)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 ml-3">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                
                {/* Form Tambah Blokir */}
                <form onSubmit={handleCreateBlock} className="space-y-4 bg-gradient-to-br from-black/60 via-black/40 to-black/20 p-4 sm:p-6 rounded-2xl border border-white/5">
                  <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2 mb-5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-yellow-500"></div>
                    <span>Tutup Jadwal Baru</span>
                  </h3>
                  
                  {/* Date & Time Grid - Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Tanggal */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-neutral-300 mb-2">Tanggal <span className="text-red-500">*</span></label>
                      <input 
                        required 
                        type="date" 
                        value={blockForm.block_date} 
                        onChange={e => setBlockForm({...blockForm, block_date: e.target.value})} 
                        className="w-full bg-black border border-white/10 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                      />
                    </div>
                    
                    {/* Jam Mulai */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-neutral-300 mb-2">Jam Mulai <span className="text-red-500">*</span></label>
                      <input 
                        required 
                        type="time" 
                        value={blockForm.start_time} 
                        onChange={e => setBlockForm({...blockForm, start_time: e.target.value})} 
                        className="w-full bg-black border border-white/10 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                      />
                    </div>
                    
                    {/* Jam Selesai */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-neutral-300 mb-2">Jam Selesai <span className="text-red-500">*</span></label>
                      <input 
                        required 
                        type="time" 
                        value={blockForm.end_time} 
                        onChange={e => setBlockForm({...blockForm, end_time: e.target.value})} 
                        className="w-full bg-black border border-white/10 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                      />
                    </div>
                  </div>
                  
                  {/* Alasan */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-neutral-300 mb-2">Alasan Blokir (Opsional)</label>
                    <input 
                      type="text" 
                      value={blockForm.reason} 
                      onChange={e => setBlockForm({...blockForm, reason: e.target.value})} 
                      className="w-full bg-black border border-white/10 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition-all" 
                      placeholder="Contoh: Perbaikan, Turnamen, Pembersihan..." 
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <div className="pt-3 flex justify-end">
                    <button 
                      disabled={isSubmitting} 
                      type="submit" 
                      className="bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl hover:from-yellow-400 hover:to-yellow-600 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <CalendarX className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Terapkan Blokir</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Daftar Blokir Saat Ini */}
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500"></div>
                    <span>Jadwal Tertutup ({courtBlocks.length})</span>
                  </h3>
                  
                  {courtBlocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 bg-black/20 rounded-2xl border border-dashed border-white/10 text-center">
                      <CalendarX className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-600 mb-3" />
                      <p className="text-sm sm:text-base font-semibold text-white">Jadwal Sepenuhnya Terbuka</p>
                      <p className="text-xs sm:text-sm text-neutral-500 mt-1">Tidak ada jadwal yang sedang diblokir untuk lapangan ini.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {courtBlocks.map((block) => (
                        <div key={block.id} className="flex flex-col justify-between bg-gradient-to-r from-[#111] to-black/50 p-4 sm:p-5 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-red-500/30 transition-all">
                          <div className="absolute right-0 top-0 w-20 h-20 sm:w-24 sm:h-24 bg-red-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                          
                          <div>
                            <p className="text-base sm:text-lg font-black text-white">
                              {new Date(block.block_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                            </p>
                            
                            <div className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold mt-2.5 border border-red-500/20">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)} WIB
                            </div>
                            
                            {block.reason && (
                              <p className="text-xs sm:text-sm text-neutral-300 mt-3 flex items-start gap-1.5 bg-white/5 p-2.5 rounded-lg border border-white/5">
                                <span className="font-bold text-[#D4AF37] flex-shrink-0">📌</span> 
                                <span className="line-clamp-2">{block.reason}</span>
                              </p>
                            )}
                          </div>
                          
                          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5 flex justify-end">
                            <button 
                              onClick={() => handleDeleteBlock(block.id)}
                              className="text-xs sm:text-sm font-bold text-neutral-400 hover:text-white bg-white/5 hover:bg-red-500/20 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>Buka</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
