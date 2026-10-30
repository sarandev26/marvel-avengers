/**
 * AVENGERS — global design, video manifest, and timing constants.
 *
 * The experience is entirely SCROLL-DRIVEN.
 * Palette sampled from the iconic Avengers cinematic universe:
 * Deep near-black indigo voids, electric violet, electric blue, lavender highlights,
 * and warm cosmic embers.
 */

export const COLORS = {
  voidBlack: "#05030f",
  voidDeep: "#0b0724",
  violetShadow: "#1c0f4a",
  violetDeep: "#2b1580",
  electricViolet: "#7b4dff",
  electricBlue: "#2f6bff",
  lightBlue: "#6ea8ff",
  magentaStreak: "#c04dff",
  lavenderHighlight: "#cbbcff",
  white: "#f2eeff",
  warmSpark: "#ff7a3d",
  shieldRed: "#d93a3a",
} as const;

export const HEX = {
  voidBlack: 0x05030f,
  voidDeep: 0x0b0724,
  violetShadow: 0x1c0f4a,
  violetDeep: 0x2b1580,
  electricViolet: 0x7b4dff,
  electricBlue: 0x2f6bff,
  lightBlue: 0x6ea8ff,
  magentaStreak: 0xc04dff,
  lavenderHighlight: 0xcbbcff,
  white: 0xf2eeff,
  warmSpark: 0xff7a3d,
  shieldRed: 0xd93a3a,
} as const;

/**
 * Single typed manifest for all project videos.
 * Components, preloader, and video engine read from here.
 */
export interface VideoSlotConfig {
  id: string;
  name: string;
  src: string;
  poster: string;
  type: "scrubbed" | "loop";
}

export const VIDEO_MANIFEST = {
  marvelIntro: {
    id: "marvelIntro",
    name: "Marvel Intro",
    src: "/videos/marvel-intro.mp4",
    poster: "/videos/marvel-intro-poster.jpg",
    type: "scrubbed",
  },
  heroIntro: {
    id: "heroIntro",
    name: "Hero Intro",
    src: "/videos/hero-intro.mp4",
    poster: "/videos/hero-intro-poster.jpg",
    type: "scrubbed",
  },
  cardWanda: {
    id: "cardWanda",
    name: "Wanda Maximoff",
    src: "/videos/card-wanda.mp4",
    poster: "/videos/card-wanda-poster.jpg",
    type: "loop",
  },
  cardThanos: {
    id: "cardThanos",
    name: "Thanos",
    src: "/videos/card-thanos.mp4",
    poster: "/videos/card-thanos-poster.jpg",
    type: "loop",
  },
  cardBlackPanther: {
    id: "cardBlackPanther",
    name: "Black Panther",
    src: "/videos/card-black-panther.mp4",
    poster: "/videos/card-black-panther-poster.jpg",
    type: "loop",
  },
  cardSpiderMan: {
    id: "cardSpiderMan",
    name: "Spider-Man",
    src: "/videos/card-spider-man.mp4",
    poster: "/videos/card-spider-man-poster.jpg",
    type: "loop",
  },
  cardDoctorStrange: {
    id: "cardDoctorStrange",
    name: "Doctor Strange",
    src: "/videos/card-doctor-strange.mp4",
    poster: "/videos/card-doctor-strange-poster.jpg",
    type: "loop",
  },
  war: {
    id: "war",
    name: "Earth's Final Stand",
    src: "/videos/war.mp4",
    poster: "/videos/war-poster.jpg",
    type: "scrubbed",
  },
  ironManSnap: {
    id: "ironManSnap",
    name: "Iron Man Snap",
    src: "/videos/iron-man-snap.mp4",
    poster: "/videos/iron-man-snap-poster.jpg",
    type: "scrubbed",
  },
} as const satisfies Record<string, VideoSlotConfig>;

export type VideoSlotId = keyof typeof VIDEO_MANIFEST;

/** Approximate video durations (seconds) — dynamically overridden by el.duration */
export const VIDEO = {
  marvelDur: 12.14,
  heroDur: 9.17,
  warDur: 16.14,
  snapDur: 5.90,
} as const;

/**
 * Exact seconds in videos for cinematic sync moments.
 * ASSEMBLE_TIME: Second in war.mp4 where Captain America lifts/holds Mjolnir with lightning (10.2s).
 * IRONMAN_TEXT_TIME: Second in iron-man-snap.mp4 where Tony Stark speaks "I am Iron Man" (2.2s).
 */
export const ASSEMBLE_TIME = 10.2;
export const IRONMAN_TEXT_TIME = 2.2;

/**
 * Scroll section heights (in vh).
 * New structure in exact order:
 * 1. Marvel Intro
 * 2. Hero Intro (Text sequence + Fullscreen Avengers Assemble scrub)
 * 3. Avengers Showcase (3D Core + 5 orbiting cards)
 * 4. Story Panels (5 stacked poster panels)
 * 5. Finale (War -> Crumble -> Iron Man Snap -> Hold -> Footer)
 */
export const SCROLL = {
  introAtmos: 140, // Section 1 — void + energy storm builds
  marvelScrub: 240, // Section 1 — Marvel intro scrubs
  transition: 100, // portal dive into Hero
  heroText: 275, // Section 2a — cinematic text sequence
  heroScrub: 545, // Section 2b — Fullscreen Hero video scrubs (Avengers Assembling: 9.17s, ~5 frames per scroll)
  // ── Section 3 (Avengers Showcase) ──
  showcaseRise: 140, // 3D Avengers core rises + 5 cards fly into orbit
  showcaseOrbit: 340, // 5 cards orbit the core
  showcaseOut: 60, // settle
  // ── Section 4 (Story Panels: exactly 5 chapters) ──
  storyStack: 550, // 5 fullscreen panels rise and stack (110vh per chapter)
  storyHold: 160, // Stand and hold Spider-Man in full view for 1-2 scrolls (2-3 seconds) before finale
  // ── Section 5 (Finale: War -> Crumble -> Iron Man Snap -> Hold -> Footer) ──
  warScrub: 680, // War video scrubs to final frame (~5 frames per scroll)
  warHold: 80, // Hold final frame as crumble transition initiates
  snapScrub: 440, // Iron Man snap video scrubs to the snap (~3 frames per scroll)
  snapHold: 120, // Hold snap frame clearly before footer rises (no overlay)
  footerReveal: 150, // Minimal closing footer rises
} as const;

export const SCROLL_VH_TOTAL = (Object.values(SCROLL) as readonly number[]).reduce((a, b) => a + b, 0);
export const TIMELINE_UNITS = SCROLL_VH_TOTAL / 100;

export type Phase = "loading" | "intro" | "hero";
