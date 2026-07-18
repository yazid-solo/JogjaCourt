import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Loader2, Search, MapPin, ChevronRight, Star, Activity, Trophy, Building2, Map, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const REGIONS = [
  { 
    id: 'semua', 
    name: 'Semua Wilayah DIY', 
    desc: 'Jelajahi seluruh GOR yang tersebar di pelosok Daerah Istimewa Yogyakarta.', 
    icon: Map,
    image: '/regions/diy.png',
    border: 'border-[#D4AF37]/50'
  },
  { 
    id: 'sleman', 
    name: 'Kab. Sleman', 
    desc: 'Kawasan utara dengan banyak GOR berfasilitas modern dan standar turnamen.', 
    icon: Building2,
    image: '/regions/sleman.png',
    border: 'border-blue-500/30'
  },
  { 
    id: 'bantul', 
    name: 'Kab. Bantul', 
    desc: 'Rasakan nuansa asri dengan pilihan lapangan strategis di area selatan Jogja.', 
    icon: Activity,
    image: '/regions/bantul.png',
    border: 'border-emerald-500/30'
  },
  { 
    id: 'kota', 
    name: 'Kota Yogyakarta', 
    desc: 'Akses tercepat menuju GOR premium di jantung pusat kota Yogyakarta.', 
    icon: Trophy,
    image: '/regions/kota.png',
    border: 'border-purple-500/30'
  },
  { 
    id: 'gunungkidul', 
    name: 'Kab. Gunungkidul', 
    desc: 'Fasilitas olahraga luas dan nyaman di kawasan wisata timur Jogja.', 
    icon: MapPin,
    image: '/regions/gunungkidul.png',
    border: 'border-orange-500/30'
  },
  { 
    id: 'kulonprogo', 
    name: 'Kab. Kulon Progo', 
    desc: 'GOR modern yang sedang berkembang pesat di dekat Bandara Internasional YIA.', 
    icon: MapPin,
    image: '/regions/kulonprogo.png',
    border: 'border-teal-500/30'
  }
];

export default function ExploreVenues() {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State untuk alur (Flow)
  const [step, setStep] = useState('region'); // 'region' | 'venues'
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await api.get('/venues?size=500&is_public=true');
        // Hanya tampilkan yang aktif untuk publik
        setVenues(res.data.data.filter(v => v.is_active));
      } catch (error) {
        console.error("Gagal memuat venue", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  const handleSelectRegion = (region) => {
    setSelectedRegion(region);
    setSearchQuery('');
    setStep('venues');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkRegionMatch = (address, regionId) => {
    if (!address) return false;
    const addr = address.toLowerCase();
    switch (regionId) {
      case 'semua': return true;
      case 'sleman': return addr.includes('sleman');
      case 'bantul': return addr.includes('bantul');
      case 'kota': return addr.includes('kota yogyakarta') || (addr.includes('yogyakarta') && !addr.includes('sleman') && !addr.includes('bantul') && !addr.includes('gunung') && !addr.includes('kulon'));
      case 'gunungkidul': return addr.includes('gunungkidul') || addr.includes('gunung kidul');
      case 'kulonprogo': return addr.includes('kulonprogo') || addr.includes('kulon progo');
      default: return true;
    }
  };

  const filteredVenues = venues.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion ? checkRegionMatch(v.address, selectedRegion.id) : true;
    return matchesSearch && matchesRegion;
  });

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
  };

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

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4AF37] selection:text-black pb-20 md:pb-0 overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      </div>

      {/* Header / Nav (Simplified) */}
      <header className="h-16 md:h-20 bg-black/50 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img src="/Logo.svg" alt="Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-[#D4AF37] blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
              <span className="font-black text-lg md:text-xl hidden md:block tracking-tight">JogjaCourt</span>
            </Link>
            {user ? (
              <Link to={user.role === 'customer' ? '/my-bookings' : '/dashboard'} className="relative group text-xs md:text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full transition-all overflow-hidden">
                <span className="relative z-10">{user.role === 'customer' ? 'Tiket Saya' : 'Dashboard Saya'}</span>
              </Link>
            ) : (
              <Link to="/login" className="text-xs md:text-sm font-bold bg-[#D4AF37] text-black px-5 py-2.5 rounded-full hover:bg-yellow-500 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] hover:scale-105">
                Masuk
              </Link>
            )}
          </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 relative min-h-[80vh] z-10">
        
        <AnimatePresence mode="wait">
          {step === 'region' && (
            <motion.div 
              key="region"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
                <span className="text-[#D4AF37] font-bold tracking-widest text-xs md:text-sm uppercase mb-3 block flex items-center justify-center gap-2">
                  <span className="w-6 h-px bg-[#D4AF37]"></span>
                  Lokasi Anda
                  <span className="w-6 h-px bg-[#D4AF37]"></span>
                </span>
                <h1 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-neutral-500 tracking-tight leading-tight">Pilih Wilayah Bermain</h1>
                <p className="text-sm md:text-lg text-neutral-400 leading-relaxed">
                  Temukan GOR terbaik di berbagai sudut Daerah Istimewa Yogyakarta. Di mana Anda ingin berolahraga hari ini?
                </p>
              </div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {REGIONS.map((region) => {
                  const Icon = region.icon;
                  return (
                    <motion.button
                      key={region.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.03, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectRegion(region)}
                      className={`relative overflow-hidden border ${region.border} p-6 rounded-3xl text-left group min-h-[240px] flex flex-col justify-end shadow-2xl`}
                    >
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center z-0 group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                        style={{ backgroundImage: `url(${region.image})` }}
                      ></div>
                      
                      {/* Gradient Overlay for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-80"></div>
                      
                      {/* Content */}
                      <div className="relative z-20 w-full h-full flex flex-col justify-between flex-grow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg group-hover:border-white/40 transition-colors">
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                            <ChevronRight className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        
                        <div className="mt-auto transform group-hover:-translate-y-2 transition-transform duration-300">
                          <h3 className="text-2xl font-black text-white mb-2 drop-shadow-xl">{region.name}</h3>
                          <p className="text-sm text-neutral-300 leading-relaxed font-medium drop-shadow-md">{region.desc}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {step === 'venues' && (
            <motion.div 
              key="venues"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <button 
                onClick={() => setStep('region')}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 md:mb-12 font-medium group"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:-translate-x-1 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span>Kembali ke Pilihan Wilayah</span>
              </button>

              <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
                <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
                  GOR di <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-yellow-300">{selectedRegion?.name}</span>
                </h1>
                <p className="text-sm md:text-lg text-neutral-400">
                  Menampilkan lapangan badminton terbaik yang siap Anda pesan sekarang juga.
                </p>
                
                <div className="mt-8 relative max-w-xl mx-auto group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/50 to-transparent rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Cari nama spesifik GOR..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full py-4 pl-14 pr-6 text-white focus:outline-none focus:border-[#D4AF37] transition-all shadow-2xl text-sm md:text-base placeholder:text-neutral-600"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin mb-4" />
                  <p className="text-neutral-500 font-medium animate-pulse">Menyiapkan daftar GOR...</p>
                </div>
              ) : filteredVenues.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-[#111]/30 backdrop-blur-md max-w-2xl mx-auto"
                >
                  <MapPin className="w-16 h-16 text-neutral-600 mx-auto mb-6 opacity-50" />
                  <h3 className="text-2xl font-bold text-white mb-3">Belum ada GOR yang terdaftar</h3>
                  <p className="text-neutral-400 text-base leading-relaxed px-6">
                    Sayang sekali, saat ini belum ada Mitra GOR yang mendaftar di wilayah <span className="font-bold text-[#D4AF37]">{selectedRegion?.name}</span> dengan kata kunci pencarian Anda.
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                >
                  {filteredVenues.map((venue) => (
                    <motion.div key={venue.id} variants={itemVariants}>
                      <Link 
                        to={`/explore/${venue.id}`} 
                        className="bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl overflow-hidden group hover:border-[#D4AF37]/50 hover:shadow-[0_10px_40px_rgba(212,175,55,0.15)] transition-all duration-500 block flex flex-col h-full transform hover:-translate-y-2"
                      >
                        <div className="h-48 md:h-56 bg-neutral-900 relative overflow-hidden shrink-0">
                          {venue.image_url ? (
                            <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
                              <Building2 className="w-12 h-12" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          
                          {/* Badge */}
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                            <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                            <span className="text-xs font-bold text-white tracking-wide">Mitra Resmi</span>
                          </div>
                        </div>
                        
                        <div className="p-6 md:p-8 flex flex-col flex-grow relative">
                          <div className="absolute -top-10 right-6 w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                            <ChevronRight className="w-6 h-6 text-black" />
                          </div>
                          
                          <h3 className="text-xl md:text-2xl font-black text-white mb-3 group-hover:text-[#D4AF37] transition-colors line-clamp-1">{venue.name}</h3>
                          <div className="flex items-start gap-2 text-neutral-400 text-sm mb-6 flex-grow">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#D4AF37]" />
                            <p className="line-clamp-2 leading-relaxed">{venue.address}</p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-5 border-t border-white/10 shrink-0">
                            <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Pesan Sekarang</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent mx-4"></div>
                            <span className="text-[#D4AF37] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">GO</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
