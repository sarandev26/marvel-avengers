"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLSL_SIMPLEX, GLSL_FBM } from "@/lib/glsl";
import { signals } from "@/lib/signals";

type LayerCfg = {
  z: number;
  w: number;
  h: number;
  scale: number;
  speed: number;
  opacity: number;
  additive: boolean;
  color: string;
  color2: string;
  seed: number;
};

const LAYERS: LayerCfg[] = [
  // Deep indigo void and cosmic violet shadows
  { z: -7, w: 46, h: 28, scale: 2.1, speed: 0.5, opacity: 0.12, additive: true, color: "#070417", color2: "#160938", seed: 0.0 },
  { z: -4, w: 38, h: 24, scale: 2.6, speed: 0.85, opacity: 0.09, additive: true, color: "#160938", color2: "#231154", seed: 3.1 },
  { z: -1.5, w: 30, h: 19, scale: 3.2, speed: 1.2, opacity: 0.08, additive: true, color: "#231154", color2: "#4a2399", seed: 6.2 },
];

/**
 * Fake-volumetric atmosphere. Camera-facing fbm planes at several depths —
 * dark cosmic violet bodies for occlusion + additive electric violet/blue haze for
 * volumetric lighting.
 */
export default function VolumetricFog() {
  const group = useMemo(() => {
    const g = new THREE.Group();
    for (const cfg of LAYERS) {
      const geo = new THREE.PlaneGeometry(cfg.w, cfg.h, 1, 1);
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: cfg.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uEnergy: { value: 0 },
          uFlash: { value: 0 },
          uCollapse: { value: 0 },
          uOpacity: { value: cfg.opacity },
          uScale: { value: cfg.scale },
          uSpeed: { value: cfg.speed },
          uSeed: { value: cfg.seed },
          uColor: { value: new THREE.Color(cfg.color) },
          uColor2: { value: new THREE.Color(cfg.color2) },
          uAdditive: { value: cfg.additive ? 1 : 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          varying vec2 vUv;
          uniform float uTime, uEnergy, uFlash, uCollapse, uOpacity, uScale, uSpeed, uSeed, uAdditive;
          uniform vec3 uColor, uColor2;
          ${GLSL_SIMPLEX}
          ${GLSL_FBM}
          void main(){
            vec2 uv = vUv;
            float t = uTime * 0.06 * uSpeed;
            vec3 p = vec3(uv * uScale, uSeed + t);
            p.x += t * 0.6;
            float n = fbm(p) * 0.5 + 0.5;
            float wisp = pow(n, 1.5);

            vec2 c = uv - 0.5;
            float fall = smoothstep(0.6, 0.08, length(c));

            float bright = 0.06 + uEnergy * 0.22 + uFlash * 0.28 + uCollapse * 0.16;
            vec3 col = mix(uColor, uColor2, n) * bright;

            float a = wisp * fall * uOpacity * (0.3 + uEnergy * 0.22 + uFlash * 0.3);
            if(uAdditive > 0.5) a = max(a, 0.0);
            gl_FragColor = vec4(col, a);
          }
        `,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = cfg.z;
      mesh.renderOrder = cfg.additive ? 2 : 0;
      g.add(mesh);
    }
    return g;
  }, []);

  useEffect(() => {
    const g = group;
    return () => {
      g.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        (m.material as THREE.Material)?.dispose?.();
      });
    };
  }, [group]);

  useFrame(() => {
    for (const child of group.children) {
      const u = ((child as THREE.Mesh).material as THREE.ShaderMaterial).uniforms;
      u.uTime.value = signals.time;
      u.uEnergy.value = signals.energy;
      u.uFlash.value = signals.flash;
      u.uCollapse.value = signals.collapse;
    }
  });

  return <primitive object={group} />;
}
