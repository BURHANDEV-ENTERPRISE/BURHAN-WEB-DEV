"use client";

// Hero 3D: bilik gamer/coder BURHANDEV.
// - Cursor parallax (dimatikan bila reduced motion)
// - Skrin monitor hidup, RGB breathing, hotspot klik
// Satu WebGL context sahaja; semua texture dijana lokal.

import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import RoomShell from "./RoomShell";
import DeskSetup from "./DeskSetup";
import VoxelMascot from "./VoxelMascot";

export type HotspotTarget = "services" | "contact";

interface GamerRoom3DProps {
  reducedMotion?: boolean;
  /** true bila hero di luar viewport / tab hidden — hentikan render loop */
  paused?: boolean;
  /** 0..1 progress scroll keluar hero — zoom-in + pusing bilik */
  scrollRef?: React.MutableRefObject<number>;
  onHotspot?: (target: HotspotTarget) => void;
}

/* Kamera: sasarkan meja + fov responsif untuk skrin sempit */
function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    const portrait = size.width / size.height < 0.8;
    persp.fov = portrait ? 58 : 42;
    persp.position.set(0, 1.6, portrait ? 4.3 : 3.25);
    persp.lookAt(0.1, 1.05, -1.35);
    persp.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

/* Parallax kursor + scroll: pusing bilik ikut mouse, zoom-in bila scroll keluar */
function ParallaxRig({
  reducedMotion,
  scrollRef,
  children,
}: {
  reducedMotion: boolean;
  scrollRef?: React.MutableRefObject<number>;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null!);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  useFrame(() => {
    if (!group.current) return;
    const tx = reducedMotion ? 0 : target.current.x;
    const ty = reducedMotion ? 0 : target.current.y;
    const sp = reducedMotion ? 0 : scrollRef?.current ?? 0;
    // Scroll menolak bilik ke arah kamera (zoom) + pusing sedikit
    group.current.rotation.y +=
      (-tx * 0.055 + sp * 0.22 - group.current.rotation.y) * 0.05;
    group.current.rotation.x +=
      (-ty * 0.03 + sp * 0.05 - group.current.rotation.x) * 0.05;
    group.current.position.z += (sp * 1.35 - group.current.position.z) * 0.06;
    group.current.position.y += (-sp * 0.25 - group.current.position.y) * 0.06;
  });

  return <group ref={group}>{children}</group>;
}

export default function GamerRoom3D({
  reducedMotion = false,
  paused = false,
  scrollRef,
  onHotspot,
}: GamerRoom3DProps) {
  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      camera={{ position: [0, 1.6, 3.25], fov: 42 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0e0806"]} />
      <fog attach="fog" args={["#0e0806", 7, 13]} />
      <CameraRig />

      {/* Lampu: malam + skrin + lampu meja warm */}
      <ambientLight intensity={0.38} color="#7c86b8" />
      <directionalLight position={[2.5, 3.4, 2.8]} intensity={0.5} color="#aab4d4" />
      <pointLight position={[0.1, 1.5, -0.9]} intensity={1.7} color="#9fd8ff" distance={3.6} />
      <pointLight position={[-1.9, 1.4, -1.4]} intensity={1.2} color="#ffb45e" distance={4.2} />
      <pointLight position={[1.75, 0.75, -0.9]} intensity={1.1} color="#c084fc" distance={3.2} />

      <ParallaxRig reducedMotion={reducedMotion} scrollRef={scrollRef}>
        <RoomShell reducedMotion={reducedMotion} />
        <DeskSetup reducedMotion={reducedMotion} paused={paused} onHotspot={onHotspot} />
        <VoxelMascot reducedMotion={reducedMotion} />
      </ParallaxRig>
    </Canvas>
  );
}
