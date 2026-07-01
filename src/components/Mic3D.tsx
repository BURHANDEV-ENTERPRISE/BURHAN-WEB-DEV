"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

const GRILLE_RINGS = 15;
const GRILLE_START_Y = -0.02;
const GRILLE_STEP   = 0.075;

function MicModel() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z =
      Math.sin(t * 0.55) * 0.055 +
      Math.sin(t * 1.25) * 0.016;
    groupRef.current.position.x = Math.sin(t * 0.55) * 0.06;
  });

  return (
    <group ref={groupRef}>

      {/* ── Suspension cable (top) ── */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.72, 8]} />
        <meshStandardMaterial color="#999" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── Yoke horizontal bar ── */}
      <mesh position={[0, -0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.72, 8]} />
        <meshPhysicalMaterial color="#1e1e1e" metalness={0.95} roughness={0.08} />
      </mesh>

      {/* ── Yoke left arm ── */}
      <mesh position={[-0.30, -0.22, 0]} rotation={[0, 0, 0.48]}>
        <cylinderGeometry args={[0.013, 0.013, 0.50, 6]} />
        <meshPhysicalMaterial color="#1e1e1e" metalness={0.95} roughness={0.08} />
      </mesh>

      {/* ── Yoke right arm ── */}
      <mesh position={[0.30, -0.22, 0]} rotation={[0, 0, -0.48]}>
        <cylinderGeometry args={[0.013, 0.013, 0.50, 6]} />
        <meshPhysicalMaterial color="#1e1e1e" metalness={0.95} roughness={0.08} />
      </mesh>

      {/* ── Yoke collar ring (where arms meet body) ── */}
      <mesh position={[0, -0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.022, 8, 24]} />
        <meshPhysicalMaterial color="#1e1e1e" metalness={0.95} roughness={0.08} />
      </mesh>

      {/* ── Main chrome capsule body ── */}
      <mesh position={[0, -1.08, 0]}>
        <capsuleGeometry args={[0.30, 1.52, 8, 28]} />
        <meshPhysicalMaterial
          color="#d4d4d4"
          metalness={0.96}
          roughness={0.03}
          reflectivity={1}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* ── Grille: horizontal metallic rings (realistic perforated mesh look) ── */}
      {Array.from({ length: GRILLE_RINGS }, (_, i) => (
        <mesh
          key={i}
          position={[0, GRILLE_START_Y - i * GRILLE_STEP, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.303, 0.011, 5, 30]} />
          <meshPhysicalMaterial
            color="#141414"
            metalness={0.90}
            roughness={0.18}
          />
        </mesh>
      ))}

      {/* ── BURHAN brand ring — maroon ── */}
      <mesh position={[0, -1.30, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.305, 0.022, 8, 28]} />
        <meshStandardMaterial
          color="#d63031"
          emissive="#7a1515"
          emissiveIntensity={0.7}
          metalness={0.4}
          roughness={0.25}
        />
      </mesh>

      {/* ── Handle — dark knurled body ── */}
      <mesh position={[0, -1.74, 0]}>
        <cylinderGeometry args={[0.19, 0.15, 0.84, 20]} />
        <meshPhysicalMaterial
          color="#181818"
          metalness={0.93}
          roughness={0.10}
          clearcoat={0.3}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* ── Handle knurl rings (decorative bands) ── */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[0, -1.46 - i * 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.191, 0.008, 4, 22]} />
          <meshPhysicalMaterial color="#2a2a2a" metalness={0.92} roughness={0.12} />
        </mesh>
      ))}

      {/* ── Bottom cap — chrome ── */}
      <mesh position={[0, -2.19, 0]}>
        <cylinderGeometry args={[0.15, 0.095, 0.12, 18]} />
        <meshPhysicalMaterial color="#d4d4d4" metalness={0.96} roughness={0.03} />
      </mesh>

      {/* ── XLR connector stub ── */}
      <mesh position={[0, -2.29, 0]}>
        <cylinderGeometry args={[0.06, 0.055, 0.08, 12]} />
        <meshPhysicalMaterial color="#111" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── Tail cable ── */}
      <mesh position={[0, -2.60, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.54, 8]} />
        <meshStandardMaterial color="#444" metalness={0.4} roughness={0.65} />
      </mesh>

    </group>
  );
}

export default function Mic3D() {
  return (
    <Canvas
      camera={{ position: [-0.5, -1.0, 4.2], fov: 44 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      {/* Key light — upper-right front (studio softbox) */}
      <directionalLight position={[3, 5, 4]}  intensity={2.2} />
      {/* Fill light — left side, cool */}
      <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#ccd6ff" />
      {/* Rim light — behind the mic, creates chrome outline */}
      <pointLight position={[-1, -0.5, -4]} intensity={2.5} color="#ffffff" />
      {/* Red accent fill (maroon ring bounce) */}
      <pointLight position={[1, -1.5, 3]}   intensity={0.7} color="#c43232" />
      {/* Soft ambient */}
      <ambientLight intensity={0.22} />

      <Suspense fallback={null}>
        <Environment preset="studio" />
        <MicModel />
      </Suspense>
    </Canvas>
  );
}
