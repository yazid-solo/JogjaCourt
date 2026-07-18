"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES
// -------------------------------------------------------------------------
const STYLES = `
.cinematic-footer-wrapper {
  font-family: inherit;
  -webkit-font-smoothing: antialiased;

  /* JogjaCourt Theme - Dark Gold/Silver */
  --pill-bg-1: rgba(255, 255, 255, 0.03);
  --pill-bg-2: rgba(255, 255, 255, 0.01);
  --pill-shadow: rgba(0, 0, 0, 0.5);
  --pill-highlight: rgba(255, 255, 255, 0.1);
  --pill-inset-shadow: rgba(0, 0, 0, 0.8);
  --pill-border: rgba(255, 255, 255, 0.08);

  --pill-bg-1-hover: rgba(212, 175, 55, 0.1);
  --pill-bg-2-hover: rgba(212, 175, 55, 0.05);
  --pill-border-hover: rgba(212, 175, 55, 0.4);
  --pill-shadow-hover: rgba(212, 175, 55, 0.2);
  --pill-highlight-hover: rgba(212, 175, 55, 0.5);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.7; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.5)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.8)); }
  30% { transform: scale(1); }
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-modal-fade-in {
  animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-modal-slide-up {
  animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 40s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Theme-adaptive Grid Background */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

/* Theme-adaptive Aurora Glow */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    rgba(212, 175, 55, 0.15) 0%,
    rgba(212, 175, 55, 0.05) 40%,
    transparent 70%
  );
}

/* Glass Pill Theming */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow:
      0 10px 30px -10px var(--pill-shadow),
      inset 0 1px 1px var(--pill-highlight),
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow:
      0 20px 40px -10px var(--pill-shadow-hover),
      inset 0 1px 1px var(--pill-highlight-hover);
  color: white;
}

.footer-glass-pill.primary {
  background: linear-gradient(145deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%);
  border-color: rgba(212, 175, 55, 0.4);
}
.footer-glass-pill.primary:hover {
  background: linear-gradient(145deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.1) 100%);
  border-color: rgba(212, 175, 55, 0.8);
}

/* Giant Background Text Masking */
.footer-giant-bg-text {
  font-size: clamp(10vw, 15vw, 18vw); /* Responsive clamp to prevent mobile clipping */
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.05);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 80%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Metallic Text Glow */
.footer-text-glow {
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.6) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px rgba(255, 255, 255, 0.15));
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency)
// -------------------------------------------------------------------------
export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    },[]);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. MAIN COMPONENT
// -------------------------------------------------------------------------
const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>Booking Real-time</span> <span className="text-[#D4AF37]">✦</span>
    <span>Booking Instan</span> <span className="text-white/60">✦</span>
    <span>Jadwal Terpusat</span> <span className="text-[#D4AF37]">✦</span>
    <span>Manajemen Mitra GOR</span> <span className="text-white/60">✦</span>
    <span>Terpercaya di Jogja</span> <span className="text-[#D4AF37]">✦</span>
  </div>
);

export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    // React strict mode compatible GSAP context cleanup
    const ctx = gsap.context(() => {
      // Background Parallax
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      // Staggered Content Reveal
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  },[]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/*
        The "Curtain Reveal" Wrapper:
        It sits in standard flow. Because it has clip-path, its contents
        are ONLY visible within its bounding box.
      */}
      <div
        ref={wrapperRef}
        className="relative h-[90vh] md:h-screen w-full mt-24"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        {/* The actual footer stays fixed to the viewport underneath everything */}
        <footer className="fixed bottom-0 left-0 flex h-[90vh] md:h-screen w-full flex-col justify-between overflow-hidden bg-black text-white cinematic-footer-wrapper border-t border-white/5">

          {/* Ambient Light & Grid Background */}
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant background text */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
          >
            JOGJACOURT
          </div>

          {/* 1. Diagonal Sleek Marquee (Top of footer) */}
          <div className="absolute top-16 left-0 w-full overflow-hidden border-y border-white/10 bg-[#D4AF37]/5 backdrop-blur-md py-4 z-10 -rotate-2 scale-110 shadow-2xl">
            <div className="flex w-max animate-footer-scroll-marquee text-sm md:text-base font-bold tracking-[0.3em] text-neutral-200 uppercase drop-shadow-md">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* 2. Main Center Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-16 w-full max-w-5xl mx-auto">
            
            <div className="mb-4 hidden md:block">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>

            <h2
              ref={headingRef}
              className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-4 text-center uppercase flex items-center justify-center gap-2 md:gap-4"
            >
              <span className="footer-text-glow pr-1 md:pr-2">MULAI</span> 
              <span className="text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.6)]">RESERVASI?</span>
            </h2>
            
            <p className="text-neutral-400 max-w-2xl text-center mb-8 text-sm md:text-lg leading-relaxed">
              Tinggalkan metode pemesanan manual yang tidak efisien. Optimalkan waktu Anda dengan ekosistem penjadwalan cerdas kami. <span className="text-white font-bold">Daftar sekarang!</span>
            </p>

            {/* Interactive Magnetic Pills Layout */}
            <div ref={linksRef} className="flex flex-col items-center gap-4 w-full">
              {/* App Store Links (Primary) */}
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <MagneticButton as="a" href="/register" className="footer-glass-pill primary px-6 py-3 md:px-10 md:py-5 rounded-full text-white font-bold text-sm md:text-base flex items-center gap-3 group">
                  Buat Akun Pemain
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </MagneticButton>

                <MagneticButton as="button" onClick={() => setActiveModal('mitra_register')} className="footer-glass-pill px-6 py-3 md:px-10 md:py-5 rounded-full text-neutral-300 hover:text-white font-bold text-sm md:text-base flex items-center gap-3 group">
                  Daftarkan GOR Anda
                  <svg className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </MagneticButton>
              </div>

              {/* Secondary Text Links */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-6 w-full mt-4">
                <MagneticButton as="button" onClick={() => setActiveModal('privacy')} className="footer-glass-pill px-5 py-2.5 rounded-full text-neutral-400 font-medium text-xs hover:text-white">
                  Kebijakan Privasi
                </MagneticButton>
                <MagneticButton as="button" onClick={() => setActiveModal('terms')} className="footer-glass-pill px-5 py-2.5 rounded-full text-neutral-400 font-medium text-xs hover:text-white">
                  Syarat & Ketentuan
                </MagneticButton>
                <MagneticButton as="button" onClick={() => setActiveModal('support')} className="footer-glass-pill px-5 py-2.5 rounded-full text-neutral-400 font-medium text-xs hover:text-white">
                  Bantuan Support
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar / Credits */}
          <div className="relative z-20 w-full pb-6 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Copyright (Left) */}
            <div className="text-neutral-500 text-[10px] md:text-xs font-semibold tracking-widest uppercase flex items-center gap-2">
              <img src="/Logo.svg" alt="JogjaCourt" className="w-5 h-5 rounded-full border border-white/10" />
              JogjaCourt © 2026
            </div>

            {/* Right Side Group (Badge + Back to Top) */}
            <div className="flex items-center gap-4">
              {/* "Made with Love" Badge */}
              <div className="footer-glass-pill px-5 py-2 rounded-full flex items-center gap-2 cursor-default border-white/10 scale-90 md:scale-100">
                <span className="text-neutral-400 text-[9px] md:text-xs font-bold uppercase tracking-widest">Dibuat dengan</span>
                <span className="animate-footer-heartbeat text-sm md:text-base text-[#D4AF37]">❤</span>
                <span className="text-neutral-400 text-[9px] md:text-xs font-bold uppercase tracking-widest">di</span>
                <span className="text-white font-black text-xs md:text-sm tracking-normal ml-1">Jogja</span>
              </div>

              {/* Back to top */}
              <MagneticButton
                as="button"
                onClick={scrollToTop}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full footer-glass-pill flex items-center justify-center text-neutral-400 hover:text-white group shrink-0"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
              </MagneticButton>
            </div>

          </div>
        </footer>

        {/* Modal Portals */}
        {activeModal && (
          <LegalModal activeModal={activeModal} onClose={() => setActiveModal(null)} />
        )}
      </div>
    </>
  );
}

// -------------------------------------------------------------------------
// 4. LEGAL MODAL COMPONENT (Glassmorphism & Animated)
// -------------------------------------------------------------------------
function LegalModal({ activeModal, onClose }: { activeModal: string, onClose: () => void }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const contentMap: any = {
    mitra_register: {
      title: "Pendaftaran Kemitraan (KYC)",
      body: <MitraRegisterFlow onClose={onClose} />
    },
    privacy: {
      title: "Kebijakan Privasi",
      body: (
        <div className="space-y-4 text-sm text-neutral-300">
          <p>Di JogjaCourt, privasi Anda adalah prioritas utama kami. Dokumen ini menjelaskan bagaimana kami melindungi data pribadi Anda di platform kami.</p>
          <h4 className="text-white font-bold mt-6 mb-2">1. Pengumpulan & Penggunaan Data</h4>
          <p>Kami mengumpulkan informasi dasar (nama, nomor telepon, riwayat pemesanan) sepenuhnya hanya untuk memfasilitasi transaksi booking lapangan secara *real-time* dan mengirimkan pengingat jadwal bermain.</p>
          <h4 className="text-white font-bold mt-6 mb-2">2. Keamanan Enkripsi Tingkat Tinggi</h4>
          <p>Seluruh transmisi data Anda dienkripsi secara _end-to-end_ menggunakan standar keamanan industri (AES-256). Kami sama sekali **tidak pernah** dan tidak akan menjual data privasi Anda kepada pihak ketiga.</p>
          <h4 className="text-white font-bold mt-6 mb-2">3. Transparansi Mitra GOR</h4>
          <p>Data kontak Anda hanya dibagikan secara spesifik kepada Admin GOR tempat Anda menyewa, semata-mata untuk keperluan check-in dan administrasi lapangan di hari H.</p>
        </div>
      )
    },
    terms: {
      title: "Syarat & Ketentuan",
      body: (
        <div className="space-y-4 text-sm text-neutral-300">
          <p>Dengan melakukan registrasi dan booking lapangan di JogjaCourt, Anda menyetujui seluruh ketentuan layanan kami.</p>
          <h4 className="text-white font-bold mt-6 mb-2">1. Kebijakan Pemesanan & Pembayaran</h4>
          <p>Slot lapangan hanya akan berstatus "Terkonfirmasi" apabila pembayaran telah diselesaikan dalam batas waktu **15 menit** setelah Kode Booking diterbitkan. Lewat dari itu, slot akan hangus dan dilempar kembali ke publik.</p>
          <h4 className="text-white font-bold mt-6 mb-2">2. Kebijakan Pembatalan & Refund</h4>
          <p>Segala bentuk pembatalan jadwal main yang dilakukan pada H-1 atau di hari H **tidak dapat direfund**. Pembatalan minimal H-2 berhak atas pengembalian saldo (refund) 100% yang otomatis masuk ke saldo E-Wallet Anda dalam hitungan detik.</p>
          <h4 className="text-white font-bold mt-6 mb-2">3. Tata Tertib Fasilitas</h4>
          <p>Setiap pemain wajib mematuhi aturan GOR (menggunakan sepatu non-marking, dsb). Mitra GOR berhak melarang pemain masuk jika terbukti melanggar tanpa adanya pengembalian dana.</p>
        </div>
      )
    },
    support: {
      title: "Pusat Bantuan Support",
      body: (
        <div className="space-y-6 text-sm text-neutral-300">
          {/* Card VIP CS */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 p-5 rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              </div>
              <div>
                <h4 className="text-white font-bold">Live Chat CS (24/7)</h4>
                <p className="text-[10px] text-neutral-400">Respon kilat di bawah 2 menit.</p>
              </div>
            </div>
            <a href="https://wa.me/6283835782010" target="_blank" rel="noopener noreferrer" className="mt-4 bg-[#D4AF37] hover:bg-yellow-500 text-black font-black py-3 px-4 rounded-xl w-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2">
              Hubungi via WhatsApp
            </a>
          </div>
          
          <div className="pt-2">
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              FAQ Singkat
            </h4>
            <div className="space-y-3">
              <details className="group border border-white/5 bg-black/50 rounded-xl p-3 cursor-pointer">
                <summary className="font-semibold text-neutral-300 outline-none flex justify-between items-center text-xs">
                  Bagaimana cara refund otomatis?
                  <span className="transition-transform group-open:rotate-180 text-[#D4AF37]">▼</span>
                </summary>
                <p className="text-[11px] text-neutral-400 mt-3 pt-3 border-t border-white/5 leading-relaxed">Pilih jadwal di menu Riwayat Booking, lalu tekan tombol "Batalkan & Refund". Saldo akan dikembalikan 100% ke dompet digital Anda (OVO/GoPay/Dana) maksimal H-2 secara instan tanpa perlu menghubungi CS.</p>
              </details>
              <details className="group border border-white/5 bg-black/50 rounded-xl p-3 cursor-pointer">
                <summary className="font-semibold text-neutral-300 outline-none flex justify-between items-center text-xs">
                  Apakah bisa Reschedule?
                  <span className="transition-transform group-open:rotate-180 text-[#D4AF37]">▼</span>
                </summary>
                <p className="text-[11px] text-neutral-400 mt-3 pt-3 border-t border-white/5 leading-relaxed">Reschedule atau pindah hari/jam diperbolehkan tanpa biaya tambahan asalkan diajukan selambat-lambatnya 48 jam sebelum jadwal bermain dimulai.</p>
              </details>
            </div>
          </div>
        </div>
      )
    }
  };

  const current = contentMap[activeModal];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4 animate-modal-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer" 
        onClick={onClose} 
      />
      
      {/* Modal Dialog */}
      <div className="relative w-full sm:w-[500px] max-h-[85vh] bg-[#0a0a0a] sm:rounded-3xl rounded-t-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col animate-modal-slide-up overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-[#D4AF37]/20 blur-[50px] pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.01] relative z-10">
          <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 tracking-tight">
            {current?.title}
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body scrollable */}
        <div 
          className="p-6 overflow-y-auto custom-scrollbar relative z-10 pb-10 sm:pb-6"
          data-lenis-prevent="true"
        >
          {current?.body}
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// 5. MITRA REGISTER WIZARD (Advanced Verification Flow)
// -------------------------------------------------------------------------
function MitraRegisterFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      // Automatically finish loading on step 2 after a fake secure tunnel delay
      setTimeout(() => {
         setLoading(false); 
      }, 2500);
    }, 1500);
  };

  const handleFinal = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.href = '/mitra-register';
    }, 800);
  };

  // Step 2: Processing Tunnel
  useEffect(() => {
     if(step === 2) { 
         setLoading(true); 
         const t = setTimeout(() => setLoading(false), 2500); 
         return () => clearTimeout(t); 
     }
  }, [step]);

  if (step === 1) {
    return (
      <div className="space-y-6 text-sm text-neutral-300 animate-modal-fade-in">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 flex gap-4 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
          <svg className="w-6 h-6 text-orange-400 shrink-0 mt-0.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div>
            <h4 className="text-orange-400 font-bold mb-1.5 text-base tracking-tight">Verifikasi Hukum & KYC</h4>
            <p className="text-[11px] leading-relaxed text-orange-200/70">Pendaftaran Mitra GOR memerlukan verifikasi KTP (identitas), NIB (jika ada), dan validasi fisik lokasi GOR oleh tim JogjaCourt untuk menghindari indikasi penipuan.</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.05] hover:border-white/10 transition-all">
            <div className="relative flex items-center justify-center mt-0.5">
               <input type="checkbox" checked={agreed1} onChange={e => setAgreed1(e.target.checked)} className="peer appearance-none w-5 h-5 rounded border-2 border-neutral-600 bg-transparent checked:bg-[#D4AF37] checked:border-[#D4AF37] transition-colors cursor-pointer" />
               <svg className="absolute w-3.5 h-3.5 text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span className="text-xs text-neutral-400 leading-relaxed pt-0.5">
              Saya bersedia mematuhi <strong className="text-white font-bold">Service Level Agreement (SLA) 99%</strong>. Jika saya secara sepihak membatalkan jadwal pemain yang sudah terbayar lunas, saya bersedia menerima pinalti pemotongan saldo.
            </span>
          </label>
          <label className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.05] hover:border-white/10 transition-all">
            <div className="relative flex items-center justify-center mt-0.5">
               <input type="checkbox" checked={agreed2} onChange={e => setAgreed2(e.target.checked)} className="peer appearance-none w-5 h-5 rounded border-2 border-neutral-600 bg-transparent checked:bg-[#D4AF37] checked:border-[#D4AF37] transition-colors cursor-pointer" />
               <svg className="absolute w-3.5 h-3.5 text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <span className="text-xs text-neutral-400 leading-relaxed pt-0.5">
              Saya menyetujui kebijakan pembagian hasil (revenue sharing) sebesar <strong className="text-white font-bold">5% dari setiap transaksi</strong> booking yang berhasil melalui platform JogjaCourt.
            </span>
          </label>
        </div>

        <button 
          onClick={handleNext}
          disabled={!agreed1 || !agreed2 || loading}
          className="w-full mt-4 py-4 bg-gradient-to-r from-[#D4AF37] to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-black font-black rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex justify-center items-center gap-3 text-[15px]"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          ) : (
             <>Otentikasi & Lanjutkan <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg></>
          )}
        </button>
      </div>
    );
  }


  return (
    <div className="space-y-6 text-sm text-neutral-300 flex flex-col items-center py-10 animate-modal-fade-in">
       <div className="relative w-24 h-24 mb-6">
         {loading ? (
           <>
             <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/10"></div>
             <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
             <svg className="absolute inset-0 m-auto w-8 h-8 text-[#D4AF37] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           </>
         ) : (
           <div className="absolute inset-0 bg-emerald-500/10 rounded-full flex items-center justify-center animate-modal-fade-in border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
             <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
         )}
       </div>

       <div className="text-center w-full max-w-sm">
         <h4 className="text-white font-black text-xl mb-3 tracking-tight">
           {loading ? "Memproses Registrasi..." : "Registrasi Siap"}
         </h4>
         <p className="text-xs md:text-sm text-neutral-400 leading-relaxed mb-8">
           {loading ? "Kami sedang memproses data Anda." : "Data berhasil disimpan. Anda akan dialihkan ke halaman registrasi Mitra GOR."}
         </p>
         
         {loading ? (
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
               <div className="bg-gradient-to-r from-[#D4AF37] to-yellow-300 h-1.5 rounded-full w-2/3 animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
            </div>
         ) : (
            <button onClick={handleFinal} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-modal-slide-up flex justify-center items-center gap-2 text-[15px]">
              Masuk ke Portal Registrasi
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
         )}
       </div>
    </div>
  );
}
