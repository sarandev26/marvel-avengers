"use client";

import { useExperience } from "@/lib/store";
import styles from "./loading.module.css";

/**
 * Minimal cinematic loader.
 * Gates the experience until scrub videos have decoded initial frames (readyState >= 2),
 * the WebGL canvas has rendered its first frame, and fonts are ready.
 * Fades out smoothly with no abrupt flash or blank screen.
 */
export default function LoadingScreen() {
  const ready = useExperience((s) => s.ready);

  return (
    <div
      className={`${styles.overlay} ${ready ? styles.ready : ""}`}
      aria-hidden={ready}
    >
      <div className={styles.center}>
        <div className={styles.brand}>MARVEL STUDIOS</div>
        <div className={styles.title}>AVENGERS</div>
        <div className={styles.meter}>
          <div className={styles.fill} />
        </div>
      </div>
    </div>
  );
}

