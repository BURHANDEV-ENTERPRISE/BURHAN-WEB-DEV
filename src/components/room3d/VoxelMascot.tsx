"use client";

// Maskot BlockyChar versi voxel 3D — duduk di kerusi gaming mengadap
// monitor, memakai headphone, dengan animasi menaip dan toleh kepala.
// Proporsi ikut BlockyChar CSS: HEAD 40, BODY 28x40x16, ARM 14x40x14.

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GREEN = "#5c8a3c";
const GREEN_DARK = "#3d5e28";
const HAIR = "#2f4a1e";

interface VoxelMascotProps {
  reducedMotion: boolean;
}

export default function VoxelMascot({ reducedMotion }: VoxelMascotProps) {
  const whole = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    // Kerusi sway halus
    if (whole.current) whole.current.rotation.y = Math.PI + Math.sin(t * 0.32) * 0.05;
    // Kepala: toleh perlahan + angguk mikro
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.42) * 0.24;
      head.current.rotation.x = Math.sin(t * 2.1) * 0.025;
    }
    // Menaip: lengan bob berselang fasa
    if (armL.current) armL.current.rotation.x = -0.55 + Math.sin(t * 9) * 0.06;
    if (armR.current) armR.current.rotation.x = -0.55 + Math.sin(t * 9 + Math.PI * 0.7) * 0.06;
  });

  return (
    // Menghadap -z (ke arah meja); dibina menghadap +z lalu dipusing PI
    <group ref={whole} position={[0.22, 0, -0.42]} rotation={[0, Math.PI, 0]}>
      {/* ── Kerusi gaming ── */}
      <group>
        {/* Kaki bintang + roda */}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <mesh position={[0.2, 0.05, 0]}>
                <boxGeometry args={[0.36, 0.035, 0.06]} />
                <meshStandardMaterial color="#141414" metalness={0.6} roughness={0.35} />
              </mesh>
              <mesh position={[0.36, 0.035, 0]}>
                <sphereGeometry args={[0.038, 10, 8]} />
                <meshStandardMaterial color="#0a0a0a" roughness={0.4} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.42, 10]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Tempat duduk */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.54, 0.09, 0.52]} />
          <meshStandardMaterial color="#181818" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.505, 0]}>
          <boxGeometry args={[0.55, 0.04, 0.53]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
        </mesh>
        {/* Sandaran (belakang badan = -z sebab menghadap +z) */}
        <group position={[0, 0.92, -0.3]} rotation={[0.1, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.54, 0.8, 0.1]} />
            <meshStandardMaterial color="#181818" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0, 0.052]}>
            <planeGeometry args={[0.34, 0.62]} />
            <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
          </mesh>
        </group>
        {/* Penyandar tangan */}
        {[-0.31, 0.31].map((x, i) => (
          <group key={i} position={[x, 0.66, 0.02]}>
            <mesh>
              <boxGeometry args={[0.05, 0.22, 0.05]} />
              <meshStandardMaterial color="#141414" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.12, 0.03]}>
              <boxGeometry args={[0.07, 0.035, 0.26]} />
              <meshStandardMaterial color="#101010" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── Karakter voxel ── */}
      <group position={[0, 0, 0.03]}>
        {/* Badan */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.28, 0.4, 0.16]} />
          <meshStandardMaterial color={GREEN} roughness={0.85} />
        </mesh>

        {/* Kepala + muka + headphone */}
        <group ref={head} position={[0, 1.15, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color={GREEN} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <boxGeometry args={[0.41, 0.08, 0.41]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} />
          </mesh>
          {/* Mata menghadap monitor (+z lokal) */}
          <mesh position={[-0.09, 0.02, 0.201]}>
            <planeGeometry args={[0.07, 0.07]} />
            <meshBasicMaterial color="#1c2312" />
          </mesh>
          <mesh position={[0.09, 0.02, 0.201]}>
            <planeGeometry args={[0.07, 0.07]} />
            <meshBasicMaterial color="#1c2312" />
          </mesh>
          {/* Headphone: band + cup */}
          <mesh position={[0, 0.05, 0]}>
            <torusGeometry args={[0.235, 0.028, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#111111" roughness={0.5} />
          </mesh>
          {[-0.23, 0.23].map((x, i) => (
            <group key={i} position={[x, -0.02, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.09, 0.09, 0.06, 14]} />
                <meshStandardMaterial color="#111111" roughness={0.5} />
              </mesh>
              <mesh
                position={[x < 0 ? -0.033 : 0.033, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <torusGeometry args={[0.055, 0.012, 6, 18]} />
                <meshStandardMaterial
                  color="#d63031"
                  emissive="#7a1515"
                  emissiveIntensity={0.8}
                />
              </mesh>
            </group>
          ))}
        </group>

        {/* Lengan menaip (pivot di bahu) */}
        {[
          { x: -0.21, ref: armL },
          { x: 0.21, ref: armR },
        ].map(({ x, ref }, i) => (
          <group key={i} ref={ref} position={[x, 0.9, 0.02]} rotation={[-0.55, 0, 0]}>
            <mesh position={[0, -0.16, 0]}>
              <boxGeometry args={[0.14, 0.34, 0.14]} />
              <meshStandardMaterial color={GREEN} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.35, 0]}>
              <boxGeometry args={[0.13, 0.08, 0.13]} />
              <meshStandardMaterial color={GREEN_DARK} roughness={0.85} />
            </mesh>
          </group>
        ))}

        {/* Peha (mendatar ke +z) + betis */}
        {[-0.08, 0.08].map((x, i) => (
          <group key={i}>
            <mesh position={[x, 0.53, 0.16]}>
              <boxGeometry args={[0.14, 0.14, 0.34]} />
              <meshStandardMaterial color={GREEN_DARK} roughness={0.85} />
            </mesh>
            <mesh position={[x, 0.35, 0.31]}>
              <boxGeometry args={[0.14, 0.3, 0.14]} />
              <meshStandardMaterial color={GREEN_DARK} roughness={0.85} />
            </mesh>
            <mesh position={[x, 0.19, 0.35]}>
              <boxGeometry args={[0.14, 0.08, 0.2]} />
              <meshStandardMaterial color="#26330f" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
