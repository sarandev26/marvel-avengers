"use client";

import { VIDEO_MANIFEST, VIDEO, type VideoSlotId } from "./constants";
import { signals } from "./signals";

/**
 * Central video management engine for AVENGERS.
 * Reads directly from VIDEO_MANIFEST.
 * Provides all-intra instant seeking, seek-locking, and dynamic real-duration mapping.
 */

export type ScrubSlot = "marvelIntro" | "heroIntro" | "war" | "ironManSnap";
export type LoopSlot =
  | "cardWanda"
  | "cardThanos"
  | "cardBlackPanther"
  | "cardSpiderMan"
  | "cardDoctorStrange";

interface VideoTrack {
  el: HTMLVideoElement | null;
  targetT: number;
  smoothedT: number;
  isSeeking: boolean;
  needsSeek: boolean;
  lastSeekTime: number;
  hasError: boolean;
  cleanups: (() => void)[];
}

const tracks: Record<ScrubSlot, VideoTrack> = {
  marvelIntro: { el: null, targetT: 0, smoothedT: 0, isSeeking: false, needsSeek: false, lastSeekTime: 0, hasError: false, cleanups: [] },
  heroIntro: { el: null, targetT: 0, smoothedT: 0, isSeeking: false, needsSeek: false, lastSeekTime: 0, hasError: false, cleanups: [] },
  war: { el: null, targetT: 0, smoothedT: 0, isSeeking: false, needsSeek: false, lastSeekTime: 0, hasError: false, cleanups: [] },
  ironManSnap: { el: null, targetT: 0, smoothedT: 0, isSeeking: false, needsSeek: false, lastSeekTime: 0, hasError: false, cleanups: [] },
};

let tickerRunning = false;

function getFallbackDuration(slot: ScrubSlot): number {
  if (slot === "marvelIntro") return VIDEO.marvelDur;
  if (slot === "heroIntro") return VIDEO.heroDur;
  if (slot === "war") return VIDEO.warDur;
  return VIDEO.snapDur;
}

function ensureTicker() {
  if (tickerRunning || typeof window === "undefined") return;
  tickerRunning = true;

  const tick = () => {
    const now = performance.now();

    (Object.keys(tracks) as ScrubSlot[]).forEach((slot) => {
      const tr = tracks[slot];
      const el = tr.el;
      if (!el || el.readyState < 1 || tr.hasError) return;

      const dur = (el.duration && !isNaN(el.duration) && el.duration > 0.1)
        ? el.duration
        : getFallbackDuration(slot);

      // Continuous direct read from signals bus each frame
      if (slot === "marvelIntro" && signals.marvelOp > 0.002) {
        tr.targetT = signals.marvelT * Math.max(0, dur - 0.04);
      } else if (slot === "heroIntro" && signals.heroOp > 0.002) {
        tr.targetT = signals.heroT * Math.max(0, dur - 0.04);
      } else if (slot === "war" && (signals.warOp > 0.002 || signals.collapse > 0.01)) {
        tr.targetT = signals.warT * Math.max(0, dur - 0.04);
      } else if (slot === "ironManSnap" && (signals.snapOp > 0.002 || signals.collapse > 0.05)) {
        tr.targetT = signals.snapT * Math.max(0, dur - 0.04);
      }

      const clampedTarget = Math.max(0, Math.min(dur - 0.03, tr.targetT));

      // Direct, responsive tracking without compounding lerp lag
      // (Lenis + GSAP already provide silky smooth inertia)
      tr.smoothedT = clampedTarget;

      // Seek threshold: ~1/2 frame at 30fps (0.015s)
      const seekDelta = Math.abs(el.currentTime - tr.smoothedT);
      if (seekDelta > 0.015) {
        // Unlock if seeking lock hung for > 40ms
        const seekLockExpired = tr.isSeeking && (now - tr.lastSeekTime > 40);
        if (seekLockExpired) {
          tr.isSeeking = false;
        }

        if (!el.seeking && !tr.isSeeking) {
          try {
            tr.isSeeking = true;
            tr.lastSeekTime = now;
            el.currentTime = tr.smoothedT;
          } catch {
            tr.isSeeking = false;
          }
        } else {
          tr.needsSeek = true;
        }
      }
    });

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

export function setVideoEl(slot: ScrubSlot, el: HTMLVideoElement | null) {
  const tr = tracks[slot];
  tr.cleanups.forEach((c) => c());
  tr.cleanups = [];

  tr.el = el;
  tr.targetT = 0;
  tr.smoothedT = 0;
  tr.isSeeking = false;
  tr.needsSeek = false;
  tr.lastSeekTime = 0;
  tr.hasError = false;

  if (el) {
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;

    const onSeeking = () => {
      tr.isSeeking = true;
    };

    const onSeeked = () => {
      tr.isSeeking = false;
      if (tr.needsSeek && el.readyState >= 1) {
        tr.needsSeek = false;
        const dur = (el.duration && !isNaN(el.duration) && el.duration > 0.1)
          ? el.duration
          : getFallbackDuration(slot);
        const clamped = Math.max(0, Math.min(dur - 0.03, tr.smoothedT));
        if (Math.abs(el.currentTime - clamped) > 0.015) {
          try {
            tr.isSeeking = true;
            tr.lastSeekTime = performance.now();
            el.currentTime = clamped;
          } catch {
            tr.isSeeking = false;
          }
        }
      }
    };

    const onReady = () => {
      tr.hasError = false;
      if (el.currentTime === 0) {
        try {
          el.currentTime = 0.001;
        } catch {
          /* noop */
        }
      }
    };

    const onError = () => {
      tr.hasError = true;
    };

    el.addEventListener("seeking", onSeeking);
    el.addEventListener("seeked", onSeeked);
    el.addEventListener("loadedmetadata", onReady);
    el.addEventListener("loadeddata", onReady);
    el.addEventListener("canplay", onReady);
    el.addEventListener("error", onError);

    tr.cleanups.push(() => {
      el.removeEventListener("seeking", onSeeking);
      el.removeEventListener("seeked", onSeeked);
      el.removeEventListener("loadedmetadata", onReady);
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("error", onError);
    });

    primeElement(el);
    ensureTicker();
  }
}

export function getVideoEl(slot: ScrubSlot): HTMLVideoElement | null {
  return tracks[slot].el;
}

/** Warm decoder with muted seek and play-pause */
export function primeElement(el: HTMLVideoElement | null) {
  if (!el) return;
  try {
    el.muted = true;
    el.defaultMuted = true;
    el.preload = "auto";
    if (el.currentTime === 0) {
      el.currentTime = 0.001;
    }
    const p = el.play();
    if (p && typeof p.then === "function") {
      p.then(() => el.pause()).catch(() => {});
    } else {
      el.pause();
    }
  } catch {
    /* noop */
  }
}

/**
 * Set smoothed scrub target.
 * Dynamically maps normalized progress (0..1) to the video's REAL duration (el.duration).
 */
export function scrubEl(slotOrEl: ScrubSlot | HTMLVideoElement | null, tOrProg: number) {
  if (!slotOrEl) return;
  const slot = typeof slotOrEl === "string"
    ? slotOrEl
    : (Object.keys(tracks) as ScrubSlot[]).find((k) => tracks[k].el === slotOrEl);
  if (!slot) return;
  const tr = tracks[slot];
  if (!tr) return;

  const el = tr.el;
  const dur = (el && el.duration && !isNaN(el.duration) && el.duration > 0.1)
    ? el.duration
    : getFallbackDuration(slot);

  if (tOrProg >= 0 && tOrProg <= 1.0) {
    tr.targetT = tOrProg * Math.max(0, dur - 0.04);
  } else {
    tr.targetT = Math.min(dur - 0.04, tOrProg);
  }
}

/** Check if scrubbed videos are ready */
export function areScrubVideosReady(): boolean {
  const keys: ScrubSlot[] = ["marvelIntro", "heroIntro", "war", "ironManSnap"];
  let validCount = 0;
  for (const k of keys) {
    const el = tracks[k].el;
    if (el && !tracks[k].hasError) {
      validCount++;
      if (el.readyState < 2) return false;
    }
  }
  return validCount > 0;
}

/** Wait for available scrub videos to be ready with safety fallback */
export function waitForVideosReady(timeoutMs = 2400): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (areScrubVideosReady()) {
      resolve();
      return;
    }

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, timeoutMs);

    const check = () => {
      if (resolved) return;
      if (areScrubVideosReady()) {
        resolved = true;
        clearTimeout(timer);
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };

    requestAnimationFrame(check);
  });
}

/** Helper to test if a video slot configuration exists */
export function getVideoConfig(slot: VideoSlotId) {
  return VIDEO_MANIFEST[slot];
}
