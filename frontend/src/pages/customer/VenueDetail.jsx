import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import {
  Loader2, MapPin, Calendar, Clock, ArrowLeft, Star, Info,
  ChevronRight, Check, Crown, Zap, CalendarRange, X, MessageSquare
} from 'lucide-react';
import FloatingChat from '@/components/chat/FloatingChat';
import MonthlySessionSelector from '@/components/booking/MonthlySessionSelector';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const getLocalDateString = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      firstDay: getLocalDateString(d),
    });
  }
  return options;
};

export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [testimonials, setTestimonials] = useState([]);

  // Booking mode: 'hourly' | 'monthly'
  const [bookingMode, setBookingMode] = useState('hourly');

  // Hourly state
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  
  // Mobile Booking Widget State
  const [showMobileWidget, setShowMobileWidget] = useState(false);

  // Monthly state
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value || '');

  // Determine available booking modes based on selected court's rental_type
  const getAvailableRentalTypes = () => {
    if (!selectedCourt?.rental_type) return { hourly: true, monthly: true };
    const types = {
      hourly: false,
      monthly: false
    };
    if (selectedCourt.rental_type === 'hourly') types.hourly = true;
    else if (selectedCourt.rental_type === 'monthly') types.monthly = true;
    else if (selectedCourt.rental_type === 'both') {
      types.hourly = true;
      types.monthly = true;
    }
    return types;
  };

  const availableTypes = getAvailableRentalTypes();

  // Auto-switch booking mode when court changes and current mode is not available
  useEffect(() => {
    const available = getAvailableRentalTypes();
    if (bookingMode === 'hourly' && !available.hourly) {
      setBookingMode('monthly');
    } else if (bookingMode === 'monthly' && !available.monthly) {
      setBookingMode('hourly');
    }
  }, [selectedCourt?.id, selectedCourt?.rental_type]);

  useEffect(() => {
    const fetchVenueAndCourts = async (isInitial = false) => {
      try {
        const [resVenue, resCourts] = await Promise.all([
          api.get(`/venues/${id}`),
          api.get(`/courts?venue_id=${id}`)
        ]);

        // Only update venue if data actually changed (prevents re-render on polling)
        setVenue(prev => {
          const newData = { ...resVenue.data, courts: resCourts.data };
          if (!prev) return newData;
          // Compare by JSON to detect real changes
          const prevStr = JSON.stringify({ ...prev, courts: prev.courts });
          const newStr = JSON.stringify(newData);
          return prevStr === newStr ? prev : newData;
        });

        if (resCourts.data?.length > 0) {
          setSelectedCourt(prev => {
            if (!prev || !resCourts.data.find(c => c.id === prev.id)) {
              return isInitial ? resCourts.data[0] : prev || resCourts.data[0];
            }
            const updatedCourt = resCourts.data.find(c => c.id === prev.id);
            // Only update if court data actually changed
            if (updatedCourt && JSON.stringify(updatedCourt) !== JSON.stringify(prev)) {
              return updatedCourt;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Gagal memuat detail GOR', error);
        setErrorMsg(error.message || "Gagal menghubungi server");
      } finally {
        setLoading(false);
      }
    };

    fetchVenueAndCourts(true);

    // Poll every 60s (was 15s) — only updates state if data actually changed
    const intervalId = setInterval(() => fetchVenueAndCourts(false), 60000);
    
    return () => clearInterval(intervalId);
  }, [id]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get(`/testimonials/venue/${id}`);
        setTestimonials(res.data);
      } catch (error) {
        console.error('Gagal memuat ulasan', error);
      }
    };
    fetchTestimonials();
  }, [id]);

  useEffect(() => {
    if (bookingMode !== 'hourly') return;
    const fetchAvailability = async () => {
      if (!selectedCourt || !selectedDate) return;
      setLoadingAvailability(true);
      try {
        const res = await api.get(`/courts/${selectedCourt.id}/availability?date_req=${selectedDate}`);
        setAvailability(res.data);
        setSelectedSlots([]);
      } catch (error) {
        console.error('Gagal memuat ketersediaan', error);
      } finally {
        setLoadingAvailability(false);
      }
    };
    fetchAvailability();
  }, [selectedCourt?.id, selectedDate, bookingMode]);

  // Reset slot saat ganti mode atau lapangan
  useEffect(() => {
    setSelectedSlots([]);
  }, [bookingMode, selectedCourt?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
        <p className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm animate-pulse">Menyiapkan Arena...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-black mb-4">GOR Tidak Ditemukan</h1>
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-xl mb-6 max-w-md text-center">
            <p className="font-mono text-sm">{errorMsg}</p>
          </div>
        )}
        <Link to="/explore" className="text-[#D4AF37] hover:underline font-bold">Kembali ke Eksplor</Link>
      </div>
    );
  }

  const avgRating = testimonials.length > 0 
    ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)
    : null;

  const toggleSlot = (slot) => {
    const now = new Date();
    const isToday = selectedDate === getLocalDateString(now);
    const currentHour = now.getHours();
    const slotHour = parseInt(slot.start_time.split(':')[0], 10);
    const isPast = isToday && slotHour <= currentHour;
    if (!slot.is_available || isPast) return;

    const isSelected = selectedSlots.some(s => s.start_time === slot.start_time);
    if (isSelected) {
      setSelectedSlots(selectedSlots.filter(s => s.start_time !== slot.start_time));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleCheckoutHourly = () => {
    if (selectedSlots.length === 0) return;
    const sortedSlots = [...selectedSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const totalPrice = sortedSlots.reduce((sum, slot) => sum + Number(slot.price), 0);
    navigate('/checkout', {
      state: {
        venue,
        court: selectedCourt,
        date: selectedDate,
        slots: sortedSlots,
        totalPrice,
        bookingType: 'hourly'
      }
    });
  };

  const handleCheckoutMonthly = (sessionData) => {
    if (!selectedCourt) return;
    if (!selectedCourt.price_monthly) {
      alert('Sewa bulanan tidak tersedia untuk lapangan ini. Admin belum mengatur harga bulanan.');
      return;
    }
    
    const startDate = new Date(selectedDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 30);
    
    // Prepare session info untuk checkout
    const { sessions, isFullAccess, totalPrice, days_of_week } = sessionData || {};
    
    navigate('/checkout', {
      state: {
        venue,
        court: selectedCourt,
        date: selectedDate, // Start date
        endDate: endDate.toISOString().split('T')[0], // Tambahkan end_date untuk checkout
        slots: [{
          start_time: '08:00:00',
          end_time: '23:00:00',
          price: totalPrice || Number(selectedCourt.price_monthly)
        }],
        totalPrice: totalPrice || Number(selectedCourt.price_monthly),
        bookingType: 'monthly',
        monthLabel: '30 Hari',
        // Data baru untuk 3 sesi
        sessions: sessions || [],
        isFullAccess: isFullAccess !== undefined ? isFullAccess : true,
        days_of_week: days_of_week || []
      }
    });
  };

  const formatIDR = (number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : null;

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

  const BookingWidgetContent = () => (
    <div className="flex flex-col h-full bg-[#111] md:bg-transparent">
      {/* Mode Selector Tabs */}
      <div className="flex border-b border-white/5 relative shrink-0 bg-[#0a0a0a]">
        {availableTypes.hourly && (
          <button
            onClick={() => setBookingMode('hourly')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all relative ${
              bookingMode === 'hourly' ? 'text-[#D4AF37]' : 'text-neutral-500 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Per Jam
            {bookingMode === 'hourly' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
            )}
          </button>
        )}
        {availableTypes.monthly && (
          <button
            onClick={() => setBookingMode('monthly')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all relative ${
              bookingMode === 'monthly' ? 'text-[#D4AF37]' : 'text-neutral-500 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            Bulanan
            {bookingMode === 'monthly' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
            )}
          </button>
        )}
      </div>

      <div className="p-6 flex-1 overflow-y-auto custom-scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={bookingMode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Show info badge if only one type is available */}
            {(availableTypes.hourly && !availableTypes.monthly) && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
                ✓ Sewa per jam tersedia untuk lapangan ini
              </div>
            )}
            {(availableTypes.monthly && !availableTypes.hourly) && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
                ✓ Sewa member bulanan tersedia untuk lapangan ini
              </div>
            )}

            {bookingMode === 'hourly' && availableTypes.hourly ? (
              /* ── HOURLY BOOKING WIDGET ── */
              <>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Tanggal Main</label>
                  <div className="relative group">
                    <Calendar className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getLocalDateString(new Date())}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Pilih Jam</label>
                    <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_5px_rgba(212,175,55,0.5)]"></span> Terpilih</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Peak</span>
                    </div>
                  </div>

                  {loadingAvailability ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                    </div>
                  ) : availability?.slots?.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scroll">
                      {availability.slots.map((slot, idx) => {
                        const now = new Date();
                        const isToday = selectedDate === getLocalDateString(now);
                        const slotHour = parseInt(slot.start_time.split(':')[0], 10);
                        const isPast = isToday && slotHour <= now.getHours();
                        const isActuallyAvailable = slot.is_available && !isPast;
                        const isSelected = selectedSlots.some(s => s.start_time === slot.start_time);
                        return (
                          <motion.button
                            key={idx}
                            whileHover={isActuallyAvailable ? { scale: 1.05 } : {}}
                            whileTap={isActuallyAvailable ? { scale: 0.95 } : {}}
                            disabled={!isActuallyAvailable}
                            onClick={() => toggleSlot(slot)}
                            className={`py-3 px-1 rounded-xl text-sm font-bold text-center transition-colors border ${
                              !isActuallyAvailable
                                ? 'bg-white/5 text-neutral-700 border-transparent cursor-not-allowed line-through'
                                : isSelected
                                  ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                  : slot.is_peak
                                    ? 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                                    : 'bg-[#1a1a1a] text-white border-white/10 hover:border-[#D4AF37]/50'
                            }`}
                          >
                            {slot.start_time.substring(0, 5)}
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center bg-[#1a1a1a] border border-white/5 rounded-2xl py-8">
                      <Clock className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-neutral-400">Jadwal tidak tersedia.</p>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-[#1a1a1a] to-black rounded-2xl p-5 mb-6 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-neutral-400 text-sm">Durasi Bermain:</span>
                    <span className="font-bold text-white text-sm bg-white/10 px-3 py-1 rounded-full">{selectedSlots.length} Jam</span>
                  </div>
                  <div className="h-px bg-white/5 my-3"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 text-sm">Total Bayar:</span>
                    <span className="font-black text-[#D4AF37] text-2xl tracking-tight">
                      {formatIDR(selectedSlots.reduce((sum, s) => sum + Number(s.price), 0))}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckoutHourly}
                  disabled={selectedSlots.length === 0}
                  className="w-full relative overflow-hidden bg-[#D4AF37] text-black font-black text-lg py-4 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                  <Zap className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Pesan Sekarang</span>
                  <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </>
            ) : bookingMode === 'monthly' && availableTypes.monthly ? (
              /* ── MONTHLY BOOKING WIDGET ── */
              selectedCourt ? (
                <>
                  {/* Info Card Member */}
                  <div className="bg-gradient-to-br from-[#D4AF37]/10 to-yellow-600/5 border border-[#D4AF37]/20 rounded-2xl p-5 mb-6 shadow-lg shadow-[#D4AF37]/5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center shrink-0">
                        <Crown className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-white mb-2">Keuntungan Member</p>
                        <ul className="text-sm text-neutral-400 space-y-2">
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" />Akses lapangan sesuai sesi</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" />Prioritas booking</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" />Harga lebih hemat</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* SESSION SELECTOR - 3 SESI */}
                  <MonthlySessionSelector 
                    selectedCourt={selectedCourt}
                    onCheckout={handleCheckoutMonthly}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    formatIDR={formatIDR}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-neutral-600 mx-auto mb-4 opacity-50" />
                  <p className="font-bold text-white">Pilih Lapangan Dahulu</p>
                  <p className="text-neutral-500 text-sm mt-1">Silakan pilih lapangan di panel sebelah kiri.</p>
                </div>
              )
            ) : (
              /* ── MODE NOT AVAILABLE ── */
              <div className="text-center py-16 px-4 bg-[#1a1a1a] rounded-3xl border border-white/5">
                <Info className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                <p className="text-white font-bold text-lg mb-2">Mode Sewa Tidak Tersedia</p>
                <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                  Admin GOR telah mengubah konfigurasi lapangan. Mode sewa ini tidak lagi tersedia untuk lapangan pilihan Anda.
                </p>
                {availableTypes.hourly && (
                  <button
                    onClick={() => setBookingMode('hourly')}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-full transition-colors"
                  >
                    Kembali ke Sewa Per Jam
                  </button>
                )}
                {availableTypes.monthly && (
                  <button
                    onClick={() => setBookingMode('monthly')}
                    className="inline-flex items-center gap-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] font-bold px-6 py-3 rounded-full transition-colors"
                  >
                    Kembali ke Member Bulanan
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans relative">
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>

      {/* Hero */}
      <div className="relative h-56 sm:h-80 md:h-[480px] bg-neutral-900 overflow-hidden">
        {venue.image_url ? (
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={venue.image_url} 
            alt={venue.name} 
            className="absolute inset-0 w-full h-full object-cover opacity-60" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-black">
            <MapPin className="w-24 h-24 text-neutral-800" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 left-4 sm:left-6 z-20">
          <Link to="/explore" className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors group">
            <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Hero Text — wrapper fills full width, content constrained inside */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 md:pb-14"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-[#D4AF37] text-black text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.4)]">Mitra GOR Resmi</span>
              {avgRating && (
                <div className="flex items-center gap-1.5 text-sm text-[#D4AF37] bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                  <Star className="w-4 h-4 fill-[#D4AF37]" />
                  <span className="font-bold">{avgRating}</span>
                  <span className="text-neutral-400">({testimonials.length} Ulasan)</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight leading-tight">{venue.name}</h1>
            <div className="inline-flex items-center gap-2 text-neutral-300 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
              <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <p className="text-sm md:text-base font-medium">{venue.address}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start relative z-20">

        {/* Left Col — shown first on mobile naturally */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 space-y-6 md:space-y-8 mb-24 lg:mb-0"
        >
          {/* Fasilitas */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#D4AF37]/5 blur-[60px] rounded-full pointer-events-none"></div>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-white relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
                <Info className="w-5 h-5 text-[#D4AF37]" />
              </div>
              Tentang GOR & Fasilitas
            </h2>
            <p className="text-neutral-400 text-base leading-relaxed mb-8 relative z-10">
              {venue.description || 'GOR Badminton premium dengan standar lapangan nasional. Dilengkapi dengan pencahayaan optimal, sirkulasi udara baik, dan fasilitas pendukung yang lengkap untuk kenyamanan bermain Anda.'}
            </p>
            <div className="flex flex-wrap gap-3 relative z-10">
              {['Parkir Luas', 'Kantin', 'Toilet Bersih', 'Mushola', 'Jual Kok', 'Ruang Ganti'].map((f, i) => (
                <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-neutral-300 hover:bg-white/10 transition-colors cursor-default">{f}</span>
              ))}
            </div>
          </motion.div>

          {/* Pilih Lapangan */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">Pilih Lapangan</h2>
                <p className="text-neutral-500 text-sm mt-0.5">Geser untuk melihat semua</p>
              </div>
              <span className="text-sm font-bold text-neutral-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">{venue.courts?.length || 0} Tersedia</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x -mx-4 px-4 md:mx-0 md:px-0 custom-scroll">
              {venue.courts?.length > 0 ? venue.courts.map((court) => {
                const isSelected = selectedCourt?.id === court.id;
                return (
                  <motion.button
                    key={court.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedCourt(court);
                      if (window.innerWidth < 1024) setShowMobileWidget(true);
                    }}
                    className={`snap-start flex-shrink-0 w-64 md:w-72 p-6 rounded-3xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#D4AF37]/20 to-black border-[#D4AF37]/50 shadow-[0_10px_30px_rgba(212,175,55,0.2)]'
                        : 'bg-[#111] border-white/10 hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/20 blur-[30px] rounded-full pointer-events-none"></div>
                    )}
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div>
                        <h3 className={`font-black text-xl mb-1 ${isSelected ? 'text-[#D4AF37]' : 'text-white'}`}>{court.name}</h3>
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{court.court_type || 'Karpet BWF'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4 relative z-10">
                      {court.rental_type === 'both' ? (
                        <>
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-lg">Per Jam</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-1 rounded-lg">Bulanan</span>
                        </>
                      ) : court.rental_type === 'hourly' ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-lg">Per Jam Saja</span>
                      ) : court.rental_type === 'monthly' ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-1 rounded-lg">Bulanan Saja</span>
                      ) : null}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3 relative z-10">
                      {(court.rental_type === 'hourly' || court.rental_type === 'both') && (
                        <div className="flex justify-between items-end">
                          <p className="text-xs text-neutral-400">Harga per jam</p>
                          <p className="text-base font-black text-white">{formatIDR(court.price_regular)}</p>
                        </div>
                      )}
                      {(court.rental_type === 'monthly' || court.rental_type === 'both') && (
                        <div className="flex justify-between items-end">
                          <p className="text-xs text-neutral-400 flex items-center gap-1"><Crown className="w-3 h-3 text-[#D4AF37]" /> Harga bulanan</p>
                          <p className="text-base font-black text-[#D4AF37]">
                            {court.price_monthly ? formatIDR(court.price_monthly) : '-'}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              }) : (
                <div className="w-full py-12 text-center bg-[#111] border border-white/5 rounded-3xl">
                  <p className="text-neutral-500 font-bold">Belum ada data lapangan.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Ulasan */}
          <motion.div variants={itemVariants} className="group relative bg-gradient-to-br from-[#111]/90 to-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#D4AF37]/10 transition-colors duration-700"></div>
            <h2 className="text-2xl sm:text-3xl font-black mb-6 flex items-center gap-4 text-white relative z-10 tracking-tight">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-transparent flex items-center justify-center border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Star className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]" />
              </div>
              Ulasan Pemain
            </h2>
            
            {testimonials.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scroll relative z-10">
                {testimonials.map((testim, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    key={testim.id} 
                    className="p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-full bg-neutral-800 border-2 border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                        {testim.user_profile_image ? (
                          <img src={testim.user_profile_image} alt={testim.user_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-black text-neutral-400 text-lg">{testim.user_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white">{testim.user_name}</p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < testim.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-neutral-800 fill-neutral-800'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-300 italic leading-relaxed">"{testim.content}"</p>
                    
                    {testim.admin_reply && (
                      <div className="mt-4 pt-4 border-t border-white/10 ml-6 relative">
                        <div className="absolute -left-6 top-6 w-4 h-px bg-white/10"></div>
                        <div className="absolute -left-6 top-4 w-px h-2 bg-white/10"></div>
                        <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2">
                          <Crown className="w-3 h-3" /> Balasan Pengelola GOR
                        </p>
                        <p className="text-sm text-neutral-400 bg-white/5 p-3 rounded-xl border border-white/5">"{testim.admin_reply}"</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-black/40 rounded-2xl border border-white/5">
                <MessageSquare className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-400 font-bold">Belum ada ulasan untuk GOR ini.</p>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Right Col: Booking Widget (Desktop only - Sticky) */}
        <div className="hidden lg:block lg:col-span-1 self-start sticky top-24">
          <div className="bg-[#111]/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-[calc(100vh-8rem)] flex flex-col">
            <BookingWidgetContent />
          </div>
        </div>

        {/* Mobile Booking Widget CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent lg:hidden z-40">
          <button 
            onClick={() => setShowMobileWidget(true)}
            className="w-full bg-[#D4AF37] text-black font-black text-lg py-4 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.4)] flex justify-center items-center gap-2"
          >
            Pesan Lapangan Sekarang
          </button>
        </div>

        {/* Mobile Booking Widget Slide-up */}
        <AnimatePresence>
          {showMobileWidget && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileWidget(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] lg:hidden"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[#111] border-t border-white/10 rounded-t-3xl z-[101] lg:hidden overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
              >
                <div className="flex justify-between items-center p-4 border-b border-white/5 shrink-0 bg-[#0a0a0a]">
                  <h3 className="font-black text-lg">Pesan Lapangan</h3>
                  <button onClick={() => setShowMobileWidget(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <BookingWidgetContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating Chat */}
        {user && user.role === 'customer' && (
          <FloatingChat />
        )}
      </div>
    </div>
  );
}
