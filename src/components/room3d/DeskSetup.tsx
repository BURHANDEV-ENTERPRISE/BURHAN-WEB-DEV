"use client";

// Setup meja streamer: dual monitor (skrin hidup), keyboard RGB, mouse,
// PC tower RGB, dan desk mic condenser. Monitor utama dan mic adalah
// hotspot klik (services / contact).

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { applyHue, createCodeScreen, createStreamScreen } from "./screens";
import type { HotspotTarget } from "./GamerRoom3D";

function makeKeysTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#14181d";
  ctx.fillRect(0, 0, c.width, c.height);
  const hues = [355, 30, 140, 200, 260, 320];
  let k = 0;
  for (let row = 0; row < 4; row++) {
    const keys = row === 3 ? 7 : 13;
    const kw = row === 3 ? 30 : 17;
    for (let col = 0; col < keys; col++) {
      const x = 6 + col * (kw + 2);
      const y = 8 + row * 22;
      const wide = row === 3 && col === 3;
      ctx.fillStyle = "#22262d";
      ctx.fillRect(x, y, wide ? 70 : kw, 17);
      ctx.fillStyle = `hsla(${hues[k++ % hues.length]}, 90%, 60%, 0.35)`;
      ctx.fillRect(x, y + 14, wide ? 70 : kw, 3);
      if (wide) col += 2;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface DeskSetupProps {
  reducedMotion: boolean;
  onHotspot?: (target: HotspotTarget) => void;
}

export default function DeskSetup({ reducedMotion, onHotspot }: DeskSetupProps) {
  const codeScreen = useMemo(createCodeScreen, []);
  const streamScreen = useMemo(createStreamScreen, []);
  const keysTex = useMemo(makeKeysTexture, []);

  const [hovered, setHovered] = useState<HotspotTarget | null>(null);
  const monitorRing = useRef<THREE.MeshStandardMaterial>(null!);
  const micRing = useRef<THREE.MeshStandardMaterial>(null!);
  const kbGlow = useRef<THREE.MeshBasicMaterial>(null!);
  const fanMats = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const stripMat = useRef<THREE.MeshBasicMaterial>(null!);
  const lastDraw = useRef(-1);

  // Kursor pointer bila hover hotspot
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  useEffect(() => {
    // Lukis sekali untuk keadaan awal / reduced motion
    codeScreen.draw(999);
    streamScreen.draw(3.2);
    return () => {
      codeScreen.dispose();
      streamScreen.dispose();
    };
  }, [codeScreen, streamScreen]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Skrin hidup — throttle ~8fps, statik bila reduced motion
    if (!reducedMotion && t - lastDraw.current > 0.12) {
      lastDraw.current = t;
      codeScreen.draw(t);
      streamScreen.draw(t);
    }
    // RGB berkitar
    applyHue(kbGlow.current, t, 0.15, reducedMotion);
    applyHue(stripMat.current, t, 0.5, reducedMotion);
    fanMats.current.forEach((m, i) => applyHue(m, t, i * 0.18, reducedMotion));
    // Hotspot glow
    if (monitorRing.current) {
      monitorRing.current.emissiveIntensity +=
        ((hovered === "services" ? 1.6 : 0.35) -
          monitorRing.current.emissiveIntensity) * 0.15;
    }
    if (micRing.current) {
      micRing.current.emissiveIntensity +=
        ((hovered === "contact" ? 2.2 : 0.7) -
          micRing.current.emissiveIntensity) * 0.15;
    }
  });

  const hotspotProps = (target: HotspotTarget) => ({
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onHotspot?.(target);
    },
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setHovered(target);
    },
    onPointerOut: () => setHovered((h) => (h === target ? null : h)),
  });

  return (
    <group>
      {/* ── Meja ── */}
      <mesh position={[0.1, 0.74, -1.3]}>
        <boxGeometry args={[2.6, 0.06, 1.0]} />
        <meshStandardMaterial color="#3a2418" roughness={0.55} />
      </mesh>
      {[
        [-1.1, -1.72],
        [1.3, -1.72],
        [-1.1, -0.9],
        [1.3, -0.9],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}>
          <cylinderGeometry args={[0.035, 0.035, 0.72, 10]} />
          <meshStandardMaterial color="#141414" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}

      {/* ── Monitor utama (hotspot → services) ── */}
      <group position={[0.32, 0, -1.52]} {...hotspotProps("services")}>
        <mesh position={[0, 0.785, 0]}>
          <boxGeometry args={[0.36, 0.025, 0.22]} />
          <meshStandardMaterial color="#101010" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.9, -0.02]}>
          <boxGeometry args={[0.05, 0.24, 0.05]} />
          <meshStandardMaterial color="#101010" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Bezel — bercahaya maroon bila hover */}
        <mesh position={[0, 1.32, 0]}>
          <boxGeometry args={[1.06, 0.64, 0.04]} />
          <meshStandardMaterial
            ref={monitorRing}
            color="#0e0e0e"
            emissive="#7f1d1d"
            emissiveIntensity={0.35}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, 1.32, 0.022]}>
          <planeGeometry args={[0.99, 0.57]} />
          <meshBasicMaterial map={codeScreen.texture} toneMapped={false} />
        </mesh>
      </group>

      {/* ── Monitor sisi (stream + chat) ── */}
      <group position={[-0.72, 0, -1.46]} rotation={[0, 0.45, 0]}>
        <mesh position={[0, 0.775, 0]}>
          <boxGeometry args={[0.26, 0.02, 0.18]} />
          <meshStandardMaterial color="#101010" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.88, -0.015]}>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <meshStandardMaterial color="#101010" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.26, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.62, 0.52, 0.035]} />
          <meshStandardMaterial color="#0e0e0e" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.26, 0.02]}>
          <planeGeometry args={[0.46, 0.56]} />
          <meshBasicMaterial map={streamScreen.texture} toneMapped={false} />
        </mesh>
      </group>

      {/* ── Mousepad + keyboard + mouse ── */}
      <mesh position={[0.28, 0.772, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 0.42]} />
        <meshStandardMaterial color="#0c0f14" roughness={0.95} />
      </mesh>
      <group position={[0.12, 0.79, -1.0]}>
        <mesh>
          <boxGeometry args={[0.64, 0.028, 0.22]} />
          <meshStandardMaterial color="#14181d" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.0148, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.61, 0.2]} />
          <meshBasicMaterial map={keysTex} toneMapped={false} />
        </mesh>
        {/* Underglow RGB */}
        <mesh position={[0, -0.012, 0]}>
          <boxGeometry args={[0.68, 0.008, 0.25]} />
          <meshBasicMaterial ref={kbGlow} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0.68, 0.795, -0.98]} scale={[1, 0.55, 1.55]}>
        <sphereGeometry args={[0.045, 14, 12]} />
        <meshStandardMaterial color="#191d23" roughness={0.45} />
      </mesh>

      {/* ── Desk mic condenser (hotspot → contact) ── */}
      <group position={[-1.02, 0, -1.12]} {...hotspotProps("contact")}>
        <mesh position={[0, 0.79, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.035, 14]} />
          <meshStandardMaterial color="#141414" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.98, 0]} rotation={[0, 0, 0.22]}>
          <cylinderGeometry args={[0.016, 0.016, 0.4, 8]} />
          <meshStandardMaterial color="#1e1e1e" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0.1, 1.2, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.014, 0.014, 0.3, 8]} />
          <meshStandardMaterial color="#1e1e1e" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Badan chrome */}
        <mesh position={[0.2, 1.28, 0]} rotation={[0, 0, -0.28]}>
          <capsuleGeometry args={[0.075, 0.26, 6, 18]} />
          <meshPhysicalMaterial
            color="#d4d4d4"
            metalness={0.95}
            roughness={0.06}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
        {/* Cincin brand maroon — bercahaya bila hover */}
        <mesh position={[0.23, 1.2, 0]} rotation={[Math.PI / 2, 0, -0.28]}>
          <torusGeometry args={[0.077, 0.014, 8, 22]} />
          <meshStandardMaterial
            ref={micRing}
            color="#d63031"
            emissive="#a71d1d"
            emissiveIntensity={0.7}
            metalness={0.4}
            roughness={0.25}
          />
        </mesh>
      </group>

      {/* ── PC tower RGB ── */}
      <group position={[1.72, 0, -1.5]}>
        <mesh position={[0, 0.47, 0]}>
          <boxGeometry args={[0.46, 0.94, 0.5]} />
          <meshStandardMaterial color="#0d0f13" metalness={0.45} roughness={0.4} />
        </mesh>
        {/* Panel kaca depan */}
        <mesh position={[0, 0.47, 0.253]}>
          <planeGeometry args={[0.4, 0.86]} />
          <meshPhysicalMaterial
            color="#05070c"
            transparent
            opacity={0.5}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
        {/* 3 kipas RGB */}
        {[0.72, 0.47, 0.22].map((y, i) => (
          <group key={i} position={[0, y, 0.26]}>
            <mesh>
              <torusGeometry args={[0.085, 0.016, 8, 24]} />
              <meshStandardMaterial
                ref={(m) => {
                  fanMats.current[i] = m;
                }}
                emissiveIntensity={1.4}
                roughness={0.4}
              />
            </mesh>
            <mesh>
              <circleGeometry args={[0.068, 18]} />
              <meshStandardMaterial color="#101319" roughness={0.6} />
            </mesh>
          </group>
        ))}
        {/* Strip RGB tepi casing */}
        <mesh position={[0.235, 0.47, 0.24]}>
          <boxGeometry args={[0.014, 0.9, 0.014]} />
          <meshBasicMaterial ref={stripMat} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
