"use client";

// Bilik gaming cozy gelap: dinding maroon, meja, desk mat HUD, keyboard
// mekanikal, mouse, lampu arm prosedural, rak + vinyl toys blind-box.

import React, { useMemo } from "react";
import * as THREE from "three";
import { createDeskMatTexture, createKeysTexture } from "./textures";

const TOYS: Array<{ x: number; body: string; ear: string }> = [
  { x: 0.28, body: "#f0ead6", ear: "#6e1f1f" },
  { x: 0.5, body: "#6e1f1f", ear: "#f0ead6" },
  { x: 0.72, body: "#c8d96f", ear: "#3a2418" },
];

function VinylToy({ body, ear }: { body: string; ear: string }) {
  return (
    <group>
      <mesh position={[0, 0.055, 0]}>
        <capsuleGeometry args={[0.045, 0.05, 4, 10]} />
        <meshStandardMaterial color={body} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.135, 0]}>
        <sphereGeometry args={[0.052, 12, 10]} />
        <meshStandardMaterial color={body} roughness={0.35} />
      </mesh>
      {[-0.03, 0.03].map((ex, i) => (
        <mesh key={i} position={[ex, 0.185, 0]} rotation={[0, 0, ex < 0 ? 0.3 : -0.3]}>
          <coneGeometry args={[0.018, 0.045, 6]} />
          <meshStandardMaterial color={ear} roughness={0.4} />
        </mesh>
      ))}
      {[-0.018, 0.018].map((ex, i) => (
        <mesh key={i} position={[ex, 0.14, 0.048]}>
          <sphereGeometry args={[0.007, 6, 6]} />
          <meshBasicMaterial color="#1a0e0c" />
        </mesh>
      ))}
    </group>
  );
}

export default function CozyRoom() {
  const matTex = useMemo(createDeskMatTexture, []);
  const keysTex = useMemo(createKeysTexture, []);

  return (
    <group>
      {/* Lantai + dinding — maroon gelap moody */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.4]}>
        <planeGeometry args={[11, 8]} />
        <meshStandardMaterial color="#170d0b" roughness={0.94} />
      </mesh>
      <mesh position={[0, 1.8, -2.35]}>
        <planeGeometry args={[11, 4]} />
        <meshStandardMaterial color="#20100e" roughness={0.96} />
      </mesh>
      <mesh position={[-4.2, 1.8, -0.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#1a0d0b" roughness={0.96} />
      </mesh>
      <mesh position={[4.2, 1.8, -0.4]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#1a0d0b" roughness={0.96} />
      </mesh>
      {/* Panel dado dinding belakang */}
      <mesh position={[0, 0.55, -2.33]}>
        <boxGeometry args={[11, 1.1, 0.04]} />
        <meshStandardMaterial color="#2a1310" roughness={0.85} />
      </mesh>

      {/* Permaidani */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.005, -0.3]}>
        <circleGeometry args={[1.5, 42]} />
        <meshStandardMaterial color="#3d1414" roughness={1} />
      </mesh>

      {/* ── Meja kayu gelap ── */}
      <mesh position={[0.1, 0.74, -1.35]}>
        <boxGeometry args={[2.7, 0.06, 1.05]} />
        <meshStandardMaterial color="#2e1c11" roughness={0.5} />
      </mesh>
      {[
        [-1.15, -1.8],
        [1.35, -1.8],
        [-1.15, -0.95],
        [1.35, -0.95],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}>
          <boxGeometry args={[0.06, 0.72, 0.06]} />
          <meshStandardMaterial color="#100c0a" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Desk mat HUD taktikal */}
      <mesh position={[0.28, 0.772, -1.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, 0.55]} />
        <meshStandardMaterial map={matTex} roughness={0.9} />
      </mesh>

      {/* Keyboard mekanikal */}
      <group position={[0.08, 0.79, -1.02]} rotation={[0, 0.03, 0]}>
        <mesh>
          <boxGeometry args={[0.66, 0.032, 0.23]} />
          <meshStandardMaterial color="#1c1712" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.63, 0.21]} />
          <meshBasicMaterial map={keysTex} toneMapped={false} />
        </mesh>
      </group>
      {/* Mouse */}
      <mesh position={[0.72, 0.795, -1.0]} scale={[1, 0.55, 1.5]}>
        <sphereGeometry args={[0.046, 14, 12]} />
        <meshStandardMaterial color="#1c1712" roughness={0.4} />
      </mesh>

      {/* ── Lampu arm prosedural ── */}
      <group position={[-1.08, 0.77, -1.6]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 0.04, 14]} />
          <meshStandardMaterial color="#141010" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Segmen bawah */}
        <mesh position={[0.08, 0.24, 0]} rotation={[0, 0, -0.35]}>
          <cylinderGeometry args={[0.018, 0.018, 0.46, 8]} />
          <meshStandardMaterial color="#191413" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0.16, 0.45, 0]}>
          <sphereGeometry args={[0.03, 10, 8]} />
          <meshStandardMaterial color="#0f0b0a" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Segmen atas */}
        <mesh position={[0.32, 0.56, 0]} rotation={[0, 0, -1.1]}>
          <cylinderGeometry args={[0.016, 0.016, 0.42, 8]} />
          <meshStandardMaterial color="#191413" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Kepala + mentol */}
        <group position={[0.5, 0.63, 0]} rotation={[0, 0, 2.35]}>
          <mesh>
            <coneGeometry args={[0.085, 0.14, 14, 1, true]} />
            <meshStandardMaterial color="#241a16" metalness={0.5} roughness={0.35} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
          </mesh>
        </group>
        <spotLight
          position={[0.5, 0.6, 0]}
          target-position={[0.9, 0, -0.2]}
          angle={0.7}
          penumbra={0.8}
          intensity={2.2}
          color="#ffc98a"
          distance={3.2}
        />
      </group>

      {/* ── Rak atas-kiri: pasu pothos duduk sini + vinyl toys ── */}
      <group position={[-2.35, 2.3, -2.05]}>
        <mesh>
          <boxGeometry args={[1.35, 0.05, 0.42]} />
          <meshStandardMaterial color="#2a1a10" roughness={0.6} />
        </mesh>
        {/* Bracket rak */}
        {[-0.5, 0.5].map((x, i) => (
          <mesh key={i} position={[x, -0.09, -0.14]}>
            <boxGeometry args={[0.04, 0.14, 0.12]} />
            <meshStandardMaterial color="#141010" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        {/* Pasu pothos (daun dilukis oleh PlantHex) */}
        <mesh position={[-0.42, 0.11, 0]}>
          <cylinderGeometry args={[0.11, 0.085, 0.17, 14]} />
          <meshStandardMaterial color="#6e1f1f" roughness={0.55} />
        </mesh>
        {/* Vinyl toys blind-box */}
        {TOYS.map((toy, i) => (
          <group key={i} position={[toy.x - 0.35, 0.025, 0.02]} rotation={[0, (i - 1) * 0.5, 0]}>
            <VinylToy body={toy.body} ear={toy.ear} />
          </group>
        ))}
      </group>
    </group>
  );
}
