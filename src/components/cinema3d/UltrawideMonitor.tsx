"use client";

// Monitor ultrawide melengkung — focal point scene. Permukaan dalam
// silinder memaparkan ilustrasi anime animated (leaves + face reveal)
// dan bertindak sebagai sumber cahaya utama bilik (tint olive #c8d96f).

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createIllustrationScreen } from "./textures";

const ARC = 1.05;          // lebar arka (rad)
const RADIUS = 1.55;       // jejari lengkung skrin
const CENTER: [number, number, number] = [0.12, 1.34, -0.28]; // paksi silinder

interface UltrawideMonitorProps {
  reducedMotion: boolean;
  /** 0..1 kemajuan scroll — memandu reveal ilustrasi */
  progressRef: React.MutableRefObject<number>;
}

export default function UltrawideMonitor({
  reducedMotion,
  progressRef,
}: UltrawideMonitorProps) {
  const screen = useMemo(createIllustrationScreen, []);
  const glow = useRef<THREE.PointLight>(null!);
  const lastDraw = useRef(-1);

  useEffect(() => {
    // Texture silinder BackSide terbalik arah U — flip untuk betulkan teks
    screen.texture.wrapS = THREE.RepeatWrapping;
    screen.texture.repeat.x = -1;
    screen.draw(0, reducedMotion ? 1 : 0);
    return () => screen.dispose();
  }, [screen, reducedMotion]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Reveal daun/muka dipandu scroll (penuh pada stage push-in)
    const reveal = reducedMotion
      ? 1
      : Math.min(1, Math.max(0, (progressRef.current - 0.12) / 0.33));
    if (!reducedMotion && t - lastDraw.current > 0.12) {
      lastDraw.current = t;
      screen.draw(t, reveal);
    }
    // Monitor = cahaya utama; flicker halus macam skrin sebenar
    if (glow.current) {
      glow.current.intensity =
        2.6 + (reducedMotion ? 0 : Math.sin(t * 8.3) * 0.08 + Math.sin(t * 1.7) * 0.22);
    }
  });

  const thetaStart = Math.PI - ARC / 2;

  return (
    <group>
      {/* Bezel melengkung (belakang skrin) */}
      <mesh position={CENTER}>
        <cylinderGeometry
          args={[RADIUS + 0.035, RADIUS + 0.035, 0.7, 48, 1, true, thetaStart - 0.03, ARC + 0.06]}
        />
        <meshStandardMaterial color="#0c0a08" roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
      {/* Skrin — permukaan dalam silinder */}
      <mesh position={CENTER}>
        <cylinderGeometry args={[RADIUS, RADIUS, 0.62, 48, 1, true, thetaStart, ARC]} />
        <meshBasicMaterial map={screen.texture} toneMapped={false} side={THREE.BackSide} />
      </mesh>
      {/* Stand + tapak */}
      <mesh position={[0.12, 0.87, -1.72]}>
        <boxGeometry args={[0.07, 0.28, 0.07]} />
        <meshStandardMaterial color="#100c0a" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0.12, 0.78, -1.62]}>
        <boxGeometry args={[0.5, 0.024, 0.26]} />
        <meshStandardMaterial color="#100c0a" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* Bias light belakang monitor — strip olive di dinding */}
      <mesh position={[0.12, 1.34, -2.28]}>
        <planeGeometry args={[2.1, 0.9]} />
        <meshBasicMaterial color="#33390f" toneMapped={false} transparent opacity={0.5} />
      </mesh>
      {/* Cahaya utama bilik dari skrin — tint olive */}
      <pointLight
        ref={glow}
        position={[0.12, 1.34, -0.85]}
        color="#c8d96f"
        intensity={2.6}
        distance={5.5}
        decay={1.8}
      />
    </group>
  );
}
