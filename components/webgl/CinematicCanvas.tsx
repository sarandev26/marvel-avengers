"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import SceneDriver from "./SceneDriver";
import CameraRig from "./CameraRig";
import ParticleField from "./ParticleField";
import VolumetricFog from "./VolumetricFog";
import Lightning from "./Lightning";
import Sparks from "./Sparks";
import Portal from "./Portal";
import AvengersEmblem from "./AvengersEmblem";
import Showcase from "./showcase/Showcase";

/**
 * Cosmic atmosphere layer — a TRANSPARENT WebGL canvas that sits on top of
 * the DOM `<video>` trailers (see VideoLayer). Everything here is additive
 * (particles, fog, lightning, portal) glowing in electric violet, electric blue,
 * and warm cosmic embers over the footage.
 */
export default function CinematicCanvas() {
  return (
    <Canvas
      className="canvas-layer"
      gl={{
        antialias: false,
        alpha: true,
        stencil: false,
        depth: true,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 120 }}
      onCreated={({ gl, scene, camera }) => {
        gl.setClearColor(0x000000, 0); // fully transparent so the video shows
        scene.background = null;
        try {
          gl.compile(scene, camera);
        } catch {
          /* noop */
        }
      }}
    >
      <SceneDriver />
      <CameraRig />

      {/* Faint Avengers "A" emblem in deep background */}
      <AvengersEmblem />

      {/* Deep cosmic void dust */}
      <ParticleField
        mode="dust"
        count={7000}
        colorA="#2b1580"
        colorB="#6ea8ff"
        size={3.8}
        spread={[38, 22, 18]}
        drift={1}
        mouseStrength={1.2}
        opacity={0.5}
      />

      <VolumetricFog />

      {/* Warm cosmic spark embers drifting in front — atmosphere over footage */}
      <ParticleField
        mode="ember"
        count={1400}
        colorA="#ff7a3d"
        colorB="#ffd15a"
        size={4.8}
        spread={[26, 20, 9]}
        rise={1.5}
        drift={0.6}
        mouseStrength={0.5}
        opacity={0.55}
      />

      <Lightning />
      <Sparks />
      <Portal />

      {/* Phase 2 · Section 3 — Avengers 3D Core showcase */}
      <Showcase />

      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
