import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loader2, CalendarCheck, MapPin, Clock, ArrowRight, ShieldCheck, Ticket, QrCode as QrCodeIcon, X, Star, MessageCircle, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import FloatingChat from '@/components/chat/FloatingChat';
import QRCode from 'react-qr-code';
import NotificationBell from '@/components/blocks/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyBookings() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [openChat, setOpenChat] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      // Tangani respon paginasi jika ada, atau array langsung
      setBookings(res.data?.data || res.data || []);
    } catch (error) {
      console.error("Gagal memuat jadwal saya", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const hasPending = bookings.some(b => b.status === 'pending');
    let intervalId;
    
    if (hasPending) {
      // Auto-refresh every 3 seconds if there is a pending booking
      intervalId = setInterval(fetchBookings, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [bookings]);

  const formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
        <p className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm animate-pulse">Memuat Jadwal...</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateX: 20 },
    visible: { opacity: 1, scale: 1, rotateX: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.8, rotateX: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4AF37] selection:text-black pb-20 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      <header className="h-16 sm:h-20 bg-black/50 backdrop-blur-xl border-b border-white/5 flex items-center px-4 sm:px-6 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img src="/Logo.svg" alt="Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-[#D4AF37] blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
            </div>
            <span className="font-black text-xl hidden sm:block tracking-tight">JogjaCourt</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/explore" className="text-sm font-bold text-neutral-400 hover:text-[#D4AF37] transition-colors hidden sm:block">
              Eksplor GOR
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/profile" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-900 border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
                  )}
                </div>
              </Link>
              <NotificationBell />
              <button onClick={logout} className="text-xs sm:text-sm font-bold bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-full hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-all">
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 tracking-tight">Halo, <span className="text-[#D4AF37]">{user?.name}!</span> 🏸</h1>
          <p className="text-neutral-400 text-lg">Berikut adalah jadwal mabar dan riwayat pemesanan Anda.</p>
        </motion.div>

        {bookings.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-[#111]/50 backdrop-blur-md border border-white/5 rounded-3xl"
          >
            <CalendarCheck className="w-20 h-20 text-neutral-600 mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold mb-3">Belum ada jadwal main</h2>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto text-base">
              Anda belum memesan lapangan apapun. Yuk cari GOR dan pesan jadwal main pertamamu sekarang!
            </p>
            <Link to="/explore" className="inline-block relative group overflow-hidden bg-[#D4AF37] text-black font-black px-10 py-4 rounded-full shadow-[0_0_30px_rgba(212,175,55,0.4)]">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative z-10">Cari Lapangan Sekarang</span>
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {bookings.map((booking) => {
              const bookingDateTime = new Date(booking.booking_date ? `${booking.booking_date}T${booking.end_time || booking.start_time}` : booking.start_time);
              const now = new Date();
              const isPast = bookingDateTime < now;

              let effectiveStatus = booking.status;
              if (effectiveStatus === 'confirmed' && isPast) {
                effectiveStatus = 'completed';
              } else if (effectiveStatus === 'pending' && isPast) {
                effectiveStatus = 'expired';
              }

              const isPaid = effectiveStatus === 'confirmed';
              const isPending = effectiveStatus === 'pending';
              const isCompleted = effectiveStatus === 'completed';
              const isFailed = effectiveStatus === 'cancelled' || effectiveStatus === 'expired';
              
              return (
                <motion.div 
                  variants={itemVariants}
                  key={booking.id} 
                  className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 sm:p-8 relative group hover:border-[#D4AF37]/30 hover:shadow-[0_15px_50px_rgba(212,175,55,0.15)] transition-all overflow-hidden flex flex-col"
                >
                  
                  {/* Subtle Premium Glow based on status */}
                  <div className={`absolute -top-20 -right-20 w-48 h-48 blur-[80px] rounded-full pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity ${
                    isPaid ? 'bg-emerald-500' : isCompleted ? 'bg-white/20' : isPending ? 'bg-[#D4AF37]' : 'bg-red-500'
                  }`}></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-md tracking-widest uppercase border flex items-center gap-1.5 ${
                          isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          isCompleted ? 'bg-white/5 text-neutral-300 border-white/10' : 
                          isPending ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {isPending && <Clock className="w-3 h-3 animate-pulse" />}
                          {isPaid ? 'LUNAS (CONFIRMED)' : isCompleted ? 'SELESAI MAIN' : isPending ? 'MENUNGGU PEMBAYARAN' : 'BATAL / EXPIRED'}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">ID: {booking.id.substring(0,8)}</span>
                      </div>
                      
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight tracking-tight drop-shadow-sm">{booking.court?.venue?.name}</h3>
                      <p className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#D4AF37]" /> 
                        {booking.court?.name} {booking.court?.court_type ? `• ${booking.court.court_type}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/40 p-5 rounded-[1.5rem] border border-white/5 relative z-10 flex flex-col gap-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                          <CalendarCheck className="w-4 h-4 text-neutral-300" />
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-0.5">Tanggal</p>
                          <p className="font-bold text-sm text-white">
                            {booking.booking_type === 'monthly' && booking.end_date ? (
                              `${new Date(booking.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${new Date(booking.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                            ) : (
                              new Date(booking.booking_date || booking.start_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-px bg-white/5 w-full"></div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                          <Clock className="w-4 h-4 text-neutral-300" />
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-0.5">Waktu / Sesi</p>
                          <p className="font-black text-base text-[#D4AF37]">
                            {new Date(booking.booking_date ? booking.booking_date + 'T' + booking.start_time : booking.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 flex flex-col gap-5 relative z-10">
                    <div className="flex justify-between items-end px-2">
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">Total Tagihan</p>
                        <p className="font-black text-2xl text-white tracking-tight">{formatIDR(booking.total_price)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 w-full">
                      {isPaid && (
                        <button 
                          onClick={() => setSelectedTicket(booking)}
                          className="col-span-2 flex items-center justify-center gap-2 text-sm font-black bg-[#D4AF37]/10 text-[#D4AF37] py-3.5 rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.15)] group/btn"
                        >
                          <Ticket className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" /> Tampilkan E-Tiket VIP
                        </button>
                      )}

                      {isPending && (
                        <>
                          <button 
                            onClick={() => setOpenChat(true)}
                            className="bg-white/5 text-neutral-300 font-bold text-xs py-3.5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/10"
                          >
                            <MessageCircle className="w-4 h-4" /> Bantuan
                          </button>
                          <Link 
                            to={`/payment/${booking.id}`} 
                            state={{ booking, venue: booking.court?.venue, court: booking.court, totalPrice: booking.total_price }}
                            className="bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black text-center font-black text-xs py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2"
                          >
                            BAYAR SEKARANG <ArrowRight className="w-4 h-4" />
                          </Link>
                        </>
                      )}

                      {isCompleted && !booking.review && (
                        <>
                          <button 
                            onClick={() => setOpenChat(true)}
                            className="bg-white/5 text-neutral-300 font-bold text-xs py-3.5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/10"
                          >
                            Bantuan
                          </button>
                          <button 
                            onClick={() => setReviewModal(booking)}
                            className="bg-[#D4AF37] text-black font-black text-xs py-3.5 rounded-xl hover:bg-yellow-500 transition-colors shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2"
                          >
                            <Star className="w-4 h-4" /> Beri Ulasan
                          </button>
                        </>
                      )}

                      {isFailed && (
                         <button 
                         onClick={() => setOpenChat(true)}
                         className="col-span-2 bg-white/5 text-neutral-400 font-bold text-xs py-3.5 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/10"
                       >
                         <MessageCircle className="w-4 h-4" /> Hubungi Customer Service
                       </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* Holographic E-Ticket Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ perspective: '1000px' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-sm relative z-10"
            >
              {/* Floating Ticket Container */}
              <div className="bg-[#111] rounded-[2rem] border border-white/20 relative overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.8)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:z-0">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="absolute top-5 right-5 text-neutral-300 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-md z-20 transition-transform hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="bg-gradient-to-br from-[#D4AF37] to-yellow-600 h-40 flex items-center justify-center relative z-10 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                   <div className="absolute top-6 left-6">
                     <h2 className="text-black font-black text-3xl tracking-tight drop-shadow-md">JogjaCourt</h2>
                     <p className="text-black/80 font-black text-xs uppercase tracking-widest mt-1">E-Ticket VIP</p>
                   </div>
                   <Ticket className="absolute -bottom-8 -right-8 w-40 h-40 text-white/20 -rotate-12" />
                </div>

                {/* Stub cutouts */}
                <div className="absolute left-0 -ml-5 top-40 w-10 h-10 bg-black rounded-full border-r border-white/20 shadow-inner z-20"></div>
                <div className="absolute right-0 -mr-5 top-40 w-10 h-10 bg-black rounded-full border-l border-white/20 shadow-inner z-20"></div>
                <div className="absolute left-8 right-8 top-40 h-[2px] border-t-2 border-dashed border-black/30 z-20"></div>

                <div className="p-8 pt-12 relative z-10">
                  <div className="flex justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-[#D4AF37] blur-[30px] opacity-20 rounded-full"></div>
                    <div className="bg-white p-4 rounded-3xl shadow-xl relative z-10 border-4 border-white/10">
                      <QRCode
                        value={selectedTicket.id}
                        size={160}
                        level={"H"}
                        fgColor="#000000"
                        bgColor="#ffffff"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center mb-8">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1">ID Booking</p>
                    <p className="font-mono font-black text-2xl tracking-widest text-[#D4AF37]">{selectedTicket.id.split('-')[0].toUpperCase()}</p>
                  </div>

                  <div className="bg-black/50 border border-white/5 rounded-2xl p-5 space-y-4">
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Lokasi</p>
                      <p className="font-black text-white text-lg leading-tight">{selectedTicket.court?.venue?.name}</p>
                      <p className="text-sm text-neutral-400">{selectedTicket.court?.name}</p>
                    </div>
                    <div className="h-px bg-white/10"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Tanggal</p>
                        <p className="font-bold text-sm text-white">
                          {selectedTicket.booking_type === 'monthly' && selectedTicket.end_date ? (
                            `${new Date(selectedTicket.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d ${new Date(selectedTicket.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          ) : (
                            new Date(selectedTicket.booking_date + 'T' + selectedTicket.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Waktu</p>
                        <p className="font-black text-sm text-[#D4AF37]">
                          {new Date(selectedTicket.booking_date + 'T' + selectedTicket.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal with Spring Animation */}
      <AnimatePresence>
        {reviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#111] max-w-md w-full rounded-3xl border border-white/10 relative p-6 md:p-8 shadow-2xl z-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/10 blur-[50px] rounded-full pointer-events-none"></div>
              
              <button 
                onClick={() => setReviewModal(null)}
                className="absolute top-5 right-5 text-neutral-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-5">
                <Star className="w-6 h-6 text-[#D4AF37]" />
              </div>

              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Beri Ulasan</h2>
              <p className="text-sm text-neutral-400 mb-8 leading-relaxed">Bagaimana pengalaman bermain Anda di <strong className="text-white">{reviewModal.court?.venue?.name}</strong>?</p>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setSubmittingReview(true);
                  await api.post('/testimonials/', {
                    ...reviewForm,
                    venue_id: reviewModal.court?.venue?.id
                  });
                  alert('Terima kasih! Ulasan Anda telah berhasil dipublikasikan secara langsung.');
                  setReviewModal(null);
                  setReviewForm({ rating: 5, content: '' });
                } catch (err) {
                  console.error(err);
                  alert(err.response?.data?.detail || 'Gagal mengirim ulasan');
                } finally {
                  setSubmittingReview(false);
                }
              }}>
                <div className="mb-8">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Rating (1-5)</label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star className={`w-10 h-10 ${reviewForm.rating >= star ? 'fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'text-neutral-700'}`} />
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Komentar</label>
                  <textarea
                    required
                    rows="4"
                    minLength={5}
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                    placeholder="Ceritakan pengalaman Anda (minimal 5 karakter)..."
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all resize-none font-medium"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-[#D4AF37] text-black font-black text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                >
                  {submittingReview ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Mengirim...</>
                  ) : 'Kirim Ulasan Sekarang'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Chat Component */}
      {(openChat || bookings.length > 0) && (
        <FloatingChat forceOpen={openChat} />
      )}
    </div>
  );
}
