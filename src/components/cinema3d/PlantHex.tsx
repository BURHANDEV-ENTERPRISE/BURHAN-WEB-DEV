"use client";

// Pokok pothos tergantung (instanced leaf mesh) + barisan panel lampu
// heksagon emissive. Kedua-duanya parallax menentang pergerakan kamera.

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const OLIVE = new THREE.Color("#c8d96f");
const LEAF_COUNT = 66;

/* Titik junam 3 batang pothos dari rak atas-kiri */
function vinePoint(vine: number, s: number): THREE.Vector3 {
  const baseX = -2.77 + vine * 0.09;
  const droop = 0.55 + vine * 0.28;
  return new THREE.Vector3(
    baseX + Math.sin(s * Math.PI * (1.5 + vine * 0.4)) * (0.16 + vine * 0.05),
    2.38 - s * (0.9 + droop),
    -2.0 + s * (0.12 + vine * 0.06)
  );
}

function Pothos() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const sway = useRef<THREE.Group>(null!);

  const { matrices, colors } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const shades = ["#5d6b2f", "#c8d96f", "#7c8f3d", "#46531f"];
    for (let i = 0; i < LEAF_COUNT; i++) {
      const vine = i % 3;
      const s = (Math.floor(i / 3) / (LEAF_COUNT / 3 - 1));
      const p = vinePoint(vine, s);
      dummy.position.copy(p);
      dummy.rotation.set(
        ((i * 7) % 10) / 10 - 0.5,
        ((i * 13) % 20) / 10,
        ((i * 5) % 10) / 8 - 0.6
      );
      const sc = 0.75 + ((i * 11) % 10) / 18;
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
      colors.push(new THREE.Color(shades[i % shades.length]));
    }
    return { matrices, colors };
  }, []);

  useEffect(() => {
    matrices.forEach((m, i) => mesh.current.setMatrixAt(i, m));
    colors.forEach((c, i) => mesh.current.setColorAt(i, c));
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

  useFrame(({ clock }) => {
    // Sway seluruh pokok — murah, tanpa update per-instance
    const t = clock.getElapsedTime();
    if (sway.current) {
      sway.current.rotation.z = Math.sin(t * 0.6) * 0.025;
      sway.current.rotation.x = Math.sin(t * 0.42 + 1) * 0.015;
    }
  });

  return (
    <group ref={sway}>
      {/* Batang halus */}
      {[0, 1, 2].map((v) => (
        <mesh key={v} position={vinePoint(v, 0.5)}>
          <cylinderGeometry args={[0.006, 0.006, 1.3 + v * 0.26, 5]} />
          <meshStandardMaterial color="#3c4a1c" roughness={0.9} />
        </mesh>
      ))}
      <instancedMesh ref={mesh} args={[undefined, undefined, LEAF_COUNT]}>
        <planeGeometry args={[0.11, 0.13]} />
        <meshStandardMaterial roughness={0.7} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

function HexPanels({ reducedMotion }: { reducedMotion: boolean }) {
  const mats = useRef<Array<THREE.MeshBasicMaterial | null>>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    mats.current.forEach((m, i) => {
      if (!m) return;
      const pulse = reducedMotion
        ? 0.9
        : 0.7 + Math.sin(t * 1.1 + i * 0.9) * 0.3;
      m.color.copy(OLIVE).multiplyScalar(0.75 + pulse * 0.9);
    });
  });

  return (
    <group>
      {Array.from({ length: 7 }, (_, i) => {
        const x = -1.55 + i * 0.52 + (i % 2 === 0 ? 0 : 0.06);
        const y = 2.62 + (i % 2 === 0 ? 0 : -0.24);
        return (
          <group key={i} position={[x, y, -2.31]}>
            {/* Bingkai */}
            <mesh>
              <circleGeometry args={[0.185, 6]} />
              <meshStandardMaterial color="#181008" roughness={0.6} />
            </mesh>
            {/* Panel emissive — Bloom menangkap warna terang ini */}
            <mesh position={[0, 0, 0.006]}>
              <circleGeometry args={[0.15, 6]} />
              <meshBasicMaterial
                ref={(m) => {
                  mats.current[i] = m;
                }}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
      {/* Cahaya wash hijau-olive dari panel */}
      <pointLight position={[0, 2.5, -1.7]} color="#c8d96f" intensity={1.1} distance={4.5} />
    </group>
  );
}

interface PlantHexProps {
  reducedMotion: boolean;
}

/* Parallax: offset kecil menentang kedudukan kamera untuk rasa depth */
export default function PlantHex({ reducedMotion }: PlantHexProps) {
  const parallax = useRef<THREE.Group>(null!);

  useFrame(({ camera }) => {
    if (!parallax.current || reducedMotion) return;
    parallax.current.position.x +=
      (-camera.position.x * 0.045 - parallax.current.position.x) * 0.06;
    parallax.current.position.y +=
      (-(camera.position.y - 1.5) * 0.03 - parallax.current.position.y) * 0.06;
  });

  return (
    <group ref={parallax}>
      <Pothos />
      <HexPanels reducedMotion={reducedMotion} />
    </group>
  );
}
