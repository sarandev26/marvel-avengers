"use client";

import AvengersCore from "./AvengersCore";

/**
 * Section 3 — Avengers Showcase.
 * Emissive 3D Avengers Arc-Reactor & Infinity Energy Core at centre,
 * illuminated by electric violet and blue rim lights.
 * The five character cards orbit around this centrepiece.
 */
export default function Showcase() {
  return (
    <>
      {/* Deep indigo-violet ambient */}
      <ambientLight color="#120c2b" intensity={1.3} />
      {/* Cool key light from the front-top */}
      <directionalLight color="#6ea8ff" intensity={2.8} position={[3.5, 5, 4]} />
      {/* Electric violet rim from behind */}
      <pointLight color="#7b4dff" intensity={28} distance={26} decay={2} position={[-4.2, 3, -3.2]} />
      {/* Electric blue fill from the front-right */}
      <pointLight color="#2f6bff" intensity={14} distance={20} decay={2} position={[4, 1.2, 3]} />
      {/* Warm spark underglow */}
      <pointLight color="#ff7a3d" intensity={6} distance={10} decay={2} position={[0, -1.6, 1.5]} />

      <AvengersCore />
    </>
  );
}
