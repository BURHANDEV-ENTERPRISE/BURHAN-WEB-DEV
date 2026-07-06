"use client";

// Struktur bilik gamer: lantai, dinding, tingkap malam, neon sign
// BURHANDEV, LED strip RGB, dan rak props. Semua texture dijana lokal.

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { applyHue } from "./screens";

function makeNeonTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 200;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.font = "400 118px Impact, 'Arial Black', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#ff3b3b";
  ctx.shadowBlur = 42;
  ctx.strokeStyle = "#ff6b6b";
  ctx.lineWidth = 5;
  ctx.strokeText("BURHANDEV", 512, 104);
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#ffe8e0";
  ctx.fillText("BURHANDEV", 512, 104);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWindowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 192;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#0b1030");
  grad.addColorStop(0.6, "#141a3f");
  grad.addColorStop(1, "#241a3a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, c.width, c.height);
  // Bintang deterministik
  for (let i = 0; i < 46; i++) {
    const x = (i * 53.7) % 256;
    const y = (i * 37.3) % 150;
    ctx.globalAlpha = 0.35 + ((i * 7) % 10) / 16;
    ctx.fillStyle = "#e7ecff";
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
  ctx.globalAlpha = 1;
  // Bulan
  ctx.fillStyle = "#f4edd8";
  ctx.shadowColor = "#f4edd8";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(198, 44, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Siluet bandar
  ctx.fillStyle = "#080b1c";
  for (let i = 0; i < 9; i++) {
    const bw = 18 + ((i * 13) % 20);
    const bh = 28 + ((i * 29) % 46);
    ctx.fillRect(i * 30 - 6, c.height - bh, bw, bh);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface RoomShellProps {
  reducedMotion: boolean;
}

export default function RoomShell({ reducedMotion }: RoomShellProps) {
  const neonTex = useMemo(makeNeonTexture, []);
  const windowTex = useMemo(makeWindowTexture, []);
  const neonMat = useRef<THREE.MeshBasicMaterial>(null!);
  const neonLight = useRef<THREE.PointLight>(null!);
  const ledMat = useRef<THREE.MeshBasicMaterial>(null!);
  const ledMat2 = useRef<THREE.MeshBasicMaterial>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Neon "breathing"
    const pulse = reducedMotion ? 1 : 0.82 + Math.sin(t * 1.35) * 0.18;
    if (neonMat.current) neonMat.current.opacity = pulse;
    if (neonLight.current) neonLight.current.intensity = 1.5 * pulse;
    // LED strip RGB berkitar
    applyHue(ledMat.current, t, 0, reducedMotion);
    applyHue(ledMat2.current, t, 0.33, reducedMotion);
  });

  return (
    <group>
      {/* Lantai */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.4]}>
        <planeGeometry args={[10, 7]} />
        <meshStandardMaterial color="#231610" roughness={0.92} />
      </mesh>

      {/* Permaidani bulat bawah kerusi */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.006, -0.5]}>
        <circleGeometry args={[1.25, 40]} />
        <meshStandardMaterial color="#5c1212" roughness={1} />
      </mesh>

      {/* Dinding belakang */}
      <mesh position={[0, 1.7, -2.3]}>
        <planeGeometry args={[10, 3.6]} />
        <meshStandardMaterial color="#1a110c" roughness={0.95} />
      </mesh>

      {/* Dinding kiri & kanan */}
      <mesh position={[-3.9, 1.7, -0.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[7, 3.6]} />
        <meshStandardMaterial color="#150d09" roughness={0.95} />
      </mesh>
      <mesh position={[3.9, 1.7, -0.4]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[7, 3.6]} />
        <meshStandardMaterial color="#150d09" roughness={0.95} />
      </mesh>

      {/* Skirting dinding belakang */}
      <mesh position={[0, 0.05, -2.27]}>
        <boxGeometry args={[10, 0.1, 0.04]} />
        <meshStandardMaterial color="#0d0806" roughness={0.8} />
      </mesh>

      {/* Tingkap malam — bingkai + kaca */}
      <group position={[-2.05, 1.85, -2.28]}>
        <mesh>
          <boxGeometry args={[1.75, 1.3, 0.07]} />
          <meshStandardMaterial color="#0c0805" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[1.58, 1.14]} />
          <meshBasicMaterial map={windowTex} toneMapped={false} />
        </mesh>
        {/* Palang tingkap */}
        <mesh position={[0, 0, 0.055]}>
          <boxGeometry args={[0.04, 1.14, 0.02]} />
          <meshStandardMaterial color="#0c0805" />
        </mesh>
        <mesh position={[0, 0, 0.055]}>
          <boxGeometry args={[1.58, 0.04, 0.02]} />
          <meshStandardMaterial color="#0c0805" />
        </mesh>
      </group>

      {/* Neon sign BURHANDEV */}
      <mesh position={[0.55, 2.35, -2.27]}>
        <planeGeometry args={[2.5, 0.49]} />
        <meshBasicMaterial
          ref={neonMat}
          map={neonTex}
          transparent
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={neonLight}
        position={[0.55, 2.3, -1.9]}
        color="#ff4545"
        intensity={1.5}
        distance={4.5}
      />

      {/* LED strip RGB — tepi atas dinding & belakang meja */}
      <mesh position={[0, 2.95, -2.26]}>
        <boxGeometry args={[9.6, 0.045, 0.045]} />
        <meshBasicMaterial ref={ledMat} toneMapped={false} />
      </mesh>
      <mesh position={[0.1, 0.045, -1.72]}>
        <boxGeometry args={[2.6, 0.03, 0.03]} />
        <meshBasicMaterial ref={ledMat2} toneMapped={false} />
      </mesh>

      {/* Rak dinding + props */}
      <group position={[2.35, 1.9, -2.05]}>
        <mesh>
          <boxGeometry args={[1.55, 0.05, 0.4]} />
          <meshStandardMaterial color="#2c1b10" roughness={0.6} />
        </mesh>
        {/* Buku bersandar */}
        {[
          { x: -0.55, c: "#7f1d1d", h: 0.3, r: 0.06 },
          { x: -0.44, c: "#274060", h: 0.34, r: 0 },
          { x: -0.33, c: "#c8a455", h: 0.28, r: -0.1 },
        ].map((b, i) => (
          <mesh key={i} position={[b.x, 0.17, 0]} rotation={[0, 0, b.r]}>
            <boxGeometry args={[0.07, b.h, 0.24]} />
            <meshStandardMaterial color={b.c} roughness={0.8} />
          </mesh>
        ))}
        {/* Trofi */}
        <group position={[0.12, 0.03, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.07, 12]} />
            <meshStandardMaterial color="#3a2418" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.075, 14, 12]} />
            <meshStandardMaterial
              color="#e8b93c"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
        </group>
        {/* Kepala voxel hijau mini */}
        <group position={[0.62, 0.115, 0]} rotation={[0, -0.4, 0]}>
          <mesh>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshStandardMaterial color="#5c8a3c" roughness={0.85} />
          </mesh>
          <mesh position={[-0.045, 0.015, 0.091]}>
            <planeGeometry args={[0.035, 0.035]} />
            <meshBasicMaterial color="#1c2312" />
          </mesh>
          <mesh position={[0.045, 0.015, 0.091]}>
            <planeGeometry args={[0.035, 0.035]} />
            <meshBasicMaterial color="#1c2312" />
          </mesh>
        </group>
      </group>

      {/* Poster berbingkai */}
      <group position={[2.0, 1.15, -2.27]}>
        <mesh>
          <boxGeometry args={[0.62, 0.82, 0.04]} />
          <meshStandardMaterial color="#0c0805" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.52, 0.72]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.12, 0.03]}>
          <planeGeometry args={[0.36, 0.05]} />
          <meshBasicMaterial color="#fff6dc" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.02, 0.03]}>
          <planeGeometry args={[0.28, 0.05]} />
          <meshBasicMaterial color="#fff6dc" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.16, 0.03]}>
          <planeGeometry args={[0.32, 0.05]} />
          <meshBasicMaterial color="#fff6dc" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
