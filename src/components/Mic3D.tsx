"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

function MicModel() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z =
      Math.sin(t * 0.55) * 0.062 +
      Math.sin(t * 1.3) * 0.018;
    groupRef.current.position.x = Math.sin(t * 0.55) * 0.07;
  });

  return (
    <group ref={groupRef}>
      {/* ── Top suspension cable ── */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.55, 8]} />
        <meshStandardMaterial color="#888" metalness={0.65} roughness={0.35} />
      </mesh>

      {/* ── Mount clamp ring ── */}
      <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.088, 0.024, 8, 20]} />
        <meshPhysicalMaterial color="#303030" metalness={0.88} roughness={0.15} />
      </mesh>

      {/* ── Main chrome body (capsule) ── */}
      <mesh position={[0, -0.82, 0]}>
        <capsuleGeometry args={[0.145, 1.15, 6, 20]} />
        <meshPhysicalMaterial
          color="#c4c4c4"
          metalness={0.93}
          roughness={0.06}
          reflectivity={1}
          clearcoat={0.4}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* ── Grille area — dark perforated overlay ── */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.149, 0.149, 0.85, 20]} />
        <meshPhysicalMaterial
          color="#181818"
          metalness={0.75}
          roughness={0.28}
          transparent
          opacity={0.86}
        />
      </mesh>

      {/* ── Grille edge ring — top ── */}
      <mesh position={[0, -0.075, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.149, 0.011, 6, 22]} />
        <meshPhysicalMaterial color="#303030" metalness={0.88} roughness={0.15} />
      </mesh>

      {/* ── Grille edge ring — bottom ── */}
      <mesh position={[0, -0.925, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.149, 0.011, 6, 22]} />
        <meshPhysicalMaterial color="#303030" metalness={0.88} roughness={0.15} />
      </mesh>

      {/* ── BURHAN brand ring — maroon ── */}
      <mesh position={[0, -1.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.149, 0.016, 8, 24]} />
        <meshStandardMaterial
          color="#c43232"
          emissive="#8b1a1a"
          emissiveIntensity={0.55}
          metalness={0.35}
          roughness={0.32}
        />
      </mesh>

      {/* ── Handle — dark tapered cylinder ── */}
      <mesh position={[0, -1.44, 0]}>
        <cylinderGeometry args={[0.092, 0.076, 0.68, 14]} />
        <meshPhysicalMaterial color="#282828" metalness={0.88} roughness={0.15} />
      </mesh>

      {/* ── Bottom cap — chrome ── */}
      <mesh position={[0, -1.8, 0]}>
        <cylinderGeometry args={[0.076, 0.052, 0.085, 14]} />
        <meshPhysicalMaterial color="#c4c4c4" metalness={0.93} roughness={0.06} />
      </mesh>

      {/* ── Tail cable ── */}
      <mesh position={[0, -2.11, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.55, 8]} />
        <meshStandardMaterial color="#555" metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  );
}

export default function Mic3D() {
  return (
    <Canvas
      camera={{ position: [0.35, -0.9, 4.3], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <ambientLight intensity={0.28} />
      <directionalLight position={[5, 6, 4]} intensity={1.8} />
      <directionalLight position={[-4, 2, 1]} intensity={0.7} color="#d0dcff" />
      <pointLight position={[2.5, 0.5, 3]} intensity={1.4} color="#ffffff" />
      <pointLight position={[-2, -1.5, 2]} intensity={0.9} color="#c8ccff" />
      <pointLight position={[0.5, -1.2, 3]} intensity={0.55} color="#c43232" />
      <Suspense fallback={null}>
        <Environment preset="studio" />
        <MicModel />
      </Suspense>
    </Canvas>
  );
}
