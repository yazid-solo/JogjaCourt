import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Loader2, Search, MapPin, ChevronRight, Star, Activity, Trophy, Building2, Map, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
        const res = await api.get('/venues');
        // Hanya tampilkan yang aktif untuk publik
        setVenues(res.data.filter(v => v.is_active));
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

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4AF37] selection:text-black pb-20 md:pb-0">
      
      {/* Header / Nav (Simplified) */}
      <header className="h-16 md:h-20 bg-black/80 backdrop-blur-md border-b border-white/5 flex items-center px-4 md:px-6 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-bold text-lg md:text-xl hidden md:block">JogjaCourt</span>
            </Link>
            {user ? (
              <Link to={user.role === 'customer' ? '/my-bookings' : '/dashboard'} className="text-xs md:text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-colors">
                {user.role === 'customer' ? 'Tiket Saya' : 'Dashboard Saya'}
              </Link>
            ) : (
              <Link to="/login" className="text-xs md:text-sm font-bold bg-[#D4AF37] text-black px-4 py-2 md:px-5 md:py-2.5 rounded-full hover:bg-yellow-500 transition-colors">
                Masuk
              </Link>
            )}
          </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 relative min-h-[80vh]">
        
        {/* VIEW 1: PILIH REGION */}
        <div className={`transition-all duration-500 ease-in-out ${step === 'region' ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-10 invisible absolute top-8 left-4 right-4'}`}>
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
            <span className="text-[#D4AF37] font-bold tracking-widest text-xs md:text-sm uppercase mb-3 block">Lokasi Anda</span>
            <h1 className="text-3xl md:text-5xl font-black mb-4 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">Pilih Wilayah Bermain</h1>
            <p className="text-sm md:text-base text-neutral-400">
              Temukan GOR terbaik di berbagai sudut Daerah Istimewa Yogyakarta. Di mana Anda ingin berolahraga hari ini?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {REGIONS.map((region) => {
              const Icon = region.icon;
              return (
                <button
                  key={region.id}
                  onClick={() => handleSelectRegion(region)}
                  className={`relative overflow-hidden border ${region.border} p-6 rounded-3xl text-left group hover:scale-[1.02] transition-all duration-300 min-h-[220px] flex flex-col justify-end`}
                >
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center z-0 group-hover:scale-110 transition-transform duration-700"
                    style={{ backgroundImage: `url(${region.image})` }}
                  ></div>
                  
                  {/* Gradient Overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 z-10"></div>
                  
                  {/* Content */}
                  <div className="relative z-20 w-full h-full flex flex-col justify-between flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center backdrop-blur-md">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-lg">{region.name}</h3>
                      <p className="text-sm text-neutral-300 leading-relaxed drop-shadow-md font-medium">{region.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* VIEW 2: DAFTAR VENUES */}
        <div className={`transition-all duration-500 ease-in-out ${step === 'venues' ? 'opacity-100 translate-y-0 visible relative' : 'opacity-0 translate-y-10 invisible absolute top-8 left-4 right-4'}`}>
          
          <button 
            onClick={() => setStep('region')}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 md:mb-12 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pilihan Wilayah</span>
          </button>

          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
            <h1 className="text-3xl md:text-5xl font-black mb-4">
              GOR di <span className="text-[#D4AF37]">{selectedRegion?.name}</span>
            </h1>
            <p className="text-sm md:text-base text-neutral-400">
              Menampilkan lapangan badminton terbaik yang siap Anda pesan sekarang juga.
            </p>
            
            <div className="mt-8 relative max-w-md mx-auto">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Cari nama spesifik GOR..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-full py-3 md:py-4 pl-12 pr-6 text-white focus:outline-none focus:border-[#D4AF37] transition-colors shadow-lg text-sm md:text-base"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-[#111]/30 backdrop-blur-sm max-w-2xl mx-auto">
              <MapPin className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Belum ada GOR yang terdaftar</h3>
              <p className="text-neutral-500 text-sm">
                Sayang sekali, saat ini belum ada Mitra GOR yang mendaftar di wilayah <span className="font-bold text-white">{selectedRegion?.name}</span> dengan kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredVenues.map((venue) => (
                <Link 
                  to={`/explore/${venue.id}`} 
                  key={venue.id}
                  className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden group hover:border-[#D4AF37]/50 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] transition-all block flex flex-col h-full"
                >
                  <div className="h-48 md:h-56 bg-neutral-800 relative overflow-hidden shrink-0">
                    {venue.image_url ? (
                      <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-[#0a0a0a]">
                        <Building2 className="w-12 h-12" />
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                      <span className="text-xs font-bold text-white">Mitra Resmi</span>
                    </div>
                  </div>
                  
                  <div className="p-5 md:p-6 flex flex-col flex-grow">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-1">{venue.name}</h3>
                    <div className="flex items-start gap-2 text-neutral-400 text-xs md:text-sm mb-6 flex-grow">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#D4AF37]" />
                      <p className="line-clamp-2">{venue.address}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 shrink-0">
                      <span className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">Pesan Sekarang</span>
                      <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors">
                        <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:text-black" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
