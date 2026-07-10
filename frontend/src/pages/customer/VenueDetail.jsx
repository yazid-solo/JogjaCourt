import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import {
  Loader2, MapPin, Calendar, Clock, ArrowLeft, Star, Info,
  ChevronRight, Check, Crown, Zap, CalendarRange
} from 'lucide-react';
import FloatingChat from '@/components/chat/FloatingChat';

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
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);

  // Booking mode: 'hourly' | 'monthly'
  const [bookingMode, setBookingMode] = useState('hourly');

  // Hourly state
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);

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
    const fetchVenueAndCourts = async () => {
      try {
        const [resVenue, resCourts] = await Promise.all([
          api.get(`/venues/${id}`),
          api.get(`/courts?venue_id=${id}`)
        ]);
        const venueData = { ...resVenue.data, courts: resCourts.data };
        setVenue(venueData);
        if (resCourts.data?.length > 0) {
          // If no court selected, select first one
          if (!selectedCourt || !resCourts.data.find(c => c.id === selectedCourt.id)) {
            setSelectedCourt(resCourts.data[0]);
          } else {
            // Update selected court with fresh data to get updated rental_type
            const updatedCourt = resCourts.data.find(c => c.id === selectedCourt.id);
            if (updatedCourt) {
              setSelectedCourt(updatedCourt);
            }
          }
        }
      } catch (error) {
        console.error('Gagal memuat detail GOR', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenueAndCourts();

    // Real-time update: Refresh court data every 15 seconds to detect admin changes
    const intervalId = setInterval(fetchVenueAndCourts, 15000);
    
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
  }, [selectedCourt, selectedDate, bookingMode]);

  // Reset slot saat ganti mode atau lapangan
  useEffect(() => {
    setSelectedSlots([]);
  }, [bookingMode, selectedCourt]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">GOR Tidak Ditemukan</h1>
        <Link to="/explore" className="text-[#D4AF37] hover:underline">Kembali ke Eksplor</Link>
      </div>
    );
  }

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

  const handleCheckoutMonthly = () => {
    if (!selectedCourt || !selectedMonth) return;
    if (!selectedCourt.price_monthly) {
      alert('Sewa bulanan tidak tersedia untuk lapangan ini. Admin belum mengatur harga bulanan.');
      return;
    }
    const monthOpt = monthOptions.find(m => m.value === selectedMonth);
    navigate('/checkout', {
      state: {
        venue,
        court: selectedCourt,
        date: monthOpt.firstDay,
        slots: [{
          start_time: '08:00:00',
          end_time: '23:00:00',
          price: Number(selectedCourt.price_monthly)
        }],
        totalPrice: Number(selectedCourt.price_monthly),
        bookingType: 'monthly',
        monthLabel: monthOpt.label
      }
    });
  };

  const formatIDR = (number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : null;

  const selectedMonthOption = monthOptions.find(m => m.value === selectedMonth);

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">

      {/* Hero */}
      <div className="relative h-64 md:h-[420px] bg-neutral-900">
        {venue.image_url ? (
          <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-900">
            <MapPin className="w-20 h-20 text-neutral-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <div className="absolute top-6 left-6">
          <Link to="/explore" className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">Mitra GOR</span>
            {avgRating && (
              <div className="flex items-center gap-1 text-sm text-[#D4AF37] bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                <Star className="w-4 h-4 fill-[#D4AF37]" />
                <span className="font-bold">{avgRating}</span>
                <span className="text-neutral-400">({testimonials.length})</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2">{venue.name}</h1>
          <div className="flex items-center gap-2 text-neutral-300">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <p className="text-sm md:text-base">{venue.address}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col */}
        <div className="lg:col-span-2 space-y-8">

          {/* Fasilitas */}
          <div className="bg-[#111] border border-white/5 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-[#D4AF37]" />
              Fasilitas GOR
            </h2>
            <div className="flex flex-wrap gap-2">
              {['Parkir Luas', 'Kantin', 'Toilet Bersih', 'Mushola', 'Jual Kok'].map((f, i) => (
                <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-neutral-300">{f}</span>
              ))}
            </div>
            <p className="mt-6 text-neutral-400 text-sm leading-relaxed">
              {venue.description || 'GOR Badminton terbaik dengan lantai karpet standar BWF dan pencahayaan yang terang namun tidak menyilaukan.'}
            </p>
          </div>

          {/* Pilih Lapangan */}
          <div>
            <h2 className="text-xl font-bold mb-4">Pilih Lapangan</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {venue.courts?.length > 0 ? venue.courts.map((court) => {
                const hasMonthly = !!court.price_monthly;
                const isSelected = selectedCourt?.id === court.id;
                return (
                  <button
                    key={court.id}
                    onClick={() => setSelectedCourt(court)}
                    className={`snap-start flex-shrink-0 w-52 p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                        : 'bg-[#111] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-bold ${isSelected ? 'text-[#D4AF37]' : 'text-white'}`}>{court.name}</h3>
                        <p className="text-xs text-neutral-500 mt-1 capitalize">{court.court_type || 'Karpet BWF'}</p>
                      </div>
                      {/* Rental Type Badge */}
                      <div className="flex gap-1">
                        {court.rental_type === 'both' ? (
                          <>
                            <span className="text-[9px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded whitespace-nowrap">Jam</span>
                            <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded whitespace-nowrap">Bulan</span>
                          </>
                        ) : court.rental_type === 'hourly' ? (
                          <span className="text-[9px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded whitespace-nowrap">Per Jam</span>
                        ) : court.rental_type === 'monthly' ? (
                          <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded whitespace-nowrap">Bulanan</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                      {(court.rental_type === 'hourly' || court.rental_type === 'both') && (
                        <div>
                          <p className="text-[10px] text-neutral-500 uppercase">Per Jam</p>
                          <p className="text-sm font-bold text-white">{formatIDR(court.price_regular)}<span className="text-xs font-normal text-neutral-500">/jam</span></p>
                        </div>
                      )}
                      {(court.rental_type === 'monthly' || court.rental_type === 'both') && (
                        <div className="flex items-center gap-1">
                          <Crown className="w-3 h-3 text-[#D4AF37]" />
                          <div>
                            <p className="text-[10px] text-[#D4AF37] uppercase font-bold">Member/Bulan</p>
                            <p className="text-sm font-bold text-[#D4AF37]">
                              {court.price_monthly ? (
                                <>{formatIDR(court.price_monthly)}<span className="text-xs font-normal text-neutral-500">/bln</span></>
                              ) : (
                                <span className="text-xs text-neutral-600">Tidak tersedia</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      {court.rental_type === 'hourly' && (
                        <p className="text-[10px] text-neutral-600 italic">Sewa bulanan tidak tersedia</p>
                      )}
                    </div>
                  </button>
                );
              }) : (
                <p className="text-neutral-500">Belum ada data lapangan.</p>
              )}
            </div>
          </div>

          {/* Ulasan */}
          <div className="bg-[#111] border border-white/5 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
              Ulasan Pelanggan
            </h2>
            {testimonials.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {testimonials.map(testim => (
                  <div key={testim.id} className="p-4 bg-black/40 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {testim.user_profile_image ? (
                          <img src={testim.user_profile_image} alt={testim.user_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-neutral-400">{testim.user_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{testim.user_name}</p>
                        <div className="flex gap-0.5 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < testim.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-neutral-800 fill-neutral-800'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-300 italic">"{testim.content}"</p>
                    {testim.admin_reply && (
                      <div className="mt-3 pt-3 border-t border-white/10 ml-4">
                        <p className="text-[10px] text-[#D4AF37] font-bold uppercase mb-1">Balasan GOR:</p>
                        <p className="text-xs text-neutral-400">"{testim.admin_reply}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">Belum ada ulasan untuk GOR ini.</p>
            )}
          </div>
        </div>

        {/* Right Col: Booking Widget */}
        <div className="lg:col-span-1">
          <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden sticky top-6">

            {/* Mode Selector Tabs */}
            <div className="flex border-b border-white/5">
              {availableTypes.hourly && (
                <button
                  onClick={() => setBookingMode('hourly')}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                    bookingMode === 'hourly'
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-b-2 border-[#D4AF37]'
                      : 'text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Per Jam
                </button>
              )}
              {availableTypes.monthly && (
                <button
                  onClick={() => setBookingMode('monthly')}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                    bookingMode === 'monthly'
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-b-2 border-[#D4AF37]'
                      : 'text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  Member Bulanan
                </button>
              )}
            </div>

            <div className="p-6">
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
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Tanggal Main</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={getLocalDateString(new Date())}
                        className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pilih Jam</label>
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] inline-block" /> Terpilih
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500/50 inline-block ml-2" /> Peak
                      </div>
                    </div>

                    {loadingAvailability ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                      </div>
                    ) : availability?.slots?.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
                        {availability.slots.map((slot, idx) => {
                          const now = new Date();
                          const isToday = selectedDate === getLocalDateString(now);
                          const slotHour = parseInt(slot.start_time.split(':')[0], 10);
                          const isPast = isToday && slotHour <= now.getHours();
                          const isActuallyAvailable = slot.is_available && !isPast;
                          const isSelected = selectedSlots.some(s => s.start_time === slot.start_time);
                          return (
                            <button
                              key={idx}
                              disabled={!isActuallyAvailable}
                              onClick={() => toggleSlot(slot)}
                              className={`py-2.5 px-1 rounded-lg text-xs font-bold text-center transition-all border ${
                                !isActuallyAvailable
                                  ? 'bg-white/5 text-neutral-700 border-transparent cursor-not-allowed line-through'
                                  : isSelected
                                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)] scale-105'
                                    : slot.is_peak
                                      ? 'bg-orange-500/10 text-orange-300 border-orange-500/20 hover:bg-orange-500/20'
                                      : 'bg-black/50 text-neutral-200 border-white/10 hover:border-[#D4AF37]/50 hover:text-white'
                              }`}
                            >
                              {slot.start_time.substring(0, 5)}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-neutral-500 py-4">Jadwal tidak tersedia.</p>
                    )}
                  </div>

                  <div className="bg-black/50 rounded-xl p-4 mb-5 border border-white/5">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-neutral-400">Slot dipilih:</span>
                      <span className="font-bold text-white">{selectedSlots.length} Jam</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Total Harga:</span>
                      <span className="font-bold text-[#D4AF37] text-lg">
                        {formatIDR(selectedSlots.reduce((sum, s) => sum + Number(s.price), 0))}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckoutHourly}
                    disabled={selectedSlots.length === 0}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-bold py-3.5 rounded-xl hover:to-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                  >
                    <Zap className="w-5 h-5" />
                    Pesan Sekarang
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              ) : bookingMode === 'monthly' && availableTypes.monthly ? (
                /* ── MONTHLY BOOKING WIDGET ── */
                <>
                  {/* Info Card Member */}
                  <div className="bg-gradient-to-br from-[#D4AF37]/10 to-yellow-600/5 border border-[#D4AF37]/20 rounded-xl p-4 mb-5">
                    <div className="flex items-start gap-3">
                      <Crown className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-[#D4AF37]">Keuntungan Member Bulanan</p>
                        <ul className="text-xs text-neutral-400 mt-2 space-y-1">
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" />Akses lapangan seharian (08:00–23:00)</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" />Prioritas booking setiap hari</li>
                          <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" />Harga lebih hemat dari per jam</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Pilih Bulan */}
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Pilih Bulan Sewa</label>
                    <div className="relative">
                      <CalendarRange className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 z-10" />
                      <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none cursor-pointer"
                      >
                        {monthOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Ringkasan Harga */}
                  {selectedCourt ? (
                    selectedCourt.price_monthly ? (
                      <>
                        <div className="bg-black/50 rounded-xl p-4 mb-5 border border-white/5 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-400">Lapangan:</span>
                            <span className="font-bold text-white">{selectedCourt.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-400">Periode:</span>
                            <span className="font-bold text-white">{selectedMonthOption?.label}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-400">Akses Harian:</span>
                            <span className="font-bold text-emerald-400">08:00 – 23:00 WIB</span>
                          </div>
                          <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                            <span className="text-neutral-400 text-sm">Total Pembayaran:</span>
                            <span className="font-bold text-[#D4AF37] text-xl">{formatIDR(selectedCourt.price_monthly)}</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 text-center">* Harga flat untuk satu bulan penuh</p>
                        </div>

                        <button
                          onClick={handleCheckoutMonthly}
                          className="w-full bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-bold py-3.5 rounded-xl hover:to-yellow-400 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                        >
                          <Crown className="w-5 h-5" />
                          Daftar Member {selectedMonthOption?.label}
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-8 px-4">
                        <Crown className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-400 font-bold text-sm mb-1">Sewa Bulanan Tidak Tersedia</p>
                        <p className="text-neutral-600 text-xs">Admin GOR belum mengaktifkan paket member untuk lapangan ini. Silakan pilih lapangan lain atau gunakan sewa per jam.</p>
                      </div>
                    )
                  ) : (
                    <p className="text-center text-neutral-500 text-sm py-8">Pilih lapangan terlebih dahulu.</p>
                  )}
                </>
              ) : (
                /* ── MODE NOT AVAILABLE ── */
                <div className="text-center py-12 px-4">
                  <Info className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-400 font-bold text-sm mb-2">Mode Sewa Tidak Tersedia</p>
                  <p className="text-neutral-600 text-xs mb-5">
                    Admin GOR telah mengubah konfigurasi lapangan. Mode sewa ini tidak lagi tersedia untuk lapangan pilihan Anda.
                  </p>
                  {availableTypes.hourly && (
                    <button
                      onClick={() => setBookingMode('hourly')}
                      className="text-[#D4AF37] text-xs font-bold hover:underline"
                    >
                      ← Kembali ke Sewa Per Jam
                    </button>
                  )}
                  {availableTypes.monthly && (
                    <button
                      onClick={() => setBookingMode('monthly')}
                      className="text-[#D4AF37] text-xs font-bold hover:underline"
                    >
                      ← Kembali ke Member Bulanan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Chat */}
        {venue.owner_id && (
          <FloatingChat adminId={venue.owner_id} adminName={`Admin ${venue.name}`} />
        )}
      </div>
    </div>
  );
}
