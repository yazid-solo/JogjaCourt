import React, { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { CinematicHero } from "@/components/ui/cinematic-landing-hero"
import { ContainerAnimated, ContainerStagger } from "@/components/blocks/animated-gallery"
import { 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  LayoutDashboard,
  Search,
  CalendarCheck,
  CreditCard,
  LogOut,
  UserCircle
} from "lucide-react"
import { TestimonialCarousel } from "@/components/blocks/testimonial-carousel"
import { CinematicFooter } from "@/components/ui/motion-footer"
import NotificationBell from "@/components/blocks/NotificationBell"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import CardFanCarousel from "@/components/ui/card-fan-carousel"

// Fan carousel cards - local badminton images
const FAN_CARDS = [
  { imgUrl: "/assets/bg-badminton-1.jpg", alt: "GOR Seturan" },
  { imgUrl: "/assets/bg-badminton-2.jpg", alt: "Depok Sport Center" },
  { imgUrl: "/assets/bg-badminton-3.jpg", alt: "GOR Klebengan" },
  { imgUrl: "/assets/bg-badminton-4.jpg", alt: "Tirta Sport" },
  { imgUrl: "/assets/bg-badminton-5.jpg", alt: "GOR Lembah UGM" },
  { imgUrl: "/assets/bg-badminton-6.jpg", alt: "Pandiga Sport" },
  { imgUrl: "/assets/bg-badminton-7.jpg", alt: "GOR Klebengan" }
];

const TiltCard = ({ children, className, variants }) => {
  return (
    <motion.div
      variants={variants}
      whileHover={{ scale: 1.02, y: -5 }}
      className={`relative ${className}`}
    >
      <div className="w-full h-full relative">
        {children}
      </div>
    </motion.div>
  );
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="relative w-full bg-black min-h-screen font-sans selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      
      {/* 1. NAVBAR SECTION */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'bg-black/95 border-b border-white/10 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'bg-gradient-to-b from-black/80 to-transparent py-6'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <img src="/Logo.svg" alt="JogjaCourt Logo" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-[#D4AF37] blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
            </div>
            <span className="text-white font-black text-xl tracking-tight hidden sm:block bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#D4AF37] transition-all duration-500">JogjaCourt</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-neutral-400">
            <a href="#features" className="hover:text-white hover:scale-105 transition-all">Fitur Unggulan</a>
            <a href="#how-it-works" className="hover:text-white hover:scale-105 transition-all">Cara Kerja</a>
            <Link 
              to={user ? "/explore" : "/login"} 
              state={!user ? { from: { pathname: '/explore' } } : undefined}
              className="hover:text-[#D4AF37] hover:scale-105 transition-all"
            >
              Eksplor GOR
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link to={user.role === 'customer' ? '/profile' : '/dashboard/settings'} className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all">
                    {user.profile_image ? (
                      <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-6 h-6 text-[#D4AF37]" />
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-sm font-bold text-white leading-none">{user.name}</span>
                    <span className="text-xs text-[#D4AF37] capitalize mt-1 tracking-widest">{user.role.replace('_', ' ')}</span>
                  </div>
                </Link>
                
                <NotificationBell />
                
                <Link to={user.role === 'customer' ? '/my-bookings' : '/dashboard'} className="relative group text-sm font-bold bg-[#D4AF37] text-black w-10 h-10 sm:w-auto sm:h-auto sm:px-6 sm:py-2.5 rounded-full flex items-center justify-center gap-2 overflow-hidden transition-all hover:scale-105">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                  <LayoutDashboard className="w-4 h-4 relative z-10" />
                  <span className="hidden sm:inline relative z-10">{user.role === 'customer' ? 'Tiket Saya' : 'Dashboard'}</span>
                </Link>
                
                <button 
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-500 flex items-center justify-center transition-all"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-white hover:text-[#D4AF37] transition-colors px-4 py-2">
                  Masuk
                </Link>
                <Link to="/register" className="relative group text-sm font-bold bg-white text-black px-6 py-2.5 rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  <div className="absolute inset-0 bg-[#D4AF37] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                  <span className="relative z-10 group-hover:text-black transition-colors duration-300">Daftar</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* 2. HERO SECTION (3D Cinematic) */}
      <section id="hero" className="relative z-10">
        <CinematicHero />
      </section>

      {/* 3. FEATURES SHOWCASE (Bento Box 3D Design) */}
      <section id="features" className="relative z-20 bg-black pt-16 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#D4AF37]/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-[#D4AF37] text-sm font-bold tracking-widest uppercase mb-3 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-[#D4AF37]"></span>
              Kenapa Pakai JogjaCourt?
              <span className="w-8 h-px bg-[#D4AF37]"></span>
            </h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
              Sistem Cerdas, Efisiensi Waktu
            </h3>
            <p className="mt-4 sm:mt-6 text-neutral-400 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg">
              Infrastruktur digital yang dirancang khusus untuk memodernisasi ekosistem badminton di Yogyakarta. Menyelesaikan permasalahan double-booking dan bentrok jadwal secara presisi.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Feature 1: Live Chat */}
            <TiltCard 
              variants={itemVariants}
              className="col-span-1 lg:col-span-2 bg-gradient-to-br from-[#000a1a] to-[#0a0a0a] border border-blue-500/30 rounded-3xl p-8 group overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.05)]"
            >
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 -z-10">
                <MessageSquare className="w-64 h-64 text-blue-500" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="text-black w-7 h-7" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">Komunikasi Langsung dengan Pengelola</h4>
                <p className="text-neutral-400 leading-relaxed max-w-md">
                  Tersedia fitur pesan terintegrasi untuk menanyakan fasilitas, ketersediaan jadwal rutin, atau negosiasi harga secara langsung kepada pihak pengelola tanpa perlu beralih aplikasi.
                </p>
              </div>
            </TiltCard>

            {/* Feature 2: Auto Cancel */}
            <TiltCard 
              variants={itemVariants}
              className="col-span-1 bg-gradient-to-br from-[#1a0505] to-[#0a0a0a] border border-rose-500/30 rounded-3xl p-8 group overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.05)]"
            >
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 -z-10">
                <Clock className="w-64 h-64 text-rose-500" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(244,63,94,0.4)] group-hover:scale-110 transition-transform duration-300">
                  <Clock className="text-black w-7 h-7" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">Sistem Booking Terotomatisasi</h4>
                <p className="text-neutral-400 leading-relaxed">
                  Jadwal yang telah dibooking akan otomatis dibatalkan oleh sistem jika melewati batas waktu pembayaran, memastikan ketersediaan lapangan selalu akurat secara real-time.
                </p>
              </div>
            </TiltCard>

            {/* Feature 3: Security JWT */}
            <TiltCard 
              variants={itemVariants}
              className="col-span-1 bg-gradient-to-br from-[#051a0a] to-[#0a0a0a] border border-emerald-500/30 rounded-3xl p-8 group overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)]"
            >
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 -z-10">
                <ShieldCheck className="w-64 h-64 text-emerald-500" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="text-black w-7 h-7" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">Privasi & Keamanan Terjamin</h4>
                <p className="text-neutral-400 leading-relaxed">
                  Dilengkapi enkripsi standar industri dan pemisahan arsitektur akses antara pengguna reguler dan mitra pengelola untuk menjamin integritas data Anda.
                </p>
              </div>
            </TiltCard>

            {/* Feature 4: Admin Dashboard */}
            <TiltCard 
              variants={itemVariants}
              className="col-span-1 lg:col-span-2 bg-gradient-to-br from-[#1a1500] to-[#0a0a0a] border border-[#D4AF37]/30 rounded-3xl p-8 group overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.05)]"
            >
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 -z-10">
                <LayoutDashboard className="w-64 h-64 text-[#D4AF37]" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#D4AF37] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform duration-300">
                  <LayoutDashboard className="text-black w-7 h-7" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-white mb-4">Manajemen GOR Komprehensif</h4>
                <p className="text-neutral-300 leading-relaxed max-w-lg text-base sm:text-lg">
                  Bagi mitra pengelola, sistem kami menyediakan dashboard terpusat untuk mengatur harga, ketersediaan lapangan, hingga rekapitulasi laporan pendapatan secara otomatis.
                </p>
                <div className="mt-8">
                  <Link to="/register-mitra" className="inline-flex items-center gap-2 text-[#D4AF37] font-bold hover:text-white transition-colors">
                    Pelajari Fitur Mitra <span className="text-xl">→</span>
                  </Link>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative z-20 bg-[#050505] py-24 px-4 sm:px-6 border-y border-white/10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, type: "spring" }}
            className="flex-1 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              <span className="text-xs font-bold tracking-widest uppercase text-white">Cara Booking</span>
            </div>
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Reservasi Mudah <br/><span className="text-[#D4AF37]">dalam 3 Tahapan</span>
            </h3>
            <p className="text-neutral-400 text-base sm:text-lg lg:text-xl leading-relaxed">
              Lupakan proses pemesanan manual yang memakan waktu. Ekosistem digital kami mengotomatisasi seluruh alur reservasi Anda dalam hitungan detik.
            </p>
          </motion.div>
          
          <div className="flex-1 relative">
            {/* Vertical Line */}
            <div className="absolute left-8 sm:left-10 top-8 bottom-8 w-px bg-gradient-to-b from-[#D4AF37] via-white/10 to-transparent" />
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-12 relative z-10"
            >
              {[
                { icon: Search, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", border: "border-[#D4AF37]/30", title: "1. Eksplorasi & Bandingkan GOR", desc: "Temukan lapangan terbaik di Yogyakarta dengan informasi transparan meliputi ketersediaan, harga aktual, ulasan, hingga dokumentasi fasilitas." },
                { icon: CalendarCheck, color: "text-white", bg: "bg-white/10", border: "border-white/20", title: "2. Pilih Waktu Secara Real-Time", desc: "Sistem sinkronisasi kami menampilkan ketersediaan jadwal secara langsung (live). Tidak perlu lagi konfirmasi manual untuk mengecek slot kosong." },
                { icon: CreditCard, color: "text-white", bg: "bg-white/10", border: "border-white/20", title: "3. Selesaikan Pembayaran Instan", desc: "Konfirmasi pesanan dengan berbagai metode pembayaran aman. Jadwal akan terenkripsi atas nama Anda—cukup tunjukkan bukti reservasi di lokasi." }
              ].map((step, idx) => (
                <motion.div key={idx} variants={itemVariants} className="flex gap-6 sm:gap-8 items-start group">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${step.bg} border ${step.border} flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <step.icon className={`w-8 h-8 sm:w-10 sm:h-10 ${step.color}`} />
                  </div>
                  <div className="pt-2">
                    <h4 className="text-2xl font-bold text-white mb-3 group-hover:text-[#D4AF37] transition-colors">{step.title}</h4>
                    <p className="text-neutral-400 text-lg leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. GALLERY SHOWCASE SECTION (Fan Carousel) */}
      <section id="venues" className="relative bg-black text-white w-full border-b border-white/5 overflow-hidden">
        <ContainerStagger className="relative z-50 place-self-center px-6 pt-12 pb-2 text-center">
          <ContainerAnimated>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 mb-6">
              <span className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase">GOR di Yogyakarta</span>
            </div>
            <h3 className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter">
              Cek Jadwal,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#D4AF37]">
                Langsung Booking
              </span>
            </h3>
          </ContainerAnimated>
          
          <ContainerAnimated className="mt-6 mb-4">
            <p className="leading-relaxed tracking-tight text-neutral-400 max-w-2xl mx-auto text-lg sm:text-xl">
              Lihat slot jam yang tersedia, pilih lapangan, lalu bayar — selesai. Nggak perlu WA admin atau datang dulu ke tempat buat nanya jadwal.
            </p>
          </ContainerAnimated>
        </ContainerStagger>

        {/* Ambient glow */}
        <div className="pointer-events-none absolute top-0 z-10 h-full w-full"
          style={{
            background: "radial-gradient(ellipse at 50% 60%, rgba(212, 175, 55, 0.08), transparent 70%)",
          }}
        />

        {/* Fan Carousel - self-contained with GSAP animations */}
        <div className="relative z-20 px-4 pb-8 md:pb-12">
          <CardFanCarousel cards={FAN_CARDS} />
        </div>
      </section>

      {/* 5.5 TESTIMONI (What They Say) */}
      <TestimonialCarousel />

      {/* 6. FINAL CTA & FOOTER */}
      <CinematicFooter />
      
    </div>
  )
}
