"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { signals } from "@/lib/signals";

/**
 * Faint, thin-line Avengers "A" emblem in the deep 3D background.
 * Renders with additive glow at ~0.04 - 0.08 opacity, pulsing with cosmic energy.
 */
export default function AvengersEmblem() {
  const lineRef = useRef<THREE.LineSegments>(null);

  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];

    // 1. Outer circle ring
    const segments = 64;
    const radius = 3.2;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      // Skip gap where the arrow cuts out
      if (a1 > 0.1 && a1 < 0.6) continue;
      pts.push(
        new THREE.Vector3(Math.cos(a1) * radius, Math.sin(a1) * radius, 0),
        new THREE.Vector3(Math.cos(a2) * radius, Math.sin(a2) * radius, 0)
      );
    }

    // 2. The "A" Apex & Legs
    const apex = new THREE.Vector3(0.35, 2.8, 0);
    const leftBottom = new THREE.Vector3(-1.8, -2.5, 0);
    const rightBottom = new THREE.Vector3(1.6, -2.5, 0);

    // Left outer stroke
    pts.push(apex, leftBottom);
    // Right outer stroke
    pts.push(apex, rightBottom);

    // Inner A triangle / hole
    const innerApex = new THREE.Vector3(0.3, 1.4, 0);
    const innerLeft = new THREE.Vector3(-0.4, -0.2, 0);
    const innerRight = new THREE.Vector3(0.8, -0.2, 0);
    pts.push(innerApex, innerLeft);
    pts.push(innerLeft, innerRight);
    pts.push(innerRight, innerApex);

    // 3. Arrow crossbar / slash
    const arrowStart = new THREE.Vector3(-2.2, -0.2, 0);
    const arrowMid = new THREE.Vector3(2.6, -0.2, 0);
    const arrowTip = new THREE.Vector3(3.6, 0.4, 0);
    const arrowBack = new THREE.Vector3(2.2, 0.4, 0);
    pts.push(arrowStart, arrowMid);
    pts.push(arrowMid, arrowTip);
    pts.push(arrowTip, arrowBack);

    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    return geometry;
  }, []);

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0.04 },
        uColor: { value: new THREE.Color("#7b4dff") },
      },
      vertexShader: /* glsl */ `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, uOpacity);
        }
      `,
    });
  }, []);

  useFrame(() => {
    if (!lineRef.current) return;
    const baseOp = 0.035 + signals.energy * 0.035 + Math.sin(signals.time * 0.8) * 0.01;
    mat.uniforms.uOpacity.value = Math.max(0.02, Math.min(0.09, baseOp));
    // Subtle float / rotation
    lineRef.current.rotation.z = Math.sin(signals.time * 0.15) * 0.04;
    lineRef.current.position.y = Math.sin(signals.time * 0.3) * 0.1;
  });

  return (
    <group position={[0, 0, -6]}>
      <lineSegments ref={lineRef} geometry={geo} material={mat} />
    </group>
  );
}

