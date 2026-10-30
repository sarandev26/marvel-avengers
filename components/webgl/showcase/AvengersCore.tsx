"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { signals } from "@/lib/signals";

/*
// EXAMPLE: To swap in a custom 3D model (e.g. public/models/avengers-logo.glb):
// import { useGLTF } from "@react-three/drei";
// export function CustomModel() {
//   const { scene } = useGLTF("/models/avengers-logo.glb");
//   return <primitive object={scene} scale={1.5} />;
// }
*/

interface InfinityStone {
  name: string;
  color: number;
  emissive: number;
  size: number;
}

const STONES: InfinityStone[] = [
  { name: "Space", color: 0x2f6bff, emissive: 0x4d88ff, size: 0.09 },
  { name: "Power", color: 0x7b4dff, emissive: 0xa87aff, size: 0.09 },
  { name: "Reality", color: 0xff2a55, emissive: 0xff5c7a, size: 0.085 },
  { name: "Soul", color: 0xff7a3d, emissive: 0xff9966, size: 0.085 },
  { name: "Mind", color: 0xffd700, emissive: 0xffea66, size: 0.09 },
  { name: "Time", color: 0x00e599, emissive: 0x5cffb8, size: 0.08 },
];

/**
 * Procedural Avengers Arc-Reactor & Infinity Energy Core.
 * Dominant electric violet and blue glow, mechanical reactor housing,
 * and the six orbiting Infinity Stones.
 */
export default function AvengersCore() {
  const stonesRef = useRef<THREE.Group>(null);
  const coreOrbRef = useRef<THREE.MeshStandardMaterial>(null);
  const reactorRingRef = useRef<THREE.Mesh>(null);
  const baseGlowRef = useRef<THREE.MeshBasicMaterial>(null);

  const group = useMemo(() => {
    const g = new THREE.Group();

    // ── Metallic Materials ──
    const darkTitanium = new THREE.MeshStandardMaterial({
      color: 0x141026,
      metalness: 0.9,
      roughness: 0.22,
    });
    const silverAlloy = new THREE.MeshStandardMaterial({
      color: 0xa6b2d4,
      metalness: 0.95,
      roughness: 0.18,
    });
    const energyViolet = new THREE.MeshStandardMaterial({
      color: 0x24124d,
      emissive: new THREE.Color(0x7b4dff),
      emissiveIntensity: 2.2,
      metalness: 0.4,
      roughness: 0.3,
    });
    const energyBlue = new THREE.MeshStandardMaterial({
      color: 0x0f244a,
      emissive: new THREE.Color(0x2f6bff),
      emissiveIntensity: 2.0,
      metalness: 0.4,
      roughness: 0.3,
    });

    // ── Central Emissive Energy Orb ──
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xeef4ff,
      emissive: new THREE.Color(0x6ea8ff),
      emissiveIntensity: 2.8,
      roughness: 0.15,
      metalness: 0.2,
    });
    coreOrbRef.current = orbMat;

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 36, 36), orbMat);
    g.add(orb);

    // Inner glowing aura shell
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x7b4dff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const aura = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 32), auraMat);
    g.add(aura);

    // ── Arc Reactor Housing & Segmented Rings ──
    // Outer heavy chassis ring
    const outerChassis = new THREE.Mesh(
      new THREE.TorusGeometry(1.42, 0.08, 16, 64),
      darkTitanium
    );
    g.add(outerChassis);

    // Inner bevel ring with silver alloy
    const bevelRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.26, 0.05, 16, 64),
      silverAlloy
    );
    g.add(bevelRing);

    // Concentric energy ring
    const energyRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.08, 0.035, 16, 64),
      energyViolet
    );
    reactorRingRef.current = energyRing;
    g.add(energyRing);

    // Segmented mechanical reactor vanes (10 radial cooling plates)
    const vaneCount = 10;
    const vaneGeo = new THREE.BoxGeometry(0.12, 0.34, 0.18);
    for (let i = 0; i < vaneCount; i++) {
      const angle = (i / vaneCount) * Math.PI * 2;
      const vane = new THREE.Mesh(vaneGeo, silverAlloy);
      const r = 1.25;
      vane.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      vane.rotation.z = angle + Math.PI / 2;
      g.add(vane);

      // Accent insert on each vane
      const insert = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.16, 0.2),
        energyBlue
      );
      insert.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0.02);
      insert.rotation.z = angle + Math.PI / 2;
      g.add(insert);
    }

    // ── Six Infinity Stones Ring ──
    const stonesGroup = new THREE.Group();
    const stoneOrbitRadius = 0.88;
    STONES.forEach((st, i) => {
      const angle = (i / STONES.length) * Math.PI * 2;
      const stoneMat = new THREE.MeshStandardMaterial({
        color: st.color,
        emissive: new THREE.Color(st.emissive),
        emissiveIntensity: 2.6,
        roughness: 0.1,
        metalness: 0.6,
      });
      // Faceted gem geometry
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(st.size, 0),
        stoneMat
      );
      gem.position.set(
        Math.cos(angle) * stoneOrbitRadius,
        Math.sin(angle) * stoneOrbitRadius,
        0
      );
      gem.rotation.set(0.4, 0.6, angle);
      stonesGroup.add(gem);
    });
    stonesRef.current = stonesGroup;
    g.add(stonesGroup);

    // ── Ground Energy Flare Disc ──
    const baseMat = new THREE.MeshBasicMaterial({
      color: 0x7b4dff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    baseGlowRef.current = baseMat;
    const baseDisc = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), baseMat);
    baseDisc.rotation.x = -Math.PI / 2;
    baseDisc.position.y = -1.2;
    g.add(baseDisc);

    // Pre-mount: parked below screen initially so shaders compile on initial frame
    g.position.set(0, -10, 0);
    g.visible = true;
    return g;
  }, []);

  useEffect(() => {
    const g = group;
    return () => {
      g.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
    };
  }, [group]);

  useFrame((_, dt) => {
    const s = signals.showcase;
    const t = signals.time;

    // Keep perfectly centered on X and Z
    group.position.x = 0;
    group.position.z = 0;

    if (s <= 0.0005) {
      group.position.y = -10;
      return;
    }

    // Continuous smooth rise from bottom as Section 3 enters, and graceful sink as Section 4 (Tony Stark) rises
    const rise = THREE.MathUtils.smoothstep(s, 0, 0.22);
    const sink = signals.story > 0 ? THREE.MathUtils.smoothstep(signals.story, 0, 0.2) * 8.0 : 0;
    const targetY = THREE.MathUtils.lerp(-7.0, 0.0, rise) - sink;
    group.position.y += (targetY - group.position.y) * Math.min(1, dt * 7.0);

    const sc = 0.92 + rise * 0.08;
    group.scale.setScalar(sc);

    // Idle energy pulse & breathing
    const pulse = 1 + Math.sin(t * 1.8) * 0.02;
    group.scale.y = sc * pulse;

    // Rotate Infinity Stones around the core
    if (stonesRef.current) {
      stonesRef.current.rotation.z = t * 0.65;
      stonesRef.current.rotation.x = Math.sin(t * 0.5) * 0.15;
    }

    // Gentle spin of the reactor energy ring
    if (reactorRingRef.current) {
      reactorRingRef.current.rotation.z = -t * 0.35;
    }

    // Dynamic emissive intensity breathing
    if (coreOrbRef.current) {
      coreOrbRef.current.emissiveIntensity = 2.4 + Math.sin(t * 2.2) * 0.6;
    }
    if (baseGlowRef.current) {
      baseGlowRef.current.opacity = 0.22 + Math.sin(t * 1.8) * 0.08;
    }

    // Smooth rotation synchronized with character orbit cards
    const lookX = signals.mx * 0.22;
    const targetRotY = -signals.showcaseAngle * 0.45 + lookX + Math.sin(t * 0.25) * 0.04;
    group.rotation.y += (targetRotY - group.rotation.y) * Math.min(1, dt * 4.0);
    group.rotation.x = -signals.my * 0.05 + Math.sin(t * 0.4) * 0.015;
  });

  return <primitive object={group} />;
}

