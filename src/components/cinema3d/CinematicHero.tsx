"use client";

// Hero cinematic: kamera dolly/orbit 4 stage dipandu scroll progress,
// dengan Bloom + Vignette + DepthOfField (desktop). Reduced motion =
// satu shot statik tanpa postprocessing.

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";
import CozyRoom from "./CozyRoom";
import PlantHex from "./PlantHex";
import UltrawideMonitor from "./UltrawideMonitor";

/* Keyframe kamera: wide → push monitor → orbit meja → close-up keyboard */
const KEYS: Array<{ pos: [number, number, number]; tgt: [number, number, number] }> = [
  { pos: [2.9, 2.1, 3.2],   tgt: [0.0, 1.2, -1.2] },
  { pos: [0.14, 1.42, 0.92], tgt: [0.12, 1.3, -1.8] },
  { pos: [-2.3, 1.52, 0.66], tgt: [0.15, 1.1, -1.4] },
  { pos: [-0.32, 1.38, -0.22], tgt: [0.26, 0.79, -1.04] },
];

const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

interface RigProps {
  progressRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
  dofRef: React.MutableRefObject<{ bokehScale: number } | null>;
}

function CameraRig({ progressRef, reducedMotion, dofRef }: RigProps) {
  const { camera, size } = useThree();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = size.width / size.height < 0.8 ? 56 : 40;
    persp.updateProjectionMatrix();
  }, [camera, size]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const portrait = size.width / size.height < 0.8;
    const p = reducedMotion ? 0.42 : THREE.MathUtils.clamp(progressRef.current, 0, 1);

    // Segmen + easing sinematik
    const seg = Math.min(KEYS.length - 2, Math.floor(p * (KEYS.length - 1)));
    const u = easeInOut(p * (KEYS.length - 1) - seg);
    pos.copy(a.fromArray(KEYS[seg].pos).lerp(b.fromArray(KEYS[seg + 1].pos), u));
    tgt.copy(a.fromArray(KEYS[seg].tgt).lerp(b.fromArray(KEYS[seg + 1].tgt), u));

    // Nafas handheld halus
    if (!reducedMotion) {
      pos.x += Math.sin(t * 0.5) * 0.018;
      pos.y += Math.sin(t * 0.72) * 0.014;
    }
    if (portrait) {
      pos.z += 1.05;
      pos.x *= 0.85;
    }

    camera.position.lerp(pos, reducedMotion ? 1 : 0.09);
    camera.lookAt(tgt);

    // DoF menebal ketika transisi antara stage (puncak tengah segmen)
    if (dofRef.current) {
      const transition = Math.sin(Math.min(1, Math.max(0, u)) * Math.PI);
      dofRef.current.bokehScale = 1.1 + transition * 2.4;
    }
  });

  return null;
}

function Effects({
  reducedMotion,
  dofRef,
}: {
  reducedMotion: boolean;
  dofRef: React.MutableRefObject<{ bokehScale: number } | null>;
}) {
  const { size } = useThree();
  if (reducedMotion) return null;
  const desktop = size.width / size.height >= 0.9;
  if (!desktop) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.85} luminanceThreshold={0.28} luminanceSmoothing={0.18} mipmapBlur />
        <Vignette eskil={false} offset={0.22} darkness={0.78} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={0}>
      <DepthOfField
        ref={dofRef as React.Ref<never>}
        focusDistance={0.055}
        focalLength={0.16}
        bokehScale={1.4}
      />
      <Bloom intensity={0.85} luminanceThreshold={0.28} luminanceSmoothing={0.18} mipmapBlur />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
    </EffectComposer>
  );
}

interface CinematicHeroProps {
  reducedMotion?: boolean;
  paused?: boolean;
  progressRef: React.MutableRefObject<number>;
}

export default function CinematicHero({
  reducedMotion = false,
  paused = false,
  progressRef,
}: CinematicHeroProps) {
  const dofRef = useRef<{ bokehScale: number } | null>(null);

  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      camera={{ position: [2.9, 2.1, 3.2], fov: 40 }}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#120708"]} />
      <fog attach="fog" args={["#120708", 6.5, 12.5]} />

      {/* Ambient rendah — monitor jadi cahaya utama; rim maroon kanan */}
      <ambientLight intensity={0.16} color="#4a3d55" />
      <pointLight position={[3.1, 1.2, 0.4]} color="#6e1f1f" intensity={0.9} distance={5} />
      <pointLight position={[-2.6, 0.6, 1.4]} color="#2f3550" intensity={0.5} distance={5} />

      <CameraRig progressRef={progressRef} reducedMotion={reducedMotion} dofRef={dofRef} />
      <CozyRoom />
      <UltrawideMonitor reducedMotion={reducedMotion} progressRef={progressRef} />
      <PlantHex reducedMotion={reducedMotion} />
      <Effects reducedMotion={reducedMotion} dofRef={dofRef} />
    </Canvas>
  );
}
