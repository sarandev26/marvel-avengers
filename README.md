# AVENGERS — Cinematic Scroll Experience

A fully **scroll-driven, cinematic web experience** built to feel like one continuous movie rather than a conventional website. Every video, camera move, particle, and title is choreographed to your scroll position — you don't browse pages, you *direct an Avengers trailer*.

> **This is a non-commercial, Marvel-inspired fan concept** created as an educational and portfolio showcase of creative front-end development (WebGL, scroll orchestration, video performance). It is not affiliated with, endorsed by, or sponsored by Marvel or The Walt Disney Company. All Marvel characters and trademarks belong to their respective owners.

---

## ✦ Overview

- **Name:** AVENGERS
- **Creator:** Designed & developed by Saran
- **What it is:** An Awwwards-style, single-page, scroll-controlled cinematic experience:
  1. **Marvel Intro:** Near-black indigo void erupts into an energy storm, then the Marvel intro scrubs frame-by-frame.
  2. **Hero:** A continuous portal dive brings you into the fullscreen Hero video with cinematic text beats.
  3. **Avengers Showcase:** A procedural 3D Arc Reactor Core with 6 orbiting Infinity Stones, surrounded by 5 orbiting character video cards (Wanda, Thanos, Black Panther, Spider-Man, Doctor Strange).
  4. **Story Panels:** Five fullscreen storytelling panels (Captain America, Thor with Rocket & Groot, The Incredible Hulk, Iron Man, Spider-Man) rise and stack with dimensional depth.
  5. **Horizontal Timeline:** A pinned horizontal reel where vertical scroll drives the five character scenes right-to-left.
  6. **Finale:** Earth's final battle war clip scrubs into the iconic Iron Man snap ("And I am Iron Man"), then the closing footer rises.
- **Inspiration:** The Avengers cinematic universe and the iconic *Avengers: Endgame* visual palette (near-black indigo, electric violet, electric blue, lavender, and warm spark embers).

---

## ✦ Video Manifest (`lib/constants.ts`)

| Slot | File Name | Type | Description |
|---|---|---|---|
| `marvelIntro` | `marvel-intro.mp4` | Scrubbed | Marvel Studios intro sequence |
| `heroIntro` | `hero-intro.mp4` | Scrubbed | Fullscreen hero intro |
| `cardWanda` | `card-wanda.mp4` | Loop | Wanda Maximoff orbiting card & reel scene |
| `cardThanos` | `card-thanos.mp4` | Loop | Thanos orbiting card & reel scene |
| `cardBlackPanther` | `card-black-panther.mp4` | Loop | Black Panther orbiting card & reel scene |
| `cardSpiderMan` | `card-spider-man.mp4` | Loop | Spider-Man orbiting card & reel scene |
| `cardDoctorStrange` | `card-doctor-strange.mp4` | Loop | Doctor Strange orbiting card & reel scene |
| `war` | `war.mp4` | Scrubbed | Earth's final stand battle clip |
| `ironManSnap` | `iron-man-snap.mp4` | Scrubbed | Climax Iron Man snap |

*Note: All scrubbed videos should be encoded all-intra (`-g 1 -c:v libx264 -crf 20 -movflags +faststart`) for instant seeking in both directions.*

---

## ✦ Technology Stack

- **[Next.js 16](https://nextjs.org/)** (App Router)
- **[React 19](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)**
- **[Three.js](https://threejs.org/)** + **[React Three Fiber](https://r3f.docs.pmnd.rs/)** + **[@react-three/drei](https://github.com/pmndrs/drei)**
- **[GSAP](https://gsap.com/)** + **ScrollTrigger**
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth inertial scrolling
- **[Zustand](https://zustand.docs.pmnd.rs/)** — discrete UI state
- **CSS Modules** + Custom GLSL shaders

---

## ✦ Getting Started

```bash
# Run local dev server
npm run dev

# Production build
npm run build
```
