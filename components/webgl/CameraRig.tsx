"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { signals } from "@/lib/signals";

const target = new THREE.Vector3();

/**
 * Cinematic camera. Stays anchored ~6u back and sells motion through:
 *  - pointer parallax (the scene leans with the cursor)
 *  - additive shake driven by lightning strikes / the detonation
 *  - a subtle forward dolly for the portal dive + scroll push
 * The camera never physically flies through geometry — the portal rushes the
 * lens instead — which keeps the fullscreen video planes perfectly framed.
 */
export default function CameraRig() {
  useFrame((state) => {
    const cam = state.camera;
    const t = signals.time;
    const shake = signals.shake;

    const sx = (Math.sin(t * 54.0) + Math.sin(t * 97.3)) * 0.5 * shake * 0.4;
    const sy = (Math.cos(t * 61.0) + Math.sin(t * 88.7)) * 0.5 * shake * 0.4;

    // Section 3 (showcase): perfectly centered with subtle push-in and zero drift
    // so the 3D model and DOM orbit cards share the exact same center.
    const sc = signals.showcase;

    // Section 5 (finale): a slow breathing float + a touch of push-in.
    const fin = Math.max(signals.warOp, signals.snapOp);
    const finFloatX = Math.sin(t * 0.09) * 0.18 * fin;
    const finFloatY = Math.cos(t * 0.11) * 0.12 * fin;

    // Zero out drift during showcase (sc) so core never shifts off-center
    const tx = signals.mx * (0.6 * (1 - sc * 0.6)) + sx * (1 - sc) + finFloatX;
    const ty = signals.my * (0.4 * (1 - sc * 0.6)) + sy * (1 - sc) + finFloatY;
    // Responsive camera distance: slightly further back on narrow portrait screens
    const isMobile = state.size.width < 768;
    const baseZ = isMobile ? 7.2 : 6.0;
    const tz = baseZ - signals.dolly * 1.7 - sc * 0.85 - fin * 0.7;

    cam.position.x += (tx - cam.position.x) * 0.08;
    cam.position.y += (ty - cam.position.y) * 0.08;
    cam.position.z += (tz - cam.position.z) * 0.08;

    target.set(signals.mx * -0.18 * (1 - sc), signals.my * -0.12 * (1 - sc), 0);
    cam.lookAt(target);

    // roll from shake, applied after lookAt
    const roll = shake * Math.sin(t * 40.0) * 0.03;
    cam.rotateZ(roll);
  });

  return null;
}
