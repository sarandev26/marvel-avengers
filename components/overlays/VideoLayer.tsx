"use client";

import { useEffect, useRef, useState } from "react";
import { VIDEO_MANIFEST } from "@/lib/constants";
import { primeElement, setVideoEl } from "@/lib/videos";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";

/**
 * Fullscreen DOM <video> layer for scroll-scrubbed cinematic trailers.
 * Reads directly from VIDEO_MANIFEST.
 * Manages layer z-indexing, smooth cross-dissolves, and the war->snap crumble transition.
 */
export default function VideoLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const marvelWrapRef = useRef<HTMLDivElement>(null);
  const heroWrapRef = useRef<HTMLDivElement>(null);
  const warWrapRef = useRef<HTMLDivElement>(null);
  const snapWrapRef = useRef<HTMLDivElement>(null);

  const marvelRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLVideoElement>(null);
  const warRef = useRef<HTMLVideoElement>(null);
  const snapRef = useRef<HTMLVideoElement>(null);

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const m = marvelRef.current;
    const h = heroRef.current;
    const w = warRef.current;
    const s = snapRef.current;

    [m, h, w, s].forEach((v) => {
      if (v) {
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
      }
    });

    setVideoEl("marvelIntro", m);
    setVideoEl("heroIntro", h);
    setVideoEl("war", w);
    setVideoEl("ironManSnap", s);

    [m, h, w, s].forEach((v) => {
      if (v) {
        if (v.readyState >= 1) {
          primeElement(v);
        } else {
          const prime = () => primeElement(v);
          v.addEventListener("loadeddata", prime, { once: true });
          v.addEventListener("canplay", prime, { once: true });
        }
      }
    });

    return () => {
      setVideoEl("marvelIntro", null);
      setVideoEl("heroIntro", null);
      setVideoEl("war", null);
      setVideoEl("ironManSnap", null);
    };
  }, []);

  // Update container opacities, visibility, and z-index straddling on per-frame signal changes
  useRaf(() => {
    // 1. Marvel Intro
    if (marvelWrapRef.current) {
      const op = signals.marvelOp;
      marvelWrapRef.current.style.opacity = op.toFixed(3);
      marvelWrapRef.current.style.visibility = op > 0.002 ? "visible" : "hidden";
      marvelWrapRef.current.style.zIndex = op > 0.002 ? "2" : "1";
    }

    // 2. Hero Intro (Fullscreen Avengers Assemble scrub)
    if (heroWrapRef.current) {
      const op = signals.heroOp;
      heroWrapRef.current.style.opacity = op.toFixed(3);
      heroWrapRef.current.style.visibility = op > 0.002 ? "visible" : "hidden";
      heroWrapRef.current.style.zIndex = op > 0.002 ? "2" : "1";
    }

    // 3. War Clip & 4. Iron Man Snap
    // During the crumble transition (war -> snap):
    // Iron Man snap is pre-warmed and visible underneath (zIndex 1) while war dissolves (zIndex 2)
    if (warWrapRef.current) {
      const op = signals.warOp;
      const col = signals.collapse;
      // Soft continuous crumble dissolve
      const effectiveOp = Math.max(0, op * (1 - col * 0.95));
      warWrapRef.current.style.opacity = effectiveOp.toFixed(3);
      warWrapRef.current.style.visibility = effectiveOp > 0.002 ? "visible" : "hidden";
      warWrapRef.current.style.zIndex = "2";
      if (col > 0.01) {
        const blur = (col * 14).toFixed(1);
        const scale = (1 + col * 0.06).toFixed(3);
        warWrapRef.current.style.filter = `blur(${blur}px) brightness(${(1 + col * 0.4).toFixed(2)})`;
        warWrapRef.current.style.transform = `scale(${scale})`;
      } else {
        warWrapRef.current.style.filter = "none";
        warWrapRef.current.style.transform = "none";
      }
    }

    if (snapWrapRef.current) {
      const op = signals.snapOp;
      const col = signals.collapse;
      // Underneath during crumble, or full focus once war exits
      const snapVisible = op > 0.002 || col > 0.05;
      const snapOpacity = op > 0.002 ? op : Math.min(1, col * 1.5);
      snapWrapRef.current.style.opacity = snapOpacity.toFixed(3);
      snapWrapRef.current.style.visibility = snapVisible ? "visible" : "hidden";
      snapWrapRef.current.style.zIndex = op > 0.8 ? "4" : "1";
    }

    if (layerRef.current) {
      const inFinale = signals.warOp > 0.002 || signals.snapOp > 0.002 || signals.collapse > 0.01;
      layerRef.current.style.zIndex = inFinale ? "3" : "1";
    }
  });

  const handleErr = (id: string) => {
    setErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div ref={layerRef} className="video-layer" aria-hidden>
      {/* 1. Marvel Intro */}
      <div
        ref={marvelWrapRef}
        className="cover-video-wrap"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <video
          ref={marvelRef}
          className="cover-video"
          src={VIDEO_MANIFEST.marvelIntro.src}
          poster={VIDEO_MANIFEST.marvelIntro.poster}
          preload="auto"
          muted
          playsInline
          onError={() => handleErr("marvelIntro")}
        />
        {errors["marvelIntro"] && (
          <div className="video-placeholder">
            <span>{`[${VIDEO_MANIFEST.marvelIntro.name.toUpperCase()}]`}</span>
          </div>
        )}
      </div>

      {/* 2. Hero Intro */}
      <div
        ref={heroWrapRef}
        className="cover-video-wrap"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <video
          ref={heroRef}
          className="cover-video"
          src={VIDEO_MANIFEST.heroIntro.src}
          poster={VIDEO_MANIFEST.heroIntro.poster}
          preload="auto"
          muted
          playsInline
          onError={() => handleErr("heroIntro")}
        />
        {errors["heroIntro"] && (
          <div className="video-placeholder">
            <span>{`[${VIDEO_MANIFEST.heroIntro.name.toUpperCase()}]`}</span>
          </div>
        )}
      </div>

      {/* 3. The War for Earth */}
      <div
        ref={warWrapRef}
        className="cover-video-wrap"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <video
          ref={warRef}
          className="cover-video"
          src={VIDEO_MANIFEST.war.src}
          poster={VIDEO_MANIFEST.war.poster}
          preload="auto"
          muted
          playsInline
          onError={() => handleErr("war")}
        />
        {errors["war"] && (
          <div className="video-placeholder">
            <span>{`[${VIDEO_MANIFEST.war.name.toUpperCase()}]`}</span>
          </div>
        )}
      </div>

      {/* 4. Iron Man Snap */}
      <div
        ref={snapWrapRef}
        className="cover-video-wrap"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <video
          ref={snapRef}
          className="cover-video"
          src={VIDEO_MANIFEST.ironManSnap.src}
          poster={VIDEO_MANIFEST.ironManSnap.poster}
          preload="auto"
          muted
          playsInline
          onError={() => handleErr("ironManSnap")}
        />
        {errors["ironManSnap"] && (
          <div className="video-placeholder">
            <span>{`[${VIDEO_MANIFEST.ironManSnap.name.toUpperCase()}]`}</span>
          </div>
        )}
      </div>
    </div>
  );
}
