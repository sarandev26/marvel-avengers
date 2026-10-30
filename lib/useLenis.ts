"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Smooth-scroll spine. The whole experience is scroll-driven, so Lenis runs from
 * load and feeds GSAP's ticker + ScrollTrigger. Inertial lerp (0.09) gives a smooth,
 * filmic glide without lag.
 */

let globalLenis: Lenis | null = null;

export function getLenis(): Lenis | null {
  return globalLenis;
}

export function useLenis() {
  const ref = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.25,
      smoothWheel: true,
      syncTouch: false,
    });

    ref.current = lenis;
    globalLenis = lenis;

    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__lenis = lenis;
    }

    // Sync Lenis scroll events to ScrollTrigger updates
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis RAF exclusively from GSAP's ticker
    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Initial update to sync positions
    ScrollTrigger.update();

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      ref.current = null;
      globalLenis = null;
    };
  }, []);

  return ref;
}
