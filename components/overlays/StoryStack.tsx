"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./story.module.css";

/**
 * Section 4 — the Cinematic Story Stack.
 *
 * Exactly 5 fullscreen poster panels featuring Earth's Mightiest Heroes in user-specified order:
 * 01 · Tony Stark (The Master Architect)
 * 02 · Captain America (The First Avenger)
 * 03 · Thor (God of Thunder)
 * 04 · The Incredible Hulk (Bruce Banner)
 * 05 · Spider-Man (Peter Parker in Iron Spider suit)
 *
 * Controlled directly by `signals.storyOp` and `signals.story` from the master timeline.
 * When the story section concludes, the layer is permanently hidden (`display: none`, `visibility: hidden`),
 * ensuring zero bleed or re-appearance during the finale or Iron Man snap video.
 */
interface Panel {
  n: string;
  img: string;
  kicker: string;
  title: string[];
  desc: string;
  accent: string; // primary accent (glow, kicker, edge, counter)
  accent2?: string; // secondary accent (divider gradient)
  titleColor: string; // title text colour
  pos?: string; // object-position for the cover crop
}

const CHAPTERS: Panel[] = [
  {
    n: "01",
    img: "/story/story-1.jpg",
    kicker: "The Master Architect",
    title: ["Tony", "Stark"],
    desc: "Forging the armor of humanity's salvation within the glow of pure genius. The visionary spark that ignited an age of heroes.",
    accent: "#ff7a3d",
    accent2: "#ffd15a",
    titleColor: "#fff4ee",
    pos: "center",
  },
  {
    n: "02",
    img: "/story/story-2.jpg",
    kicker: "The First Avenger",
    title: ["Steve", "Rogers"],
    desc: "Wielding lightning and vibranium with unyielding courage. The heart of the Avengers standing unbroken against inevitable darkness.",
    accent: "#2f6bff",
    accent2: "#cbbcff",
    titleColor: "#f2eeff",
    pos: "center",
  },
  {
    n: "03",
    img: "/story/story-3.jpg",
    kicker: "God of Thunder",
    title: ["Thor", "Odinson"],
    desc: "Descending through tempestuous Wakandan skies with Stormbreaker blazing, bringing cosmic vengeance to the battlefield of Earth.",
    accent: "#6ea8ff",
    accent2: "#ffd15a",
    titleColor: "#f0f8ff",
    pos: "center",
  },
  {
    n: "04",
    img: "/story/story-4.jpg",
    kicker: "Unleashed Titan",
    title: ["Bruce", "Banner"],
    desc: "Channeling primal gamma fury into righteous cataclysm. An unstoppable force rising above shattered horizons to defend humanity.",
    accent: "#00e599",
    accent2: "#ffd15a",
    titleColor: "#f0fff6",
    pos: "center",
  },
  {
    n: "05",
    img: "/story/story-5.jpg",
    kicker: "The Iron Spider",
    title: ["Peter", "Parker"],
    desc: "Leaping through shattered debris and cosmic tides with limitless valor. Bound by duty, courage, and the unyielding will to protect.",
    accent: "#d93a3a",
    accent2: "#ffd15a",
    titleColor: "#fff2f0",
    pos: "center",
  },
];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const cssVars = (c: Panel) =>
  ({
    "--accent": c.accent,
    "--accent2": c.accent2 ?? c.accent,
    "--title": c.titleColor,
    "--pos": c.pos ?? "center",
  }) as React.CSSProperties;

export default function StoryStack() {
  const layerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dimRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useRaf(() => {
    const layer = layerRef.current;
    const op = signals.storyOp;

    // Strict master-timeline gating: if storyOp is 0, hide and don't paint
    if (layer) {
      layer.style.opacity = op.toFixed(3);
      if (op <= 0.002) {
        if (layer.style.visibility !== "hidden") {
          layer.style.visibility = "hidden";
          layer.style.display = "none";
          layer.style.pointerEvents = "none";
        }
        return;
      }
      layer.style.display = "block";
      layer.style.visibility = "visible";
      layer.style.pointerEvents = "none";
    }

    const s = signals.story;
    const N = CHAPTERS.length; // Exactly 5
    const step = 1 / N;

    for (let i = 0; i < N; i++) {
      const panel = panelRefs.current[i];
      if (!panel) continue;

      // this panel's own rise (0 before its turn, 1 once fully up)
      const r = clamp01((s - i * step) / step);
      // how far the NEXT panel has risen over this one (0..1)
      const cov = i < N - 1 ? clamp01((s - (i + 1) * step) / step) : 0;

      // fully below the fold, or fully hidden behind the next panel → don't paint
      if (r <= 0.0006 || cov >= 0.9994) {
        if (panel.style.visibility !== "hidden") panel.style.visibility = "hidden";
        continue;
      }

      const re = easeOutCubic(r);
      const cove = easeInOutCubic(cov);

      // rise from 100% below to 0, with a slight settle-scale (always ≥1 → no edge gap)
      const ty = (1 - re) * 100;
      const scale = 1.08 - 0.08 * re;
      panel.style.visibility = "visible";
      panel.style.zIndex = String(i + 1);
      panel.style.transform = `translate3d(0, ${ty.toFixed(3)}%, 0) scale(${scale.toFixed(4)})`;

      // recede into shadow as the next chapter covers it
      const dim = dimRefs.current[i];
      if (dim) dim.style.opacity = (cove * 0.5).toFixed(3);

      // content reveals after the panel is mostly up, then fades as it's covered
      const content = contentRefs.current[i];
      if (content) {
        const appear = smoothstep(0.32, 0.98, r);
        content.style.opacity = (appear * (1 - cove * 0.9)).toFixed(3);
        const cy = (1 - appear) * 42 - cove * 26;
        content.style.transform = `translate3d(0, ${cy.toFixed(2)}px, 0)`;
      }
    }
  });

  return (
    <div className="story-layer" ref={layerRef} style={{ opacity: 0, visibility: "hidden", display: "none" }} aria-hidden>
      {CHAPTERS.map((c, i) => (
        <article
          key={c.n}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          className={styles.panel}
          style={{
            ...cssVars(c),
            transform: "translate3d(0, 100%, 0)",
            visibility: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.bg} src={c.img} alt="" draggable={false} />
          <span className={styles.scrim} />
          <span className={styles.glow} />
          <span className={styles.vignette} />
          <span className={styles.edge} />
          <span className={styles.counter}>{c.n} / 05</span>

          <div
            className={styles.content}
            ref={(el) => {
              contentRefs.current[i] = el;
            }}
            style={{ opacity: 0 }}
          >
            <span className={styles.kicker}>{c.kicker}</span>
            <h2 className={styles.title}>
              {c.title.map((line, li) => (
                <span key={li} className={styles.titleLine}>
                  {line}
                </span>
              ))}
            </h2>
            <span className={styles.rule} />
            <p className={styles.desc}>{c.desc}</p>
          </div>

          <span
            className={styles.dim}
            ref={(el) => {
              dimRefs.current[i] = el;
            }}
          />
        </article>
      ))}
    </div>
  );
}
