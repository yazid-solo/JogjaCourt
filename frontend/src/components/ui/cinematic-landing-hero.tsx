"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from '@studio-freight/lenis';
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  /* Environment Overlays */
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.03;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }
  @media (max-width: 768px) {
    .film-grain { display: none; }
  }

  .bg-grid-theme {
      background-size: 60px 60px;
      background-image: 
          linear-gradient(to right, color-mix(in srgb, var(--color-foreground, white) 5%, transparent) 1px, transparent 1px),
          linear-gradient(to bottom, color-mix(in srgb, var(--color-foreground, white) 5%, transparent) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  /* Parallax background layers - Ultra HD */
  .parallax-bg-layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 120%;
      top: -10%;
      object-fit: cover;
      object-position: center center;
      will-change: transform;
      transform: translateZ(0) translate3d(0,0,0);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      -ms-interpolation-mode: bicubic;
  }

  /* OUTSIDE THE CARD: Theme-aware text */
  .text-3d-matte {
      color: var(--color-foreground, white);
      text-shadow: 
          0 10px 30px color-mix(in srgb, var(--color-foreground, white) 20%, transparent), 
          0 2px 4px color-mix(in srgb, var(--color-foreground, white) 10%, transparent);
  }

  .text-silver-matte {
      background: linear-gradient(180deg, var(--color-foreground, white) 0%, color-mix(in srgb, var(--color-foreground, white) 40%, transparent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0); 
      filter: 
          drop-shadow(0px 10px 20px color-mix(in srgb, var(--color-foreground, white) 15%, transparent)) 
          drop-shadow(0px 2px 4px color-mix(in srgb, var(--color-foreground, white) 10%, transparent));
  }

  /* INSIDE THE CARD: Hardcoded Silver/White */
  .text-card-silver-matte {
      background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter: 
          drop-shadow(0px 12px 24px rgba(0,0,0,0.8)) 
          drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
  }

  /* Deep Physical Card with Dynamic Mouse Lighting */
  .premium-depth-card {
      background: linear-gradient(145deg, #162C6D 0%, #0A101D 100%);
      box-shadow: 
          0 40px 100px -20px rgba(0, 0, 0, 0.9),
          0 20px 40px -20px rgba(0, 0, 0, 0.8),
          inset 0 1px 2px rgba(255, 255, 255, 0.2),
          inset 0 -2px 4px rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.04);
      position: relative;
      will-change: transform;
  }

  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06) 0%, transparent 40%);
      transition: opacity 0.3s ease;
      will-change: transform;
  }

  /* Realistic iPhone Mockup Hardware */
  .iphone-bezel {
      background-color: #111;
      box-shadow: 
          inset 0 0 0 2px #52525B, 
          inset 0 0 0 7px #000, 
          0 40px 80px -15px rgba(0,0,0,0.9),
          0 15px 25px -5px rgba(0,0,0,0.7);
      transform-style: preserve-3d;
  }

  .hardware-btn {
      background: linear-gradient(90deg, #404040 0%, #171717 100%);
      box-shadow: 
          -2px 0 5px rgba(0,0,0,0.8),
          inset -1px 0 1px rgba(255,255,255,0.15),
          inset 1px 0 2px rgba(0,0,0,0.8);
      border-left: 1px solid rgba(255,255,255,0.05);
  }
  
  .screen-glare {
      background: linear-gradient(110deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%);
  }

  .widget-depth {
      background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
      box-shadow: 
          0 10px 20px rgba(0,0,0,0.3),
          inset 0 1px 1px rgba(255,255,255,0.05),
          inset 0 -1px 1px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.03);
  }

  .floating-ui-badge {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%);
      backdrop-filter: blur(24px); 
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 
          0 0 0 1px rgba(255, 255, 255, 0.1),
          0 25px 50px -12px rgba(0, 0, 0, 0.8),
          inset 0 1px 1px rgba(255,255,255,0.2),
          inset 0 -1px 1px rgba(0,0,0,0.5);
  }

  /* Physical Tactile Buttons */
  .btn-modern-light, .btn-modern-dark {
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .btn-modern-light {
      background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%);
      color: #0F172A;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1), 0 12px 24px -4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 6px 12px -2px rgba(0,0,0,0.15), 0 20px 32px -6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:active {
      transform: translateY(1px);
      background: linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1), inset 0 3px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.02);
  }
  .btn-modern-dark {
      background: linear-gradient(180deg, #27272A 0%, #18181B 100%);
      color: #FFFFFF;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.6), 0 12px 24px -4px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:hover {
      transform: translateY(-3px);
      background: linear-gradient(180deg, #3F3F46 0%, #27272A 100%);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 6px 12px -2px rgba(0,0,0,0.7), 0 20px 32px -6px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:active {
      transform: translateY(1px);
      background: #18181B;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.05), inset 0 3px 8px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(0,0,0,0.5);
  }

  .progress-ring {
      transform: rotate(-90deg);
      transform-origin: center;
      stroke-dasharray: 402;
      stroke-dashoffset: 402;
      stroke-linecap: round;
  }

  /* Parallax floating particles - DISABLED for performance */
  @keyframes float-particle {
    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
    50% { transform: translateY(-15px) translateX(8px); opacity: 0.4; }
  }

  .parallax-particle {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%);
    pointer-events: none;
    animation: float-particle 6s ease-in-out infinite;
    will-change: transform;
  }

  /* Vignette overlay for cinematic depth - Ultra HD deep */
  .vignette-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: 
      radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.75) 100%),
      linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%);
  }
`;

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
  ctaHeading?: string;
  ctaDescription?: string;
}

export function CinematicHero({ 
  brandName = "JogjaCourt",
  tagline1 = "Main Badminton,",
  tagline2 = "Bebas Drama.",
  cardHeading = "Cari Lapangan Cepat, Langsung Smash!",
  cardDescription = <><span className="text-white font-semibold">JogjaCourt</span> bikin kamu nggak perlu lagi telepon GOR satu-satu cuma buat nanya jadwal kosong. Cek ketersediaan lapangan dan langsung booking dalam hitungan detik.</>,
  metricValue = 100,
  metricLabel = "GOR Tersedia",
  ctaHeading = "Amankan Slot Mainmu.",
  ctaDescription = "Udah siap mabar minggu ini? Jangan sampai kehabisan lapangan karena telat booking. Gabung sekarang bareng ribuan pemain Jogja lainnya.",
  className, 
  ...props 
}: CinematicHeroProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  // Mouse parallax DISABLED - conflicts with GSAP scroll scrub causing jank


  // Lenis Super Lightweight - Dioptimalkan untuk Mobile & GSAP
  useEffect(() => {
    if (window.innerWidth >= 768) {
      const lenis = new Lenis({
        duration: 1.0, // snappier duration
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expoOut
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 1, 
        infinite: false,
      });

      lenis.on('scroll', ScrollTrigger.update);

      let rafId: number;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      return () => {
        lenis.destroy();
        cancelAnimationFrame(rafId);
      };
    }
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      // Parallax bg layers entrance
      gsap.set(".parallax-bg-layer", { scale: 1.15, autoAlpha: 0 });
      gsap.set(".text-track", { autoAlpha: 0, y: 60, scale: 0.9, rotationX: -15 });
      gsap.set(".text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget"], { autoAlpha: 0 });
      gsap.set(".cta-wrapper", { autoAlpha: 0, scale: 0.9 });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".parallax-bg-layer", { 
          autoAlpha: 1, scale: 1, duration: 2, ease: "power2.out", stagger: 0.12 
        })
        .to(".text-track", { duration: 1.4, autoAlpha: 1, y: 0, scale: 1, rotationX: 0, ease: "power3.out" }, "-=1.4")
        .to(".text-days", { duration: 1.2, clipPath: "inset(0 0% 0 0)", ease: "power3.inOut" }, "-=0.8");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=3800",
          pin: true,
          scrub: 1, // Use 1 for smoother interpolation instead of rigid true
          anticipatePin: 1,
        },
      });

      scrollTl
        // Parallax bg layers: smooth & lightweight
        .to(".parallax-bg-layer-1", { yPercent: -10, ease: "power1.out", duration: 3.2, force3D: true }, 0)
        .to(".parallax-bg-layer-2", { yPercent: -6, ease: "power1.out", duration: 3.2, force3D: true }, 0)
        .to(".parallax-bg-layer-3", { yPercent: -4, ease: "power1.out", duration: 3.2, force3D: true }, 0)
        .fromTo([".hero-text-wrapper", ".bg-grid-theme"], { scale: 1, autoAlpha: 1 }, { scale: 1.1, autoAlpha: 0, ease: "power2.inOut", duration: 1.6, immediateRender: false }, 0)
        .to(".main-card", { y: 0, ease: "power2.inOut", duration: 1.6 }, 0)
        // Background wrappers fade out early
        .fromTo(".parallax-wrapper-1", { autoAlpha: 1 }, { autoAlpha: 0, ease: "power1.out", duration: 1.8, immediateRender: false }, 0.8)
        .fromTo(".parallax-wrapper-2", { autoAlpha: 1 }, { autoAlpha: 0, ease: "power1.out", duration: 1.8, immediateRender: false }, 1.0)
        .fromTo(".parallax-wrapper-3", { autoAlpha: 1 }, { autoAlpha: 0, ease: "power1.out", duration: 1.8, immediateRender: false }, 1.2)
        // Expand card seamlessly
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power2.inOut", duration: 1.2 }, 1.0)
        // Content fades in as the card expands! No blank delay!
        .fromTo(".mockup-scroll-wrapper",
          { y: 150, autoAlpha: 0, scale: 0.85 },
          { y: 0, autoAlpha: 1, scale: 1, ease: "power3.out", duration: 1.8, immediateRender: false }, 1.3
        )
        .fromTo(".phone-widget", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, ease: "power2.out", duration: 1.2 }, 1.6)
        .to(".progress-ring", { strokeDashoffset: 60, duration: 1.4, ease: "power2.out" }, 1.6)
        .to(".counter-val", { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 1.4, ease: "power2.out" }, 1.6)
        .fromTo(".floating-badge", { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "power2.out", duration: 1.2, stagger: 0.1 }, 1.8)
        .fromTo(".card-left-text", { x: -30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power2.out", duration: 1.2 }, 1.8)
        .fromTo(".card-right-text", { x: 30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power2.out", duration: 1.2 }, 1.8)
        // Let the user digest the information
        .to({}, { duration: 1.5 })
        .fromTo(".cta-wrapper", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }) 
        .to({}, { duration: 1.0 })
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text"], {
          autoAlpha: 0, ease: "power2.in", duration: 0.8,
        })
        .to(".main-card", { 
          width: isMobile ? "92vw" : "85vw", 
          height: isMobile ? "92vh" : "85vh", 
          borderRadius: isMobile ? "32px" : "40px", 
          ease: "power2.inOut", 
          duration: 1.4 
        }, "pullback") 
        .to(".cta-wrapper", { scale: 1, ease: "power2.inOut", duration: 1.4 }, "pullback")
        .to(".main-card", { y: -window.innerHeight - 300, ease: "power2.in", duration: 1.2 });

    }, containerRef);

    return () => ctx.revert();
  },[metricValue]); 

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-[100dvh] overflow-hidden flex items-center justify-center bg-black text-white font-sans antialiased", className)}
      style={{ contain: "layout style" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />

      {/* === PARALLAX BACKGROUND LAYERS === Ultra HD Dark */}
      {/* Layer 1: Deepest - farthest away, moves slowest */}
      <div className="parallax-wrapper-1 absolute inset-0 z-[1] overflow-hidden pointer-events-none bg-black">
        <img 
          src="/assets/bg-badminton-0.png" 
          alt="" 
          className="parallax-bg-layer parallax-bg-layer-1 gsap-reveal"
          style={{ opacity: 0.45 }}
          loading="eager"
          decoding="sync"
        />
      </div>

      {/* Dark overlay on top of layer 1 for depth */}
      <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(5,10,30,0.6) 100%)' }} />

      {/* Layer 2: Middle depth */}
      <div className="parallax-wrapper-2 absolute inset-0 z-[2] overflow-hidden pointer-events-none">
        <img 
          src="/assets/bg-badminton-9.png" 
          alt="" 
          className="parallax-bg-layer parallax-bg-layer-2 gsap-reveal"
          style={{ opacity: 0.18 }}
          loading="eager"
          decoding="sync"
        />
      </div>

      {/* Layer 3: Closest - soft overlay */}
      <div className="parallax-wrapper-3 absolute inset-0 z-[3] overflow-hidden pointer-events-none">
        <img 
          src="/assets/bg-badminton-8.jpg" 
          alt="" 
          className="parallax-bg-layer parallax-bg-layer-3 gsap-reveal"
          style={{ opacity: 0.12 }}
          loading="eager"
          decoding="sync"
        />
      </div>

      {/* Vignette for cinematic depth */}
      <div className="vignette-overlay z-[4]" aria-hidden="true" />

      {/* Floating golden particles - Minimal */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="parallax-particle w-0.5 h-0.5" style={{ top: "25%", left: "20%", animationDelay: "0s" }} />
        <div className="parallax-particle w-0.5 h-0.5" style={{ top: "70%", left: "75%", animationDelay: "3s" }} />
      </div>

      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme absolute inset-0 z-[6] pointer-events-none opacity-30" aria-hidden="true" />

      {/* BACKGROUND LAYER: Hero Texts */}
      <div className="hero-text-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-full px-4 will-change-transform transform-style-3d">
        <h1 className="text-track gsap-reveal text-3d-matte text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight mb-2">
          {tagline1}
        </h1>
        <h1 className="text-days gsap-reveal text-silver-matte text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tighter">
          {tagline2}
        </h1>
      </div>

      {/* BACKGROUND LAYER 2: Tactile CTA Buttons */}
      <div className="cta-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-full px-4 gsap-reveal pointer-events-auto will-change-transform">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-silver-matte">
          {ctaHeading}
        </h2>
        <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-xl mx-auto font-light leading-relaxed">
          {ctaDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <a href="/explore" className="btn-modern-light flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] group focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2">
            <svg className="w-8 h-8 transition-transform group-hover:scale-105 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase mb-[-2px]">Tersedia Sekarang</div>
              <div className="text-xl font-bold leading-none tracking-tight">Cari Lapangan</div>
            </div>
          </a>
          <a href="/mitra-register" className="btn-modern-dark flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] group focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-background">
            <svg className="w-7 h-7 transition-transform group-hover:scale-105 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
               <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z"/>
            </svg>
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-[-2px]">Gabung Menjadi</div>
              <div className="text-xl font-bold leading-none tracking-tight">Mitra GOR</div>
            </div>
          </a>
        </div>
      </div>

      {/* FOREGROUND LAYER: The Physical Deep Blue Card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          {/* DYNAMIC RESPONSIVE GRID */}
          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-center gap-4 lg:grid lg:grid-cols-2 items-center lg:gap-8 z-10 py-8 lg:py-0">
            
            {/* 1. BACKGROUND TEXT: BRAND NAME (Watermark) */}
            <div className="card-right-text gsap-reveal flex justify-center z-0 w-full opacity-10 pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <h2 className="text-[12vw] md:text-[8vw] lg:text-[7.5vw] font-black uppercase tracking-tighter text-white/50 mt-0 whitespace-nowrap drop-shadow-2xl">
                {brandName}
              </h2>
            </div>

            {/* 2. MIDDLE (Mobile) / CENTER (Desktop): IPHONE MOCKUP */}
            <div className="mockup-scroll-wrapper order-2 lg:order-2 relative w-full h-[380px] lg:h-[600px] flex items-center justify-center z-30" style={{ perspective: "1000px" }}>
              
              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.65] md:scale-[0.85] lg:scale-100">
                
                <div
                  ref={mockupRef}
                  className="relative w-full h-full flex items-center justify-center will-change-transform transform-style-3d"
                >
                  
                  {/* === LAPTOP MOCKUP (Background - Desktop Only) === */}
                  <div className="absolute hidden lg:flex flex-col items-center justify-center transform -translate-x-[100px] -translate-y-[20px] -translate-z-[120px] opacity-90 transition-transform duration-700 hover:-translate-z-[80px] hover:opacity-100">
                    {/* Laptop Screen */}
                    <div className="relative w-[640px] h-[380px] bg-[#111] rounded-t-3xl border-[6px] border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden">
                       <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/20" />
                       <div className="absolute inset-1.5 bg-black rounded-t-xl overflow-hidden flex flex-col font-sans">
                          {/* Header Image Area */}
                          <div className="relative w-full h-[120px] bg-neutral-900 shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
                            <img src="/assets/bg-badminton-5.jpg" alt="GOR" className="w-full h-full object-cover opacity-40" />
                            <div className="absolute bottom-4 left-6 z-20 flex items-end justify-between w-[calc(100%-3rem)]">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="bg-[#D4AF37] text-black text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Mitra GOR</span>
                                  <span className="text-[#D4AF37] text-[10px] font-bold flex items-center gap-1">
                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                    4.8
                                  </span>
                                </div>
                                <h1 className="text-white text-2xl font-black leading-none tracking-tight">GOR Seturan</h1>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                              </div>
                            </div>
                          </div>

                          {/* Main Content Area */}
                          <div className="flex-1 flex gap-6 p-6 overflow-hidden bg-black">
                            
                            {/* Left Col */}
                            <div className="flex-[2] flex flex-col gap-5">
                              {/* Facilities */}
                              <div className="bg-[#111] rounded-xl border border-white/5 p-4 shrink-0">
                                <h2 className="text-white text-xs font-bold mb-3 flex items-center gap-2">
                                  <svg className="w-3 h-3 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Fasilitas GOR
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                  {['Parkir Luas', 'Kantin', 'Toilet Bersih', 'Mushola'].map(f => (
                                    <span key={f} className="px-2.5 py-1 bg-white/5 rounded-md text-[9px] text-neutral-300 border border-white/10">{f}</span>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Courts */}
                              <div className="shrink-0">
                                <h2 className="text-white text-xs font-bold mb-3">Pilih Lapangan</h2>
                                <div className="flex gap-3">
                                  <div className="flex-1 bg-[#D4AF37]/10 border border-[#D4AF37] rounded-xl p-3 shadow-[0_0_15px_rgba(212,175,55,0.15)] relative overflow-hidden">
                                    <div className="absolute inset-x-2 top-1/2 h-[1px] bg-[#D4AF37]/30"></div>
                                    <h3 className="text-[#D4AF37] text-[11px] font-bold">Lap A</h3>
                                    <p className="text-[9px] text-neutral-400 mt-0.5">Karpet BWF</p>
                                    <div className="mt-3 pt-2 border-t border-[#D4AF37]/20">
                                      <p className="text-white text-[11px] font-bold">Rp 45.000<span className="text-[8px] text-neutral-500 font-normal">/jam</span></p>
                                    </div>
                                  </div>
                                  <div className="flex-1 bg-[#111] border border-white/5 rounded-xl p-3 relative overflow-hidden">
                                    <div className="absolute inset-x-2 top-1/2 h-[1px] bg-white/10"></div>
                                    <h3 className="text-white text-[11px] font-bold">Lap B</h3>
                                    <p className="text-[9px] text-neutral-400 mt-0.5">Karpet BWF</p>
                                    <div className="mt-3 pt-2 border-t border-white/5">
                                      <p className="text-white text-[11px] font-bold">Rp 45.000<span className="text-[8px] text-neutral-500 font-normal">/jam</span></p>
                                    </div>
                                  </div>
                                  <div className="flex-1 bg-[#111] border border-white/5 rounded-xl p-3 relative overflow-hidden">
                                    <div className="absolute inset-x-2 top-1/2 h-[1px] bg-white/10"></div>
                                    <h3 className="text-white text-[11px] font-bold">Lap C</h3>
                                    <p className="text-[9px] text-neutral-400 mt-0.5">Karpet BWF</p>
                                    <div className="mt-3 pt-2 border-t border-white/5">
                                      <p className="text-white text-[11px] font-bold">Rp 50.000<span className="text-[8px] text-neutral-500 font-normal">/jam</span></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Col */}
                            <div className="flex-[1.2] bg-[#111] border border-white/5 rounded-xl p-4 flex flex-col relative overflow-hidden">
                              <h2 className="text-white text-xs font-bold mb-3">Pesan Jadwal</h2>
                              
                              {/* Date */}
                              <div className="bg-black border border-white/10 rounded-lg p-2 mb-3 flex items-center justify-between">
                                <span className="text-white text-[10px] flex items-center gap-1.5">
                                  <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  12 Okt 2026
                                </span>
                              </div>

                              {/* Slots */}
                              <div className="grid grid-cols-3 gap-1.5 mb-auto">
                                <div className="bg-white/5 text-neutral-600 text-[9px] font-bold py-2 rounded-md text-center">18:00</div>
                                <div className="bg-[#D4AF37] text-black text-[9px] font-bold py-2 rounded-md text-center shadow-[0_0_10px_rgba(212,175,55,0.4)]">19:00</div>
                                <div className="bg-black border border-white/10 text-white text-[9px] font-bold py-2 rounded-md text-center">20:00</div>
                                <div className="bg-black border border-white/10 text-white text-[9px] font-bold py-2 rounded-md text-center">21:00</div>
                                <div className="bg-white/5 text-neutral-600 text-[9px] font-bold py-2 rounded-md text-center">22:00</div>
                                <div className="bg-black border border-white/10 text-white text-[9px] font-bold py-2 rounded-md text-center">23:00</div>
                              </div>

                              {/* Price & Checkout */}
                              <div className="mt-4 pt-3 border-t border-white/10">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-neutral-400 text-[9px]">Total (1 Jam)</span>
                                  <span className="text-[#D4AF37] text-sm font-black">Rp 45.000</span>
                                </div>
                                <div className="w-full bg-[#D4AF37] text-black text-[10px] font-black py-2 rounded-lg flex items-center justify-center gap-1">
                                  Checkout Sekarang
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Screen Glare */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                       </div>
                    </div>
                    {/* Laptop Base (Keyboard area) */}
                    <div className="relative w-[740px] h-[18px] bg-[#1a1a1a] rounded-b-3xl rounded-t-sm shadow-[0_30px_60px_rgba(0,0,0,0.9)] border-t border-white/10 flex justify-center mt-[-2px] z-10">
                      <div className="w-[120px] h-[6px] bg-[#111] rounded-b-md mt-0" />
                    </div>
                  </div>

                  {/* === IPHONE & BADGES WRAPPER (Foreground) === */}
                  <div className="relative flex items-center justify-center transform lg:translate-x-[60px] lg:translate-z-[80px]">
                    
                    <div
                      className="relative w-[280px] h-[580px] rounded-[3rem] iphone-bezel flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.8)] bg-black"
                    >
                  <div className="absolute top-[120px] -left-[3px] w-[3px] h-[25px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[160px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[220px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[170px] -right-[3px] w-[3px] h-[70px] hardware-btn rounded-r-md z-0 scale-x-[-1]" aria-hidden="true" />

                  <div className="absolute inset-[7px] bg-[#050914] rounded-[2.5rem] overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,1)] text-white z-10">
                    <div className="absolute inset-0 screen-glare z-40 pointer-events-none" aria-hidden="true" />

                    <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-50 flex items-center justify-end px-3 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                    </div>

                    <div className="relative w-full h-full flex flex-col bg-black font-sans">
                      
                      {/* Header Image */}
                      <div className="absolute top-0 left-0 w-full h-[180px] bg-neutral-900 z-0">
                         <img src="/assets/bg-badminton-5.jpg" className="w-full h-full object-cover opacity-40" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      </div>

                      <div className="relative flex-1 pt-12 px-4 pb-4 flex flex-col z-10 overflow-hidden">
                        
                        <div className="flex items-center justify-between mb-3 mt-2">
                          <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="bg-[#D4AF37] text-black text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Mitra GOR</span>
                            <span className="text-[#D4AF37] text-[8px] font-bold flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                              4.8
                            </span>
                          </div>
                          <h1 className="text-white text-[22px] font-black leading-tight mb-0.5">GOR Seturan</h1>
                          <p className="text-neutral-300 text-[9px] flex items-center gap-1">
                            <svg className="w-2.5 h-2.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Jl. Seturan Raya, Sleman
                          </p>
                        </div>

                        {/* Main Scrollable Area */}
                        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 pb-1 scrollbar-hide">
                          
                          {/* Courts */}
                          <div className="bg-[#111] border border-white/5 rounded-xl p-3 shrink-0">
                            <h2 className="text-white text-[10px] font-bold mb-2">Pilih Lapangan</h2>
                            <div className="flex gap-2">
                              <div className="flex-1 bg-[#D4AF37]/10 border border-[#D4AF37] rounded-lg p-2 flex flex-col items-center relative overflow-hidden">
                                <div className="absolute inset-x-1 top-1/2 h-[1px] bg-[#D4AF37]/30"></div>
                                <span className="text-[#D4AF37] text-[10px] font-bold">Lap A</span>
                                <span className="text-white text-[9px] font-bold mt-2">Rp 45k</span>
                              </div>
                              <div className="flex-1 bg-black border border-white/5 rounded-lg p-2 flex flex-col items-center relative overflow-hidden">
                                <div className="absolute inset-x-1 top-1/2 h-[1px] bg-white/10"></div>
                                <span className="text-white text-[10px] font-bold">Lap B</span>
                                <span className="text-white text-[9px] font-bold mt-2">Rp 45k</span>
                              </div>
                              <div className="flex-1 bg-black border border-white/5 rounded-lg p-2 flex flex-col items-center relative overflow-hidden">
                                <div className="absolute inset-x-1 top-1/2 h-[1px] bg-white/10"></div>
                                <span className="text-white text-[10px] font-bold">Lap C</span>
                                <span className="text-white text-[9px] font-bold mt-2">Rp 50k</span>
                              </div>
                            </div>
                          </div>

                          {/* Schedule */}
                          <div className="bg-[#111] border border-white/5 rounded-xl p-3 flex-1 flex flex-col">
                             <h2 className="text-white text-[10px] font-bold mb-2">Pesan Jadwal</h2>
                             
                             {/* Date */}
                             <div className="bg-black border border-white/10 rounded-md p-1.5 mb-2 flex items-center justify-between">
                               <span className="text-white text-[9px] flex items-center gap-1">
                                 <svg className="w-2.5 h-2.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                 12 Okt 2026
                               </span>
                             </div>

                             <div className="grid grid-cols-3 gap-1.5 mt-1">
                                <div className="bg-[#D4AF37] text-black text-[9px] font-bold py-1.5 rounded-md text-center shadow-[0_0_8px_rgba(212,175,55,0.4)]">19:00</div>
                                <div className="bg-white/5 text-neutral-600 text-[9px] font-bold py-1.5 rounded-md text-center">20:00</div>
                                <div className="bg-white/5 text-neutral-600 text-[9px] font-bold py-1.5 rounded-md text-center">21:00</div>
                                <div className="bg-black border border-white/10 text-white text-[9px] font-bold py-1.5 rounded-md text-center">22:00</div>
                                <div className="bg-black border border-white/10 text-white text-[9px] font-bold py-1.5 rounded-md text-center">23:00</div>
                             </div>
                          </div>

                        </div>

                        {/* Sticky Checkout Bottom */}
                        <div className="mt-2 bg-[#111] rounded-xl p-3 border border-white/5 shrink-0 flex items-center justify-between">
                           <div>
                              <div className="text-neutral-400 text-[8px] mb-0.5">Total (1 Jam)</div>
                              <div className="text-[#D4AF37] text-xs font-black">Rp 45.000</div>
                           </div>
                           <div className="bg-[#D4AF37] text-black text-[9px] font-black px-4 py-2 rounded-lg flex items-center gap-1">
                             Checkout
                             <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                           </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Glass Badges - backdrop-blur removed for performance */}
                <div className="floating-badge absolute flex top-6 lg:top-12 left-[-15px] lg:left-[-120px] rounded-2xl p-3 items-center gap-3 z-30 shadow-2xl bg-[#0d0d0d]/95 border border-white/10">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0 bg-neutral-800">
                      <img src="/Logo.svg" alt="Admin" className="w-full h-full object-cover p-1" />
                    </div>
                    <div className="pr-2">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-white text-xs lg:text-sm font-bold tracking-tight">Admin GOR Seturan</p>
                        <span className="text-[9px] text-neutral-500 ml-3">Baru saja</span>
                      </div>
                      <p className="text-neutral-300 text-[10px] lg:text-xs">"Halo kak, lapangan C udah disapu ya, siap dipakai main."</p>
                    </div>
                  </div>

                  <div className="floating-badge absolute flex bottom-12 lg:bottom-20 right-[-15px] lg:right-[-100px] rounded-2xl p-3 items-center gap-3 z-30 shadow-2xl bg-[#0d0d0d]/95 border border-emerald-500/20">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shrink-0">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div className="pr-4">
                      <p className="text-white text-xs lg:text-sm font-bold tracking-tight mb-0.5">Pembayaran Berhasil</p>
                      <p className="text-emerald-400/80 text-[10px] lg:text-xs font-medium">Kode Booking: JC-8X92A</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

            {/* 3. BOTTOM (Mobile) / LEFT (Desktop): ACCOUNTABILITY TEXT */}
            <div className="card-left-text gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full lg:max-w-xl px-4 lg:px-0">
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-3 md:mb-6 w-fit mx-auto lg:mx-0 shadow-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Booking Real-time</span>
              </div>

              <h3 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-6 tracking-tight leading-[1.15] drop-shadow-lg lg:max-w-[80%] mx-auto lg:mx-0">
                {cardHeading}
              </h3>
              
              <div className="block w-12 h-1 bg-gradient-to-r from-[#D4AF37] to-transparent mb-3 md:mb-6 mx-auto lg:mx-0 rounded-full" />

              <p className="block text-white drop-shadow-md text-xs sm:text-sm md:text-base lg:text-lg font-medium leading-relaxed mx-auto lg:mx-0 max-w-sm lg:max-w-[65%]">
                {cardDescription}
              </p>
              
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
