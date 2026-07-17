import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';
import { Star, Quote, User, PenSquare, X, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const TestimonialCard = ({ testimonial }) => {
  return (
    <div className="bg-[#111] border border-white/10 p-5 rounded-xl w-[280px] sm:w-[320px] flex-shrink-0 mx-3 flex flex-col">
      <div className="flex text-[#D4AF37] mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'fill-current' : 'text-neutral-700'}`} />
        ))}
      </div>
      <p className="text-neutral-300 italic mb-4 text-sm leading-relaxed flex-grow">"{testimonial.content}"</p>
      
      {testimonial.admin_reply && (
        <div className="bg-black/30 border-l-2 border-[#D4AF37] rounded-r-lg p-3 mb-4 relative">
          <div className="flex items-center gap-1.5 mb-1.5">
            <User className="w-3 h-3 text-[#D4AF37]" />
            <p className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider">Admin</p>
          </div>
          <p className="text-xs text-neutral-400 italic">"{testimonial.admin_reply}"</p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          {testimonial.user_profile_image ? (
            <img src={testimonial.user_profile_image} alt={testimonial.user_name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-neutral-400" />
          )}
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">{testimonial.user_name || 'Pengguna Anonim'}</h4>
          <p className="text-xs text-neutral-500">
            Pelanggan JogjaCourt
          </p>
        </div>
      </div>
    </div>
  );
};

export function TestimonialCarousel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [submitting, setSubmitting] = useState(false);
  
  // Animation state
  const baseX = useRef(0);
  const containerRef = useRef(null);

  const fetchTestimonials = async () => {
    try {
      const res = await api.get('/testimonials/public');
      setTestimonials(res.data);
    } catch (err) {
      console.error("Gagal memuat testimoni:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleWriteReview = () => {
    if (!user) {
      // Jika belum login, arahkan ke halaman login
      navigate('/login?redirect=/');
      return;
    }
    setIsModalOpen(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/testimonials/', reviewForm);
      alert('Terima kasih! Ulasan Anda telah berhasil dipublikasikan.');
      setIsModalOpen(false);
      setReviewForm({ rating: 5, content: '' });
      // Reload testimonials
      fetchTestimonials();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Gagal mengirim ulasan');
    } finally {
      setSubmitting(false);
    }
  };

  useAnimationFrame((time, delta) => {
    if (!containerRef.current || testimonials.length < 3) return;
    
    // Kecepatan geser
    const moveBy = 0.5 * (delta / 16); 
    baseX.current -= moveBy;
    
    // Reset loop jika sudah mentok ujung
    // Estimasi lebar 1 kartu + margin adalah sekitar 432px
    const cardWidth = 432;
    if (Math.abs(baseX.current) >= cardWidth * testimonials.length) {
      baseX.current = 0;
    }
    
    containerRef.current.style.transform = `translateX(${baseX.current}px)`;
  });

  if (loading) {
    return (
      <div className="w-full py-20 flex justify-center">
        <div className="animate-pulse flex gap-4">
          <div className="w-[400px] h-[200px] bg-[#111] rounded-2xl"></div>
          <div className="w-[400px] h-[200px] bg-[#111] rounded-2xl hidden md:block"></div>
          <div className="w-[400px] h-[200px] bg-[#111] rounded-2xl hidden lg:block"></div>
        </div>
      </div>
    );
  }

  if (testimonials.length === 0) return null;

  // Duplikasi data agar efek infinity scroll mulus
  const displayTestimonials = testimonials.length >= 3 
    ? [...testimonials, ...testimonials, ...testimonials] 
    : testimonials;

  return (
    <section className="py-24 bg-black overflow-hidden relative">
      {/* Decorative gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 mb-16 relative z-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Kepercayaan <span className="text-[#D4AF37]">Komunitas</span>
          </h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            Bergabung dengan ribuan atlet dan pegiat olahraga di Yogyakarta yang telah mengandalkan infrastruktur reservasi kami untuk setiap pertandingan mereka.
          </p>
          <button 
            onClick={handleWriteReview}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-full transition-all border border-white/10 hover:border-white/30"
          >
            <PenSquare className="w-4 h-4" />
            Bagikan Pengalaman Anda
          </button>
        </div>
      </div>

      <div className="relative w-full flex overflow-hidden group">
        {/* Left/Right Fading Edges */}
        <div className="absolute left-0 top-0 w-12 sm:w-32 h-full bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 w-12 sm:w-32 h-full bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        
        <div 
          ref={testimonials.length >= 3 ? containerRef : null}
          className={`flex ${testimonials.length < 3 ? 'justify-center w-full' : ''}`}
        >
          {displayTestimonials.map((t, idx) => (
            <TestimonialCard key={`${t.id}-${idx}`} testimonial={t} />
          ))}
        </div>
      </div>

      {/* Write Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#111] max-w-md w-full rounded-2xl sm:rounded-3xl border border-white/10 relative p-5 sm:p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">Tulis Ulasan</h2>
            <p className="text-sm text-neutral-400 mb-6">Bagaimana pengalaman Anda menggunakan aplikasi JogjaCourt sejauh ini?</p>

            <form onSubmit={submitReview}>
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
                <label className="block text-sm font-medium text-neutral-400 mb-2">Komentar & Kesan</label>
                <textarea
                  required
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  placeholder="Ceritakan pengalaman Anda..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] min-h-[120px]"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting || !reviewForm.content.trim()}
                className="w-full bg-[#D4AF37] text-black font-bold py-3.5 rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
