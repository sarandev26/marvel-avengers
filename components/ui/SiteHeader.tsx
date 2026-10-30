"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./ui.module.css";

const NAV = ["Saga", "Heroes", "Showcase", "Story", "Finale"];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * The website header + navigation.
 * Slides in as the camera exits the portal into the Hero section.
 */
export default function SiteHeader() {
  const ref = useRef<HTMLElement>(null);

  useRaf(() => {
    const el = ref.current;
    if (!el) return;
    const fin = Math.max(signals.warOp, signals.snapOp);
    const h = signals.header * (1 - smoothstep(0.02, 0.2, fin));
    el.style.opacity = h.toFixed(3);
    el.style.transform = `translateY(${(1 - h) * -20}px)`;
    el.style.pointerEvents = h > 0.6 ? "auto" : "none";
    el.style.visibility = h < 0.01 ? "hidden" : "visible";
  });

  return (
    <header ref={ref} className={styles.header} style={{ opacity: 0, visibility: "hidden" }}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" className={styles.markSvg}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="50 15" />
            <path d="M12 4L6 19H9.5L11 15H14L15.5 19H19L13 4H12Z" fill="currentColor" />
            <path d="M10 12.5L12 7.5L14 12.5H10Z" fill="#0b0724" />
            <path d="M4 14.5L20 14.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <span className={styles.brandText}>
          MARVEL<b>STUDIOS</b>
        </span>
      </div>
      <nav className={styles.nav}>
        {NAV.map((n) => (
          <a key={n} href="#" className={styles.navLink} onClick={(e) => e.preventDefault()}>
            {n}
          </a>
        ))}
      </nav>
      <button className={styles.cta} type="button">
        Whatever It Takes
      </button>
    </header>
  );
}
