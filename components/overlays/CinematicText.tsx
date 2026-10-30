"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { TIMELINE_UNITS } from "@/lib/constants";
import { useRaf } from "@/lib/useRaf";
import styles from "./cinematic.module.css";

type Variant = "rise" | "chroma" | "loom" | "metallic" | "assemble";

interface Beat {
  id: string;
  lines: string[];
  startU: number;
  endU: number;
  variant: Variant;
  kicker?: string;
  safeZone?: boolean; // Pinned to bottom-third safe zone with subtle contrast backdrop
}

/**
 * Cinematic storytelling copy, scrubbed by scroll.
 * Pinned to timeline unit windows (100vh = 1 unit).
 *
 * All text sits strictly in safe zones so it never obscures key visual action:
 * - Hero section features "THE UNIVERSE NEEDS HEROES" (no "Assemble").
 * - War section opens with "THE WAR OF EXISTENCE".
 * - At Cap's hammer raise (ASSEMBLE_TIME: 10.2s), "ASSEMBLE" appears in glorious metallic lavender-to-blue gradient.
 * - Iron Man section displays "I AM IRON MAN" at IRONMAN_TEXT_TIME (2.2s).
 * - Snap climax hold (34.7 - 35.9 units) is 100% CLEAN with ZERO text overlay.
 */
const BEATS: Beat[] = [
  // ── Section 1 · Storm + Portal ──
  { id: "converge", lines: ["EVERY TIMELINE CONVERGES"], startU: 0.0, endU: 1.35, variant: "rise" },
  { id: "threat", lines: ["A COSMIC THREAT RISES"], startU: 3.9, endU: 4.65, variant: "chroma" },

  // ── Section 2a · Hero intro text sequence ──
  { id: "heroes", lines: ["EARTH'S MIGHTIEST HEROES"], startU: 4.9, endU: 5.5, variant: "rise", kicker: "I" },
  { id: "divided", lines: ["DIVIDED BY INFINITY"], startU: 5.55, endU: 6.2, variant: "chroma", kicker: "II" },
  { id: "united", lines: ["UNITED BY SACRIFICE"], startU: 6.25, endU: 6.9, variant: "loom", kicker: "III" },
  { id: "takes", lines: ["WHATEVER IT TAKES"], startU: 6.95, endU: 7.55, variant: "metallic", kicker: "IV" },

  // ── Section 2b · Hero Assemble climax (no 'Assemble' word here) ──
  { id: "universe-heroes", lines: ["THE UNIVERSE", "NEEDS HEROES"], startU: 11.6, endU: 12.6, variant: "rise" },

  // ── Section 5a · War Clip: Cap Lifts Mjolnir Climax (after 3-4 scrolls of War) ──
  {
    id: "assemble-war",
    lines: ["ASSEMBLE"],
    startU: 27.6,
    endU: 29.2,
    variant: "assemble",
    safeZone: true,
  },

  // ── Section 5a · War Clip: The Full Charge (where Black Panther is running) ──
  {
    id: "war-existence",
    lines: ["THE WAR OF EXISTENCE"],
    startU: 29.6,
    endU: 31.4,
    variant: "loom",
    safeZone: true,
  },

  // ── Section 5b · Iron Man: The Iconic Defiance (IRONMAN_TEXT_TIME) ──
  {
    id: "ironman-line",
    lines: ["I AM IRON MAN"],
    startU: 34.2,
    endU: 36.4,
    variant: "metallic",
    safeZone: true,
  },
];

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function CinematicText() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useRaf(() => {
    const s = signals.scroll;
    for (let i = 0; i < BEATS.length; i++) {
      const el = refs.current[i];
      if (!el) continue;
      const b = BEATS[i];
      const start = b.startU / TIMELINE_UNITS;
      const end = b.endU / TIMELINE_UNITS;

      if (s < start - 0.02 || s > end + 0.02) {
        if (el.style.visibility !== "hidden") {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
        }
        continue;
      }

      const t = Math.max(0, Math.min(1, (s - start) / (end - start)));
      const isFirst = b.startU === 0;
      const enter = isFirst ? 1 : smoothstep(0, 0.22, t);
      const leave = smoothstep(0.72, 1, t);
      const opacity = enter * (1 - leave);
      const y = (1 - enter) * 36 + leave * -28;
      const blur = (1 - enter) * 10 + leave * 8;
      const scale = b.variant === "loom" ? 1.3 - 0.3 * enter : b.variant === "assemble" ? 0.95 + 0.05 * enter : 1;

      el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      el.style.opacity = opacity.toFixed(3);

      if (b.safeZone) {
        el.style.transform = `translate(-50%, 0) translateY(${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      } else {
        el.style.transform = `translate(-50%, -50%) translateY(${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      }

      el.style.filter = blur > 0.12 ? `blur(${blur.toFixed(1)}px)` : "none";
    }
  });

  return (
    <div className={styles.wrap} aria-hidden>
      {BEATS.map((b, i) => {
        const small = b.lines.length > 1;
        const isFirst = b.startU === 0;

        return (
          <div
            key={b.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`${styles.beat} ${b.safeZone ? styles.bottomSafe : ""}`}
            style={
              isFirst
                ? { opacity: 1, visibility: "visible", transform: "translate(-50%, -50%) translateY(0px) scale(1)" }
                : { opacity: 0, visibility: "hidden" }
            }
          >
            {b.kicker && <span className={styles.kicker}>{b.kicker}</span>}

            {b.lines.map((line, li) => {
              if (b.variant === "assemble") {
                return (
                  <span key={li} className={`${styles.line} ${styles.assembleGradient}`}>
                    {line}
                  </span>
                );
              }
              if (b.variant === "chroma") {
                return (
                  <span
                    key={li}
                    className={`${styles.line} ${styles.glow} ${small ? styles.small : ""} ${styles.chroma}`}
                    data-text={line}
                  >
                    {line}
                  </span>
                );
              }
              return (
                <span
                  key={li}
                  className={`${styles.line} ${styles.glow} ${small ? styles.small : ""} ${
                    b.variant === "metallic" ? styles.metallic : ""
                  }`}
                >
                  {line}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
