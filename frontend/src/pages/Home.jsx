import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { CinematicHero } from "@/components/ui/cinematic-landing-hero"
import { 
  ContainerAnimated,
  ContainerScroll,
  ContainerStagger,
  ContainerSticky,
  GalleryCol,
  GalleryContainer 
} from "@/components/blocks/animated-gallery"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  LayoutDashboard,
  Search,
  CalendarCheck,
  CreditCard,
  Trophy,
  LogOut,
  UserCircle
} from "lucide-react"
import { TestimonialCarousel } from "@/components/blocks/testimonial-carousel"
import { CinematicFooter } from "@/components/ui/motion-footer"
import NotificationBell from "@/components/blocks/NotificationBell"

// Badminton specific Unsplash images
const VENUES_1 = [
  { img: "/assets/bg-badminton-1.jpg", name: "GOR Seturan" },
  { img: "/assets/bg-badminton-2.jpg", name: "Depok Sport Center" },
  { img: "/assets/bg-badminton-3.jpg", name: "GOR Klebengan" },
  { img: "/assets/bg-badminton-4.jpg", name: "Tirta Sport" },
]
const VENUES_2 = [
  { img: "/assets/bg-badminton-5.jpg", name: "GOR Lembah UGM" },
  { img: "/assets/bg-badminton-6.jpg", name: "Pandiga Sport" },
  { img: "/assets/bg-badminton-7.jpg", name: "GOR Tridadi" },
  { img: "/assets/bg-badminton-8.jpg", name: "Maguwoharjo Sport" },
]
const VENUES_3 = [
  { img: "/assets/bg-badminton-9.png", name: "Telaga Jonge Badminton" },
  { img: "/assets/bg-1.jpg", name: "GOR Pangukan" },
  { img: "/assets/bg-2.jpg", name: "Bima Sport" },
  { img: "/assets/bg-3.jpg", name: "Piyungan Badminton" },
]

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="relative w-full bg-black min-h-screen font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* 1. NAVBAR SECTION */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src="/logo.png" alt="JogjaCourt Logo" className="w-9 h-9 object-contain" />
            <span className="text-white font-bold text-xl tracking-tight hidden sm:block">JogjaCourt</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Fitur Unggulan</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Cara Kerja</a>
            <Link 
              to={user ? "/explore" : "/login"} 
              state={!user ? { from: { pathname: '/explore' } } : undefined}
              className="hover:text-white transition-colors"
            >
              Eksplor GOR
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to={user.role === 'customer' ? '/profile' : '/dashboard/settings'} className="hidden sm:flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden">
                    {user.profile_image ? (
                      <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-6 h-6 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white leading-none">{user.name}</span>
                    <span className="text-xs text-[#D4AF37] capitalize mt-1">{user.role.replace('_', ' ')}</span>
                  </div>
                </Link>
                
                <NotificationBell />
                
                <Link to={user.role === 'customer' ? '/my-bookings' : '/dashboard'} className="text-sm font-bold bg-[#D4AF37] text-black px-5 py-2 rounded-full hover:bg-yellow-500 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.role === 'customer' ? 'Tiket Saya' : 'Dashboard'}</span>
                </Link>
                
                <button 
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="text-neutral-400 hover:text-red-500 transition-colors p-2"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-white hover:text-[#D4AF37] transition-colors">
                  Masuk
                </Link>
                <Link to="/register" className="text-sm font-bold bg-white text-black px-5 py-2 rounded-full hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION (3D Cinematic) */}
      <section id="hero" className="relative z-10">
        <CinematicHero />
      </section>

      {/* 3. FEATURES SHOWCASE (Bento Box Design based on Backend Features) */}
      <section id="features" className="relative z-20 bg-black pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[#D4AF37] text-sm font-bold tracking-widest uppercase mb-3">Kenapa Pakai JogjaCourt?</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Booking Gampang, Bebas Pusing
            </h3>
            <p className="mt-4 text-neutral-400 max-w-2xl mx-auto text-lg">
              Aplikasi yang dibikin khusus buat anak badminton Jogja. Nggak ada lagi cerita lapangan kedobel atau jadwal bentrok.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Live Chat */}
            <div className="col-span-1 lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 hover:bg-[#111] transition-colors group">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <MessageSquare className="text-blue-400 w-6 h-6" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-3">Chat Langsung Sama Admin</h4>
              <p className="text-neutral-400 leading-relaxed max-w-md">
                Mau nanya fasilitas GOR atau nego jadwal rutin? Langsung chat aja sama admin GOR-nya langsung di dalam aplikasi. Fast response, nggak perlu ribet pindah ke WA.
              </p>
            </div>

            {/* Feature 2: Auto Cancel */}
            <div className="col-span-1 bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 hover:bg-[#111] transition-colors group">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 group-hover:scale-110 transition-transform">
                <Clock className="text-red-400 w-6 h-6" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-3">Booking Anti-PHP</h4>
              <p className="text-neutral-400 leading-relaxed">
                Kesel sama yang cuma nge-tag jam tapi nggak jadi bayar? Aplikasi kami otomatis ngebatalin pesanan yang ngelewatin batas waktu pembayaran. 
              </p>
            </div>

            {/* Feature 3: Security JWT */}
            <div className="col-span-1 bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 hover:bg-[#111] transition-colors group">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-emerald-400 w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Akun Pemain & Admin Terpisah</h4>
              <p className="text-neutral-400 leading-relaxed text-sm">
                Login aman, data terlindungi. Kami memisahkan akses akun pemain (untuk booking) dengan akun pemilik GOR (untuk atur lapangan).
              </p>
            </div>

            {/* Feature 4: Admin Dashboard */}
            <div className="col-span-1 lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 hover:bg-[#111] transition-colors group relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                <LayoutDashboard className="w-64 h-64 text-[#D4AF37]" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6 border border-[#D4AF37]/20 group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="text-[#D4AF37] w-6 h-6" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-3">Kelola GOR Lewat HP</h4>
                <p className="text-neutral-400 leading-relaxed max-w-md">
                  Punya GOR? Atur harga, tambah lapangan, sampai pantau pemasukan harian cukup dari satu dashboard simpel. Tinggalkan buku catatan manual Anda sekarang juga.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative z-20 bg-[#050505] py-24 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-[#D4AF37] text-sm font-bold tracking-widest uppercase">Cara Booking</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Cuma Butuh <br/>3 Langkah
            </h3>
            <p className="text-neutral-400 text-lg">
              Dari rebahan sampai keringetan di lapangan, prosesnya secepat ini. Nggak ada lagi drama nunggu balasan chat GOR yang lama.
            </p>
          </div>
          
          <div className="flex-1 relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-[#D4AF37] via-white/10 to-transparent" />
            
            <div className="space-y-12 relative z-10">
              <div className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                  <Search className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">1. Cari GOR Langgananmu</h4>
                  <p className="text-neutral-400">Jelajahi berbagai GOR di Yogyakarta. Cek info harga sewa per jam, lokasi, sampai foto-foto fasilitasnya langsung.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">2. Pilih Jam & Lapangan</h4>
                  <p className="text-neutral-400">Kalender pintar kita nunjukin jadwal kosong secara real-time. Slot incaran timmu masih kosong? Langsung sikat!</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-16 h-16 rounded-full bg-[#111] border border-white/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">3. Bayar & Main</h4>
                  <p className="text-neutral-400">Transfer pembayaran, lalu jadwalmu otomatis terkunci. Datang ke GOR, tunjukkan HP-mu, dan langsung smash!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GALLERY SHOWCASE SECTION (Animated Gallery) */}
      <section id="venues" className="relative bg-black text-white w-full border-b border-white/5 pb-[10vh]">
        <ContainerStagger className="relative z-50 place-self-center px-6 pt-32 text-center">
          <ContainerAnimated>
            <h2 className="text-[#D4AF37] text-sm font-bold tracking-widest uppercase mb-4">Pilihan GOR</h2>
            <h3 className="font-sans text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter">
              GOR{" "}
              <span className="text-white border-b-4 border-[#D4AF37]">
                Rekomendasi
              </span>
            </h3>
          </ContainerAnimated>
          
          <ContainerAnimated className="my-6">
            <p className="leading-relaxed tracking-tight text-neutral-400 max-w-xl mx-auto text-lg">
              Dari lapangan vinyl standar BWF sampai lapangan karpet empuk buat mabar santai bareng teman sekantor. Semuanya ada di sini.
            </p>
          </ContainerAnimated>
        </ContainerStagger>

        {/* Ambient background glow for gallery */}
        <div className="pointer-events-none absolute top-[30vh] z-10 h-[60vh] w-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(212, 175, 55, 0.15), transparent 70%)",
            filter: "blur(80px)",
            mixBlendMode: "screen",
          }}
        />

        <ContainerScroll className="relative h-[350vh] mt-12 md:mt-24">
          <ContainerSticky className="h-svh flex items-center justify-center px-2 md:px-8">
            <GalleryContainer className="max-w-7xl mx-auto w-full">
              <GalleryCol yRange={["-30%", "25%"]} className="-mt-8 md:-mt-16">
                {VENUES_1.map((venue, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-xl md:rounded-2xl shadow-2xl shadow-black/50 border border-white/5">
                    <img
                      className="aspect-[4/5] md:aspect-video block h-auto max-h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      src={venue.img}
                      alt={venue.name}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-4 lg:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div>
                        <span className="text-white font-bold text-lg md:text-xl tracking-tight block">{venue.name}</span>
                        <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">Mulai Rp 40k/Jam</span>
                      </div>
                    </div>
                  </div>
                ))}
              </GalleryCol>
              
              <GalleryCol className="mt-[-30%] md:mt-[-50%]" yRange={["35%", "-25%"]}>
                {VENUES_2.map((venue, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-xl md:rounded-2xl shadow-2xl shadow-black/50 border border-white/5">
                    <img
                      className="aspect-[4/5] md:aspect-[3/4] block h-auto max-h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      src={venue.img}
                      alt={venue.name}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-4 lg:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div>
                        <span className="text-white font-bold text-lg md:text-xl tracking-tight block">{venue.name}</span>
                        <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">Premium Court</span>
                      </div>
                    </div>
                  </div>
                ))}
              </GalleryCol>
              
              <GalleryCol yRange={["-30%", "25%"]} className="-mt-8 md:-mt-16">
                {VENUES_3.map((venue, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-xl md:rounded-2xl shadow-2xl shadow-black/50 border border-white/5">
                    <img
                      className="aspect-[4/5] md:aspect-video block h-auto max-h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      src={venue.img}
                      alt={venue.name}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-4 lg:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div>
                        <span className="text-white font-bold text-lg md:text-xl tracking-tight block">{venue.name}</span>
                        <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">Standard BWF</span>
                      </div>
                    </div>
                  </div>
                ))}
              </GalleryCol>
            </GalleryContainer>
          </ContainerSticky>
        </ContainerScroll>
      </section>

      {/* 5.5 TESTIMONI (What They Say) */}
      <TestimonialCarousel />

      {/* 6. FINAL CTA & FOOTER */}
      <CinematicFooter />
      
    </div>
  )
}
