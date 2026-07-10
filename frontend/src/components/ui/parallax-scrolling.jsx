import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

export function ParallaxComponent() {
  const parallaxRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = parallaxRef.current?.querySelector('[data-parallax-layers]');

    if (triggerElement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0
        }
      });

      const layers = [
        { layer: "1", yPercent: 70 },
        { layer: "2", yPercent: 55 },
        { layer: "3", yPercent: 40 },
        { layer: "4", yPercent: 10 }
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          {
            yPercent: layerObj.yPercent,
            ease: "none"
          },
          idx === 0 ? undefined : "<"
        );
      });
    }

    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    return () => {
      // Clean up GSAP and ScrollTrigger instances
      ScrollTrigger.getAll().forEach(st => st.kill());
      gsap.killTweensOf(triggerElement);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="parallax h-screen w-full relative overflow-hidden bg-black text-white" ref={parallaxRef}>
      <section className="parallax__header relative h-[150vh] flex items-center justify-center">
        <div className="parallax__visuals absolute inset-0 w-full h-full">
          <div className="parallax__black-line-overflow absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent z-50 pointer-events-none"></div>
          
          <div data-parallax-layers className="parallax__layers relative w-full h-full flex items-center justify-center">
            
            {/* Layer 1 - Background */}
            <img 
              src="/assets/bg-badminton-6.jpg" 
              loading="eager" 
              data-parallax-layer="1" 
              alt="Badminton Court" 
              className="parallax__layer-img absolute w-[120%] h-[120%] object-cover opacity-30" 
            />
            
            {/* Layer 2 - Midground */}
            <img 
              src="/assets/bg-badminton-2.jpg" 
              loading="eager" 
              data-parallax-layer="2" 
              alt="Badminton Midground" 
              className="parallax__layer-img absolute w-[100%] h-[100%] object-cover opacity-50 mix-blend-screen" 
            />
            
            {/* Layer 3 - Text Content */}
            <div data-parallax-layer="3" className="parallax__layer-title absolute z-40 text-center w-full px-4">
              <h1 className="parallax__title text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter drop-shadow-2xl">
                Main Badminton,<br/>
                <span className="text-[#D4AF37]">Bebas Drama.</span>
              </h1>
              <p className="mt-6 text-xl md:text-2xl text-neutral-300 font-medium max-w-2xl mx-auto drop-shadow-lg">
                Booking lapangan badminton premium di Yogyakarta kini lebih mudah, cepat, dan tanpa ribet.
              </p>
            </div>
            
            {/* Layer 4 - Foreground Elements (Optional) */}
            <img 
              src="/assets/bg-badminton-8.jpg" 
              loading="eager" 
              data-parallax-layer="4" 
              alt="Badminton Foreground" 
              className="parallax__layer-img absolute bottom-0 left-0 w-full h-[60%] object-cover opacity-20 mix-blend-overlay" 
            />
            
          </div>
          <div className="parallax__fade absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black via-black/80 to-transparent z-50 pointer-events-none"></div>
        </div>
      </section>
    </div>
  );
}
