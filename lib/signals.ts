/**
 * Per-frame signal bus for AVENGERS.
 *
 * Keeps hot-path per-frame values outside React state to avoid re-renders.
 * GSAP tweens write directly onto this singleton; Three.js and RAF loops read from it.
 */

export interface Signals {
  time: number;
  // Pointer — smoothed (-1..1) and raw target (-1..1)
  mx: number;
  my: number;
  mtx: number;
  mty: number;
  mwx: number;
  mwy: number;
  // Impulse channels (decay every frame)
  shake: number;
  flash: number;
  // Atmospheric ramps driven by master timeline (0..1)
  energy: number;
  portal: number;
  dolly: number;
  reveal: number;
  bgBlur: number;
  collapse: number;
  scroll: number;
  shatter: number;
  // Scroll-scrubbed video playheads (seconds) + plane opacities (0..1)
  marvelT: number;
  marvelOp: number;
  heroT: number;
  heroOp: number;
  warT: number;
  warOp: number;
  snapT: number;
  snapOp: number;
  header: number; // website chrome reveal (0..1)
  showcase: number; // Section 3 (Avengers showcase) progress (0..1)
  showcaseAngle: number; // Section 3 synchronized orbit/core angle (radians)
  story: number; // Section 4 (story stack) progress (0..1)
  storyOp: number; // Section 4 container opacity / visibility (0..1)
  footer: number; // closing footer reveal (0..1)
  // Housekeeping
  strikeSeq: number;
  lastStrike: number;
}

export const signals: Signals = {
  time: 0,
  mx: 0,
  my: 0,
  mtx: 0,
  mty: 0,
  mwx: 0,
  mwy: 0,
  shake: 0,
  flash: 0,
  energy: 0,
  portal: 0,
  dolly: 0,
  reveal: 0,
  bgBlur: 0,
  collapse: 0,
  scroll: 0,
  shatter: 0,
  marvelT: 0,
  marvelOp: 0,
  heroT: 0,
  heroOp: 0,
  warT: 0,
  warOp: 0,
  snapT: 0,
  snapOp: 0,
  header: 0,
  showcase: 0,
  showcaseAngle: 0,
  story: 0,
  storyOp: 0,
  footer: 0,
  strikeSeq: 0,
  lastStrike: -999,
};

export type StrikeDetail = {
  x: number;
  y: number;
  power: number;
  mega?: boolean;
};

/** Decoupled event bus so lightning / sparks / camera react together. */
export const bus = typeof EventTarget !== "undefined" ? new EventTarget() : null;

/** Fire a lightning / energy pulse. */
export function emitStrike(detail: StrikeDetail) {
  signals.strikeSeq += 1;
  signals.lastStrike = signals.time;
  signals.shake = Math.min(1.4, signals.shake + detail.power * (detail.mega ? 1.4 : 0.7));
  signals.flash = Math.min(0.95, signals.flash + detail.power * (detail.mega ? 0.9 : 0.32));
  bus?.dispatchEvent(new CustomEvent<StrikeDetail>("strike", { detail }));
}

export function onStrike(fn: (d: StrikeDetail) => void) {
  if (!bus) return () => {};
  const handler = (e: Event) => fn((e as CustomEvent<StrikeDetail>).detail);
  bus.addEventListener("strike", handler);
  return () => bus.removeEventListener("strike", handler);
}

export function emitCue(name: string, detail?: unknown) {
  bus?.dispatchEvent(new CustomEvent(name, { detail }));
}

export function onCue(name: string, fn: (detail: unknown) => void) {
  if (!bus) return () => {};
  const handler = (e: Event) => fn((e as CustomEvent).detail);
  bus.addEventListener(name, handler);
  return () => bus.removeEventListener(name, handler);
}
