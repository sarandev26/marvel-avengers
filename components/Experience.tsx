"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLenis, getLenis } from "@/lib/useLenis";
import { useExperience } from "@/lib/store";
import { signals, onCue } from "@/lib/signals";
import { scrubEl, waitForVideosReady } from "@/lib/videos";
import { SCROLL, TIMELINE_UNITS } from "@/lib/constants";

import CinematicCanvas from "@/components/webgl/CinematicCanvas";
import VideoLayer from "@/components/overlays/VideoLayer";
import CharacterOrbit from "@/components/overlays/CharacterOrbit";
import StoryStack from "@/components/overlays/StoryStack";
import FlashOverlay from "@/components/overlays/FlashOverlay";
import CinematicText from "@/components/overlays/CinematicText";
import ScrollCue from "@/components/ui/ScrollCue";
import SiteHeader from "@/components/ui/SiteHeader";
import HeroOverlay from "@/components/ui/HeroOverlay";
import SiteFooter from "@/components/ui/SiteFooter";
import LoadingScreen from "@/components/ui/LoadingScreen";

// Master timeline positions (arbitrary units; ScrollTrigger scrubs scroll→time).
// Tuned for 5-10% cross-dissolve overlaps with zero dead scroll.
const T = {
  introEnd: 1.4,
  marvelEnd: 3.8,
  portalStart: 3.8,
  heroEnter: 4.8, // website chrome enters
  textStart: 4.8, // Section 2a — cinematic text sequence
  textEnd: 7.55, // "Whatever It Takes" finishes
  heroVideoStart: 7.55, // Section 2b — Fullscreen Hero Assemble video fades in + scrubs
  heroVideoEnd: 13.0,
  showcaseStart: 12.4, // Overlap! 3D Avengers Core rises as Hero video fades out
  showcaseEnd: 17.8, // the 5-card orbit completes
  storyStart: 17.2, // Overlap! Section 4 (story stack) begins
  storyEnd: 22.7, // Exactly 5 panels fully revealed (Spider-Man arrives)
  storyHoldEnd: 24.3, // Stand and hold Spider-Man in full view for 1-2 scrolls (2-3 seconds)
  warStart: 24.3, // Finale: War battle video fades in ONLY after Spider-Man hold completes
  warFadeEnd: 25.1,
  warScrubStart: 25.1,
  warScrubEnd: 31.9, // Earth's final stand scrubs in full to final frame
  crumbleStart: 31.9, // Soft continuous crumble transition begins
  crumbleEnd: 32.7,
  snapStart: 32.3, // Iron Man snap clip pre-warmed underneath during crumble
  snapScrubStart: 32.7, // Iron Man snap video scrubs to the snap
  snapScrubEnd: 37.1, // Reaches the snap and final frame
  snapHoldStart: 37.1, // Hold snap frame clearly for ~10% of finale scroll (no overlay)
  snapHoldEnd: 38.3,
  footerStart: 38.3, // Closing footer rises ONLY after the hold completes
  total: TIMELINE_UNITS,
};

export default function Experience() {
  const [mounted, setMounted] = useState(false);
  useLenis();
  const trackRef = useRef<HTMLDivElement>(null);
  const builtRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── pointer tracking + video decoder priming (no audio) ─────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      signals.mtx = (e.clientX / window.innerWidth) * 2 - 1;
      signals.mty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let started = false;
    const onGesture = () => {
      if (started) return;
      started = true;
      useExperience.getState().start();
    };
    const evs = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"] as const;
    evs.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));

    const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (rm?.matches) useExperience.getState().setReduceMotion(true);

    return () => {
      window.removeEventListener("pointermove", onMove);
      evs.forEach((e) => window.removeEventListener(e, onGesture));
    };
  }, []);

  // ── loading / ready gating ──────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    const lenis = getLenis();
    if (lenis) {
      lenis.stop();
    }
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    let canvasReady = false;
    const unsubCanvas = onCue("canvas-ready", () => {
      canvasReady = true;
    });

    const initExperience = async () => {
      const waitCanvas = new Promise<void>((resolve) => {
        if (canvasReady) {
          resolve();
          return;
        }
        const timer = setTimeout(resolve, 2200);
        const un = onCue("canvas-ready", () => {
          clearTimeout(timer);
          un();
          resolve();
        });
      });

      const waitFonts =
        typeof document !== "undefined" && document.fonts
          ? document.fonts.ready.catch(() => {})
          : Promise.resolve();

      await Promise.all([waitForVideosReady(2600), waitCanvas, waitFonts]);

      if (cancelled) return;

      // Experience is now fully primed
      useExperience.getState().setReady(true);
      document.body.style.overflow = "";

      const activeLenis = getLenis();
      if (activeLenis) {
        activeLenis.start();
        activeLenis.scrollTo(0, { immediate: true });
      }

      // Synchronize ScrollTrigger and apply initial progress 0 state
      ScrollTrigger.refresh();
      ScrollTrigger.update();
    };

    initExperience();

    return () => {
      cancelled = true;
      unsubCanvas();
      document.body.style.overflow = "";
    };
  }, [mounted]);

  // ── scroll-scrubbed master ──────────────────────────────────────
  useEffect(() => {
    if (!mounted || builtRef.current || !trackRef.current) return;
    builtRef.current = true;
    useExperience.getState().setPhase("intro");

    const heroThreshold = T.heroEnter / T.total;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: trackRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.35, // Responsive scrub paired with Lenis 0.09 lerp
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          signals.scroll = self.progress;

          // Scrub videos dynamically to real duration
          if (signals.marvelOp > 0.002) scrubEl("marvelIntro", signals.marvelT);
          if (signals.heroOp > 0.002) scrubEl("heroIntro", signals.heroT);
          if (signals.warOp > 0.002 || signals.collapse > 0.01) scrubEl("war", signals.warT);
          if (signals.snapOp > 0.002 || signals.collapse > 0.05) scrubEl("ironManSnap", signals.snapT);

          const next = self.progress >= heroThreshold ? "hero" : "intro";
          if (useExperience.getState().phase !== next) useExperience.getState().setPhase(next);
        },
      },
    });

    // ── Section 1 · Void → Energy storm ─────────────────────────
    tl.to(signals, { energy: 1, duration: T.introEnd }, 0);
    // Marvel intro begins fading in before storm reaches peak
    tl.fromTo(signals, { marvelOp: 0 }, { marvelOp: 1, duration: 0.65, ease: "power2.out" }, T.introEnd - 0.65);

    // ── Section 1 · Marvel intro scrubs (progress 0 -> 1) ─────────
    tl.to(signals, { energy: 0.28, duration: 0.6 }, T.introEnd);
    tl.to(signals, { marvelT: 1.0, duration: T.marvelEnd - T.introEnd }, T.introEnd);

    // ── Continuous portal dive into Hero ──────────────────────────
    tl.to(signals, { energy: 0.6, duration: 0.5 }, T.marvelEnd);
    tl.to(signals, { portal: 1, duration: 1.0, ease: "power1.in" }, T.portalStart);
    tl.to(signals, { dolly: 1, duration: 1.0 }, T.portalStart);

    // Marvel video fades out as portal flares
    tl.to(signals, { marvelOp: 0, duration: 0.45, ease: "power2.in" }, T.portalStart + 0.45);

    tl.to(signals, { header: 1, duration: 0.7 }, T.heroEnter + 0.05); // website chrome enters
    tl.to(signals, { portal: 0, duration: 0.8, ease: "power1.out" }, T.heroEnter);
    tl.to(signals, { dolly: 0, duration: 0.9 }, T.heroEnter);

    // ── Section 2a · Cinematic text sequence ──────────────────────
    tl.to(signals, { energy: 0.12, duration: 0.8 }, T.heroEnter + 0.2);

    // ── Section 2b · Fullscreen Hero video appears & scrubs ───────
    // Fades IN right after the last text line fades out with soft overlap (no empty screen)
    tl.fromTo(
      signals,
      { heroOp: 0 },
      { heroOp: 1, duration: 0.6, ease: "power2.out" },
      T.heroVideoStart - 0.15
    );
    tl.to(signals, { energy: 0.16, duration: 0.6 }, T.heroVideoStart);
    // Hero video scrubs full duration (0 -> 1.0) showing Avengers Assemble
    tl.to(signals, { heroT: 1.0, duration: T.heroVideoEnd - T.heroVideoStart, ease: "none" }, T.heroVideoStart);
    tl.to(signals, { energy: 0.13, duration: 0.8 }, T.heroVideoEnd);

    // ── Section 3 · Avengers Showcase rises as Hero video fades ───
    tl.to(signals, { heroOp: 0, duration: 0.8, ease: "power2.inOut" }, T.showcaseStart);
    tl.to(signals, { showcase: 1, duration: T.showcaseEnd - T.showcaseStart, ease: "none" }, T.showcaseStart);
    tl.to(signals, { energy: 0.22, duration: 1.2, ease: "power1.out" }, T.showcaseStart);

    // ── Section 4 · Cinematic Story Stack (5 panels rise + stack) ──
    tl.to(signals, { showcase: 0, duration: 0.8, ease: "power2.inOut" }, T.storyStart);
    tl.fromTo(signals, { storyOp: 0 }, { storyOp: 1, duration: 0.6, ease: "power2.out" }, T.storyStart);
    tl.to(signals, { story: 1, duration: T.storyEnd - T.storyStart, ease: "none" }, T.storyStart);
    tl.to(signals, { energy: 0.18, duration: 1.0, ease: "power1.inOut" }, T.storyStart);

    // ── Section 5a · Finale: War clip fades in directly from story ─
    tl.to(signals, { storyOp: 0, duration: T.warFadeEnd - T.warStart, ease: "power2.inOut" }, T.warStart);
    tl.fromTo(signals, { warOp: 0 }, { warOp: 1, duration: T.warFadeEnd - T.warStart, ease: "power2.out" }, T.warStart);
    tl.to(signals, { energy: 0.25, duration: 1.6, ease: "power1.inOut" }, T.warStart);
    // War video scrubs full duration (0 -> 1.0) to its last frame
    tl.to(signals, { warT: 1.0, duration: T.warScrubEnd - T.warScrubStart, ease: "none" }, T.warScrubStart);

    // ── Soft continuous crumble transition from War to Iron Man Snap ──
    // War hold + crumble begins near end of war clip
    tl.fromTo(signals, { collapse: 0 }, { collapse: 1, duration: T.crumbleEnd - T.crumbleStart, ease: "sine.inOut" }, T.crumbleStart);
    tl.to(signals, { warOp: 0, duration: T.crumbleEnd - T.crumbleStart, ease: "sine.inOut" }, T.crumbleStart);

    // Iron Man snap clip is already prepared underneath, scrubs 0 -> 1.0
    tl.fromTo(signals, { snapOp: 0 }, { snapOp: 1, duration: 0.6, ease: "power2.out" }, T.snapStart);
    tl.to(signals, { energy: 0.35, duration: 1.6, ease: "power1.inOut" }, T.snapStart);
    tl.to(signals, { snapT: 1.0, duration: T.snapScrubEnd - T.snapScrubStart, ease: "none" }, T.snapScrubStart);

    // ── Hold snap frame clearly before footer rises (no overlay) ──
    // snapT holds at 1.0, snapOp stays at 1.0 across snapHoldStart -> snapHoldEnd

    // ── Footer rises ONLY after the hold completes ────────────────
    tl.to(signals, { footer: 1, duration: T.total - T.footerStart, ease: "power2.out" }, T.footerStart);

    // Initial update right after master timeline creation
    ScrollTrigger.update();

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__avengers = { signals, tl, store: useExperience };
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      builtRef.current = false;
    };
  }, [mounted]);

  const marvelVh = SCROLL.introAtmos + SCROLL.marvelScrub + SCROLL.transition;
  const heroVh = SCROLL.heroText + SCROLL.heroScrub;
  const showcaseVh = SCROLL.showcaseRise + SCROLL.showcaseOrbit + SCROLL.showcaseOut;
  const storyVh = SCROLL.storyStack + SCROLL.storyHold;
  const warVh = SCROLL.warScrub + SCROLL.warHold;
  const snapVh = SCROLL.snapScrub + SCROLL.snapHold;
  const footerVh = SCROLL.footerReveal;

  return (
    <>
      <LoadingScreen />

      <div className="stage">
        {/* Fullscreen scrubbed trailers: Marvel, Hero, War, Snap (z-index 1) */}
        <VideoLayer />
        {/* Section 4 — six stacked story panels (z-index 2) */}
        <StoryStack />
        {/* Section 3 — 5 character video cards orbiting around 3D Avengers Core */}
        <CharacterOrbit />
        {/* Transparent cosmic atmosphere on top (z-index 3) */}
        {mounted && <CinematicCanvas />}
        <FlashOverlay />
        <CinematicText />
      </div>

      <SiteHeader />
      <HeroOverlay />
      <SiteFooter />
      <ScrollCue />

      {/* Invisible scroll track — drives all scrub progress */}
      <div className="scroll-track" ref={trackRef} aria-hidden>
        <section style={{ height: `${marvelVh}vh` }} aria-label="Marvel Intro" />
        <section style={{ height: `${heroVh}vh` }} aria-label="Hero" />
        <section style={{ height: `${showcaseVh}vh` }} aria-label="Showcase" />
        <section style={{ height: `${storyVh}vh` }} aria-label="Story" />
        <section style={{ height: `${warVh}vh` }} aria-label="War" />
        <section style={{ height: `${snapVh}vh` }} aria-label="Snap" />
        <section style={{ height: `${footerVh}vh` }} aria-label="Footer" />
      </div>
    </>
  );
}
