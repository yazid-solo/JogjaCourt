import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loader2, CalendarCheck, MapPin, Clock, ArrowRight, ShieldCheck, Ticket, QrCode as QrCodeIcon, X, Star, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import FloatingChat from '@/components/chat/FloatingChat';
import QRCode from 'react-qr-code';
import NotificationBell from '@/components/blocks/NotificationBell';

export default function MyBookings() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeChatAdmin, setActiveChatAdmin] = useState(null); // { id, name }

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      
      <header className="h-20 bg-[#111] border-b border-white/5 flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-xl hidden sm:block">JogjaCourt</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/explore" className="text-sm font-medium hover:text-[#D4AF37] transition-colors">
              Eksplor GOR
            </Link>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <button onClick={logout} className="text-sm font-bold bg-white/10 text-white px-4 py-2 rounded-full hover:bg-white/20 transition-colors">
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black mb-2">Halo, {user?.name}! 🏸</h1>
          <p className="text-neutral-400">Berikut adalah jadwal mabar dan riwayat pemesanan Anda.</p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-24 bg-[#111] border border-white/5 rounded-3xl">
            <CalendarCheck className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Belum ada jadwal main</h2>
            <p className="text-neutral-500 mb-8 max-w-md mx-auto">
              Anda belum memesan lapangan apapun. Yuk cari GOR dan pesan jadwal main pertamamu sekarang!
            </p>
            <Link to="/explore" className="inline-block bg-[#D4AF37] text-black font-bold px-8 py-3 rounded-full hover:bg-yellow-500 transition-colors">
              Cari Lapangan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div key={booking.id} className="bg-[#111] border border-white/10 rounded-2xl p-6 relative group hover:border-white/30 transition-all">
                  
                  {/* Tiket Stub effect */}
                  <div className="absolute -left-3 top-24 w-6 h-6 bg-black rounded-full border-r border-white/10"></div>
                  <div className="absolute -right-3 top-24 w-6 h-6 bg-black rounded-full border-l border-white/10"></div>
                  <div className="absolute left-6 right-6 top-27 h-[1px] border-t-2 border-dashed border-white/10"></div>

                  <div className="flex justify-between items-start mb-6 pb-6">
                    <div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block ${
                        isPaid ? 'bg-emerald-500/10 text-emerald-500' : isCompleted ? 'bg-blue-500/10 text-blue-500' : isPending ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {isPaid ? 'LUNAS (CONFIRMED)' : isCompleted ? 'SELESAI MAIN' : isPending ? 'MENUNGGU PEMBAYARAN' : 'BATAL / EXPIRED'}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-1">{booking.court?.venue?.name}</h3>
                      <p className="text-sm text-neutral-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> 
                        {booking.court?.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <CalendarCheck className="w-5 h-5 text-blue-500" />
                        </div>
                          <div>
                            <p className="text-xs text-neutral-500">Tanggal</p>
                            <p className="font-bold text-sm">
                              {new Date(booking.booking_date || booking.start_time).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-neutral-500">Jam</p>
                            <p className="font-bold text-sm text-[#D4AF37]">
                              {new Date(booking.booking_date ? booking.booking_date + 'T' + booking.start_time : booking.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-[#D4AF37]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-0.5">Total Bayar</p>
                        <p className="font-bold">{formatIDR(booking.total_price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPaid && (
                          <button 
                            onClick={() => setSelectedTicket(booking)}
                            className="flex items-center gap-2 text-sm font-bold text-[#D4AF37] hover:text-white transition-colors"
                          >
                            <Ticket className="w-4 h-4" /> E-Tiket
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      {isCompleted && !booking.review && (
                        <button 
                          onClick={() => setReviewModal(booking)}
                          className="bg-[#D4AF37] text-black font-bold text-xs px-4 py-2 rounded-full hover:bg-yellow-500 transition-colors"
                        >
                          Beri Ulasan
                        </button>
                      )}
                      {booking.court?.venue?.owner_id && (
                        <button 
                          onClick={() => setActiveChatAdmin({
                            id: booking.court.venue.owner_id,
                            name: `Admin ${booking.court.venue.name}`
                          })}
                          className="bg-blue-500/10 text-blue-400 font-bold text-xs px-4 py-2 rounded-full hover:bg-blue-500/20 transition-colors flex items-center gap-1 border border-blue-500/20"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Chat GOR
                        </button>
                      )}
                      {isPending && (
                        <Link 
                          to={`/payment/${booking.id}`} 
                          state={{ booking, venue: booking.court?.venue, court: booking.court, totalPrice: booking.total_price }}
                          className="bg-white text-black font-bold text-xs px-4 py-2 rounded-full hover:bg-neutral-200 transition-colors"
                        >
                          Bayar Sekarang
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* E-Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] max-w-sm w-full rounded-3xl border border-white/10 relative overflow-hidden">
            <button 
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-md z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="bg-[#D4AF37] h-32 flex items-center justify-center relative">
               <div className="absolute top-6 left-6">
                 <h2 className="text-black font-black text-2xl">JogjaCourt</h2>
                 <p className="text-black/70 font-bold text-xs uppercase tracking-widest">E-Ticket</p>
               </div>
            </div>

            {/* Stub cutouts */}
            <div className="absolute left-0 -ml-4 top-32 w-8 h-8 bg-black/80 rounded-full"></div>
            <div className="absolute right-0 -mr-4 top-32 w-8 h-8 bg-black/80 rounded-full"></div>
            <div className="absolute left-6 right-6 top-32 h-[1px] border-t border-dashed border-black/20"></div>

            <div className="p-8 pt-10">
              <div className="flex justify-center mb-6">
                <div className="bg-white p-3 rounded-2xl">
                  <QRCode
                    value={selectedTicket.id}
                    size={150}
                    level={"H"}
                  />
                </div>
              </div>
              
              <div className="text-center mb-8">
                <p className="text-sm text-neutral-400 mb-1">ID Booking</p>
                <p className="font-mono font-bold tracking-widest">{selectedTicket.id.split('-')[0].toUpperCase()}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-500 uppercase">Lokasi</p>
                  <p className="font-bold">{selectedTicket.court?.venue?.name}</p>
                  <p className="text-sm text-neutral-400">{selectedTicket.court?.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase">Tanggal</p>
                    <p className="font-bold">
                      {new Date(selectedTicket.booking_date + 'T' + selectedTicket.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase">Waktu</p>
                    <p className="font-bold text-[#D4AF37]">
                      {new Date(selectedTicket.booking_date + 'T' + selectedTicket.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] max-w-md w-full rounded-3xl border border-white/10 relative p-6 md:p-8">
            <button 
              onClick={() => setReviewModal(null)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">Beri Ulasan</h2>
            <p className="text-sm text-neutral-400 mb-6">Bagaimana pengalaman bermain Anda di {reviewModal.court?.venue?.name}?</p>

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
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-400 mb-3">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star className={`w-8 h-8 ${reviewForm.rating >= star ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-neutral-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Komentar</label>
                <textarea
                  required
                  rows="4"
                  minLength={5}
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  placeholder="Ceritakan pengalaman Anda (minimal 5 karakter)..."
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Chat Component */}
      {activeChatAdmin && (
        <FloatingChat 
          key={activeChatAdmin.id} // force remount if admin changes
          adminId={activeChatAdmin.id} 
          adminName={activeChatAdmin.name} 
          forceOpen={true}
        />
      )}
    </div>
  );
}
