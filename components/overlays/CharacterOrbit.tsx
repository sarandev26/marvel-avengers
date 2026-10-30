"use client";

import { useEffect, useRef, useState } from "react";
import { signals } from "@/lib/signals";
import { VIDEO_MANIFEST, type VideoSlotId } from "@/lib/constants";
import { useRaf } from "@/lib/useRaf";
import styles from "./orbit.module.css";

interface Character {
  slot: VideoSlotId;
  name: string;
  tag: string;
  desc: string;
}

const CHARACTERS: Character[] = [
  {
    slot: "cardWanda",
    name: "Wanda Maximoff",
    tag: "Scarlet Witch",
    desc: "Wielder of chaos magic, bending reality with incandescent psionic wrath.",
  },
  {
    slot: "cardThanos",
    name: "Thanos",
    tag: "The Mad Titan",
    desc: "Conqueror driven by cosmic balance, relentless in pursuit of the ultimate power.",
  },
  {
    slot: "cardBlackPanther",
    name: "Black Panther",
    tag: "King of Wakanda",
    desc: "Clad in royal vibranium and ancient fury, defending his people with unbreakable resolve.",
  },
  {
    slot: "cardSpiderMan",
    name: "Spider-Man",
    tag: "The Web-Slinger",
    desc: "Bound by responsibility and heart, leaping fearlessly into impossible battles.",
  },
  {
    slot: "cardDoctorStrange",
    name: "Doctor Strange",
    tag: "Sorcerer Supreme",
    desc: "Master of the mystic arts, guarding the cosmic timeline against total dimensional collapse.",
  },
];

const TAU = Math.PI * 2;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function CharacterOrbit() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const smoothedAngle = useRef(0);
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (!v) return;
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
    });
  }, []);

  useRaf(() => {
    const s = signals.showcase;
    const t = signals.time;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const wantPlay = s > 0.004;
    const N = CHARACTERS.length; // Exactly 5

    // Eased interpolation for the orbit angle matching the Avengers 3D core
    const targetAngle = s * TAU * 1.0;
    smoothedAngle.current += (targetAngle - smoothedAngle.current) * 0.12;
    const base = smoothedAngle.current + t * 0.035;
    signals.showcaseAngle = base;

    const isMobile = vw < 768;
    const isTiny = vw < 480;

    // Responsive 3D orbit radius so cards stay fully within screen bounds on all devices
    const R = isMobile
      ? Math.min(vw * 0.35, vh * 0.22)
      : Math.min(vw * 0.32, vh * 0.40);
    const Rx = R;
    const Rz = R * (isMobile ? 0.6 : 0.75);
    const Ry = R * (isMobile ? 0.08 : 0.15);

    // Smooth enter on showcase start, and smooth fade-out as Section 4 (Tony Stark) rises
    const enter = smoothstep(0, 0.15, s) * (1 - smoothstep(0, 0.25, signals.story));

    for (let i = 0; i < N; i++) {
      const vid = videoRefs.current[i];
      if (vid && !videoErrors[CHARACTERS[i].slot]) {
        if (wantPlay && vid.paused) vid.play().catch(() => {});
        else if (!wantPlay && s < 0.002 && !vid.paused) vid.pause();
      }

      const card = cardRefs.current[i];
      if (!card) continue;

      if (enter <= 0.001) {
        if (card.style.visibility !== "hidden") card.style.visibility = "hidden";
        continue;
      }
      card.style.visibility = "visible";

      // 72 degree spacing
      const theta = base + i * (TAU / N);
      const d = Math.cos(theta); // 1 = front, -1 = behind centrepiece
      const depth01 = (d + 1) / 2;
      const x = Math.sin(theta) * Rx;
      const z = d * Rz;
      const y = -d * Ry;
      const baseScale = isTiny ? 0.78 : isMobile ? 0.88 : 1.0;
      const scale = lerp(0.55, 1.02, depth01) * lerp(0.65, 1, enter) * baseScale;
      const rotY = -Math.sin(theta) * 16;

      card.style.transform =
        `translate(-50%, -50%) perspective(1200px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px)` +
        ` rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity = (lerp(0.28, 1, depth01) * enter).toFixed(3);
      // straddle the atmosphere/centrepiece canvas (z3): front (z4), back (z2)
      card.style.zIndex = d > 0 ? "4" : "2";
      // depth blur on the far cards
      card.style.filter = d < -0.1 ? `blur(${(-d * 3.5).toFixed(2)}px)` : "none";
      // violet glow strongest on the active front card
      card.style.setProperty("--glow", smoothstep(0.65, 1, depth01).toFixed(3));
    }
  });

  return (
    <div className={styles.layer} aria-hidden>
      {CHARACTERS.map((c, i) => {
        const manifest = VIDEO_MANIFEST[c.slot];
        const hasErr = videoErrors[c.slot];

        return (
          <div
            key={c.slot}
            className={styles.card}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            style={{ visibility: "hidden" }}
          >
            {!hasErr ? (
              <video
                ref={(el) => {
                  if (el) {
                    el.muted = true;
                    el.playsInline = true;
                  }
                  videoRefs.current[i] = el;
                }}
                className={styles.video}
                src={manifest.src}
                poster={manifest.poster}
                muted
                loop
                playsInline
                preload="auto"
                disablePictureInPicture
                onError={() =>
                  setVideoErrors((prev) => ({ ...prev, [c.slot]: true }))
                }
              />
            ) : (
              <div className={styles.placeholderBackdrop}>
                <span className={styles.placeholderLabel}>{c.name}</span>
              </div>
            )}
            <div className={styles.grad} />
            <div className={styles.frame} />
            <div className={styles.tick}>
              <span className={styles.dot} />
              {`0${i + 1} · ${c.tag.toUpperCase()}`}
            </div>
            <div className={styles.info}>
              <div className={styles.name}>{c.name}</div>
              <div className={styles.desc}>{c.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
