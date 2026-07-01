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
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.65, 8]} />
        <meshStandardMaterial color="#888" metalness={0.65} roughness={0.35} />
      </mesh>

      {/* ── Mount clamp ring ── */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.03, 8, 20]} />
        <meshPhysicalMaterial color="#242424" metalness={0.92} roughness={0.12} />
      </mesh>

      {/* ── Main chrome body (capsule) ── radius 0.30 = 2x fatter than before */}
      <mesh position={[0, -1.05, 0]}>
        <capsuleGeometry args={[0.30, 1.5, 6, 24]} />
        <meshPhysicalMaterial
          color="#c6c6c6"
          metalness={0.95}
          roughness={0.05}
          reflectivity={1}
          clearcoat={0.6}
          clearcoatRoughness={0.04}
        />
      </mesh>

      {/* ── Grille overlay — dark perforated ── */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.305, 0.305, 1.1, 24]} />
        <meshPhysicalMaterial
          color="#161616"
          metalness={0.78}
          roughness={0.25}
          transparent
          opacity={0.90}
        />
      </mesh>

      {/* ── Grille edge ring — top ── */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.305, 0.014, 6, 26]} />
        <meshPhysicalMaterial color="#242424" metalness={0.92} roughness={0.12} />
      </mesh>

      {/* ── Grille edge ring — bottom ── */}
      <mesh position={[0, -1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.305, 0.014, 6, 26]} />
        <meshPhysicalMaterial color="#242424" metalness={0.92} roughness={0.12} />
      </mesh>

      {/* ── BURHAN brand ring — maroon ── */}
      <mesh position={[0, -1.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.305, 0.02, 8, 26]} />
        <meshStandardMaterial
          color="#c43232"
          emissive="#8b1a1a"
          emissiveIntensity={0.65}
          metalness={0.35}
          roughness={0.28}
        />
      </mesh>

      {/* ── Handle — dark tapered cylinder ── */}
      <mesh position={[0, -1.7, 0]}>
        <cylinderGeometry args={[0.19, 0.155, 0.8, 18]} />
        <meshPhysicalMaterial color="#202020" metalness={0.92} roughness={0.12} />
      </mesh>

      {/* ── Bottom cap — chrome ── */}
      <mesh position={[0, -2.12, 0]}>
        <cylinderGeometry args={[0.155, 0.10, 0.1, 16]} />
        <meshPhysicalMaterial color="#c6c6c6" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* ── Tail cable ── */}
      <mesh position={[0, -2.55, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.72, 8]} />
        <meshStandardMaterial color="#555" metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  );
}

export default function Mic3D() {
  return (
    <Canvas
      camera={{ position: [0.4, -1.1, 4.5], fov: 46 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 6, 4]} intensity={2.0} />
      <directionalLight position={[-4, 2, 1]} intensity={0.85} color="#d0dcff" />
      <pointLight position={[2.5, 0, 3]} intensity={1.6} color="#ffffff" />
      <pointLight position={[-2, -2, 2]} intensity={1.0} color="#c8ccff" />
      <pointLight position={[0.5, -1.5, 3.5]} intensity={0.65} color="#c43232" />
      <Suspense fallback={null}>
        <Environment preset="studio" />
        <MicModel />
      </Suspense>
    </Canvas>
  );
}
