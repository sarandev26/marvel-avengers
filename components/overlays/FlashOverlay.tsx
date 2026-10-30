"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";

/**
 * Whole-frame lightning flash. Sits above the stage so every strike briefly
 * illuminates the entire composition — footage included. Kept subtle so it
 * reads as light bloom, not a white wash.
 */
export default function FlashOverlay() {
  const ref = useRef<HTMLDivElement>(null);

  useRaf(() => {
    const el = ref.current;
    if (!el) return;
    const o = Math.min(0.18, signals.flash * 0.12);
    el.style.opacity = o.toFixed(3);
  });

  return (
    <div
      ref={ref}
      className="overlay no-select"
      aria-hidden
      style={{
        zIndex: 6,
        opacity: 0,
        background:
          "radial-gradient(120% 90% at 50% 42%, rgba(242,238,255,0.7), rgba(123,77,255,0.22) 38%, rgba(11,7,36,0) 72%)",
        mixBlendMode: "screen",
        willChange: "opacity",
      }}
    />
  );
}
