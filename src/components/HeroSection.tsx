"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MutableRefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import styles from "./HeroSection.module.css";

const heroLines = [
  ["BURHANDEV."],
  ["EXPERIENCE", "THE"],
  ["NEXT", "BIG", "WEB"],
];

const worldLines = [
  ["ENTER", "THE"],
  ["WORLD", "OF", "BURHANDEV"],
];

type Tilt = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function smooth(progress: number) {
  const t = clamp(progress, 0, 1);
  return t * t * (3 - 2 * t);
}

function fadeIn(progress: number, start: number, end: number) {
  return smooth((progress - start) / (end - start));
}

function fadeOut(progress: number, start: number, end: number) {
  return 1 - fadeIn(progress, start, end);
}

function AnimatedHeading({
  lines,
  className,
  label,
  level = "h1",
}: {
  lines: string[][];
  className: string;
  label: string;
  level?: "h1" | "h2";
}) {
  let letterIndex = 0;
  const HeadingTag = level;

  return (
    <HeadingTag className={className} aria-label={label}>
      {lines.map((line, lineIndex) => (
        <span className={styles.headingLine} aria-hidden="true" key={`${label}-${lineIndex}`}>
          {line.map((word, wordIndex) => (
            <span className={styles.headingWord} key={`${word}-${wordIndex}`}>
              {word.split("").map((letter) => {
                const delay = `${0.026 * letterIndex++}s`;
                return (
                  <span className={styles.headingLetter} style={{ animationDelay: delay }} key={`${letter}-${letterIndex}`}>
                    {letter}
                  </span>
                );
              })}
              {wordIndex < line.length - 1 ? (
                <span className={styles.wordGap} aria-hidden="true">
                  {" "}
                </span>
              ) : null}
            </span>
          ))}
        </span>
      ))}
    </HeadingTag>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true">
      <path
        d="M11.49 8.18.77 15.05a.5.5 0 0 1-.77-.43L.25.49A.5.5 0 0 1 1.04.09l10.47 7.25a.5.5 0 0 1-.02.84Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MagneticButton({
  children,
  href,
  onClick,
}: {
  children: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className={styles.buttonBase} aria-hidden="true" />
      <span className={styles.buttonInner} data-magnetic-inner-target="">
        <span className={styles.buttonIconBox} aria-hidden="true">
          <span className={styles.buttonIconBorder} />
          <span className={styles.buttonIconTrack}>
            <span className={styles.playIcon}>
              <PlayIcon />
            </span>
            <span className={styles.playIcon}>
              <PlayIcon />
            </span>
          </span>
        </span>
        <span className={styles.buttonTextTrack}>
          <span className={styles.buttonText}>{children}</span>
          <span className={styles.buttonTextClone} aria-hidden="true">
            {children}
          </span>
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <a className={styles.magneticButton} href={href} data-magnetic-strength="50" data-magnetic-strength-inner="25">
        {content}
      </a>
    );
  }

  return (
    <button
      className={styles.magneticButton}
      type="button"
      data-magnetic-strength="50"
      data-magnetic-strength-inner="25"
      onClick={onClick}
    >
      {content}
    </button>
  );
}

function ThreeHeroScene({
  progressRef,
  tiltRef,
  playPulseRef,
}: {
  progressRef: MutableRefObject<number>;
  tiltRef: MutableRefObject<Tilt>;
  playPulseRef: MutableRefObject<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.25, 7.6);

    const ambient = new THREE.AmbientLight(0x9aa8ff, 1.35);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 3.8);
    key.position.set(3, 4.8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const redGlow = new THREE.PointLight(0xff201a, 18, 8.5);
    redGlow.position.set(0, -1.1, 1.2);
    scene.add(redGlow);

    const blueGlow = new THREE.PointLight(0x6b6fff, 8, 8);
    blueGlow.position.set(-2.2, 1.6, 2);
    scene.add(blueGlow);

    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.22 });
    const floorGeometry = new THREE.PlaneGeometry(14, 7);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, -2.74, 0.2);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Setup loaders for GLB
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.5/");

    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("https://unpkg.com/three@0.181.2/examples/jsm/libs/basis/");
    ktx2Loader.detectSupport(renderer);

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.setKTX2Loader(ktx2Loader);

    const loadModel = (url: string): Promise<THREE.Group> => {
      return new Promise((resolve, reject) => {
        gltfLoader.load(
          url,
          (gltf) => resolve(gltf.scene),
          undefined,
          (err) => reject(err)
        );
      });
    };

    // Objek-objek rujukan untuk manipulasi animasi
    const deckGroup = new THREE.Group();
    deckGroup.name = "deck";
    scene.add(deckGroup);

    const clawGroup = new THREE.Group();
    clawGroup.name = "claw";
    scene.add(clawGroup);

    const capsuleGroup = new THREE.Group();
    capsuleGroup.name = "capsule";
    scene.add(capsuleGroup);

    let pookHandle: THREE.Object3D | null = null;
    let pookBall: THREE.Object3D | null = null;
    const loadedModels: THREE.Group[] = [];

    // Tentukan procedural capsule parts di dalam capsuleGroup
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff2b93, roughness: 0.25, metalness: 0.14 });
    const topShell = new THREE.Mesh(new THREE.SphereGeometry(1.25, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), pinkMat);
    topShell.position.set(-0.46, 0.08, 0);
    topShell.rotation.set(0.55, 0, -0.38);
    topShell.scale.set(1.15, 0.86, 1);
    topShell.castShadow = true;
    capsuleGroup.add(topShell);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xf2f0eb,
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    });
    const lowerShell = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glassMat);
    lowerShell.position.set(0.48, -0.04, 0);
    lowerShell.rotation.set(0.48, 0.12, 0.48);
    lowerShell.scale.set(1.05, 0.86, 1);
    lowerShell.castShadow = true;
    capsuleGroup.add(lowerShell);

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xaaa8a2, roughness: 0.18, metalness: 0.85 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.07, 16, 96), chromeMat);
    rim.position.set(0.06, -0.03, 0);
    rim.rotation.set(1.66, 0.08, 0.18);
    rim.scale.set(1.18, 0.5, 1);
    capsuleGroup.add(rim);

    // Tandakan base opacity bagi material capsule
    [pinkMat, glassMat, chromeMat].forEach((mat) => {
      mat.userData.baseOpacity = mat.opacity;
    });

    // Pemuatan model GLB utama Cinnamon secara selari
    Promise.all([
      loadModel("/3d-models/Cinnamon_panel-transformed.glb"),
      loadModel("/3d-models/Cinnamon-grabber-v2.glb"),
      loadModel("/3d-models/frame.glb"),
      loadModel("/3d-models/bayview/fiat500_compressed.glb") // model mainan fiat500 sebagai pengganti procedural car
    ]).then(([panel, grabber, frame, toyCar]) => {
      loadedModels.push(panel, grabber, frame, toyCar);

      // 1. Setup Panel
      panel.position.set(0, -1.85, 0);
      panel.scale.setScalar(1.0);
      panel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.Material;
          mat.userData.baseOpacity = mat.opacity;
        }
      });
      deckGroup.add(panel);

      // Cari joystick parts di panel
      pookHandle = panel.getObjectByName("pook-handle") || null;
      pookBall = panel.getObjectByName("pook-ball") || null;

      // 2. Setup Frame
      frame.position.set(0, -1.85, 0);
      frame.scale.setScalar(1.0);
      frame.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.Material;
          mat.userData.baseOpacity = mat.opacity;
        }
      });
      deckGroup.add(frame);

      // 3. Setup Grabber (claw)
      grabber.position.set(0, 1.15, -0.45);
      grabber.scale.setScalar(2.4);
      grabber.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.Material;
          mat.userData.baseOpacity = mat.opacity;
        }
      });
      clawGroup.add(grabber);

      // 4. Setup Toy Car di dalam capsule
      toyCar.position.set(0.02, -0.25, 0.25);
      toyCar.rotation.set(-0.1, -0.22, -0.04);
      toyCar.scale.setScalar(0.7);
      toyCar.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.Material;
          mat.userData.baseOpacity = mat.opacity;
        }
      });
      capsuleGroup.add(toyCar);

      setIsLoaded(true);
      window.dispatchEvent(new CustomEvent("cinnamon:canvas-ready"));
    }).catch((err) => {
      console.error("Failed to load Cinnamon models:", err);
    });

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const clock = new THREE.Clock();

    const resize = () => {
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;
      if (nextWidth === width && nextHeight === height) {
        return;
      }

      width = nextWidth;
      height = nextHeight;
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const render = () => {
      animationFrame = requestAnimationFrame(render);
      resize();

      const time = clock.getElapsedTime();
      const progress = progressRef.current;
      const capsuleReveal = fadeIn(progress, 0.22, 0.54);
      const worldReveal = fadeIn(progress, 0.52, 0.92);
      const arcadeVisible = fadeOut(progress, 0.12, 0.42);
      const tilt = tiltRef.current;
      const pulse = Math.max(0, 1 - (performance.now() - playPulseRef.current) / 520);

      // Camera animations
      camera.position.x = lerp(0, 0.22, worldReveal);
      camera.position.y = lerp(0.25, -0.05, worldReveal);
      camera.position.z = lerp(7.6, 6.45, worldReveal);
      camera.lookAt(0, lerp(-0.05, -0.16, worldReveal), 0);

      // Deck animations
      deckGroup.position.y = lerp(0, 3.7, fadeIn(progress, 0.1, 0.32));
      deckGroup.position.z = lerp(0, -0.4, capsuleReveal);
      deckGroup.rotation.x = -0.05 + tilt.y * 0.08;
      deckGroup.rotation.y = tilt.x * -0.09;
      deckGroup.rotation.z = Math.sin(time * 0.8) * 0.004;
      deckGroup.scale.setScalar(lerp(1, 0.84, capsuleReveal));
      deckGroup.traverse((object) => {
        if ("material" in object) {
          const material = object.material as THREE.Material | THREE.Material[];
          const materials = Array.isArray(material) ? material : [material];
          materials.forEach((item) => {
            item.transparent = true;
            const baseOpacity = typeof item.userData.baseOpacity === "number" ? item.userData.baseOpacity : 1;
            item.opacity = baseOpacity * clamp(arcadeVisible, 0, 1);
          });
        }
      });

      // Claw animations
      clawGroup.position.y = lerp(0, 2.6, fadeIn(progress, 0.08, 0.28)) + Math.sin(time * 1.2) * 0.025;
      clawGroup.rotation.z = Math.sin(time * 1.1) * 0.025 + tilt.x * 0.02;
      clawGroup.traverse((object) => {
        if ("material" in object) {
          const material = object.material as THREE.Material | THREE.Material[];
          const materials = Array.isArray(material) ? material : [material];
          materials.forEach((item) => {
            item.transparent = true;
            const baseOpacity = typeof item.userData.baseOpacity === "number" ? item.userData.baseOpacity : 1;
            item.opacity = baseOpacity * clamp(arcadeVisible, 0, 1);
          });
        }
      });

      // Joystick animations (rotate nodes pook-handle & pook-ball in panel GLB)
      if (pookHandle && pookBall) {
        pookHandle.rotation.z = tilt.x * -0.18;
        pookHandle.rotation.x = tilt.y * 0.12;

        pookBall.rotation.z = tilt.x * -0.18;
        pookBall.rotation.x = tilt.y * 0.12;

        const stickScale = 1 + pulse * 0.05;
        pookHandle.scale.setScalar(stickScale);
        pookBall.scale.setScalar(stickScale);
      }

      // Capsule animations
      capsuleGroup.visible = capsuleReveal > 0.01;
      capsuleGroup.position.x = lerp(0, -0.16, worldReveal) + tilt.x * 0.09;
      capsuleGroup.position.y = lerp(-2.1, -0.32, capsuleReveal) + Math.sin(time * 0.9) * 0.035 + pulse * 0.08;
      capsuleGroup.position.z = lerp(0.3, 0.95, worldReveal);
      capsuleGroup.rotation.x = lerp(-0.08, -0.18, worldReveal) + tilt.y * 0.04;
      capsuleGroup.rotation.y = time * 0.12 + tilt.x * 0.08;
      capsuleGroup.rotation.z = lerp(-0.12, 0.05, worldReveal);
      capsuleGroup.scale.setScalar(lerp(0.58, 1.72, capsuleReveal) + pulse * 0.04);
      capsuleGroup.traverse((object) => {
        if ("material" in object) {
          const material = object.material as THREE.Material | THREE.Material[];
          const materials = Array.isArray(material) ? material : [material];
          materials.forEach((item) => {
            item.transparent = true;
            const baseOpacity = typeof item.userData.baseOpacity === "number" ? item.userData.baseOpacity : 1;
            item.opacity = baseOpacity * clamp(capsuleReveal * 1.35, 0, 1);
          });
        }
      });

      redGlow.intensity = lerp(18, 4, capsuleReveal) + pulse * 12;
      blueGlow.intensity = lerp(8, 14, worldReveal);

      renderer.render(scene, camera);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      renderer.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      loadedModels.forEach((model) => {
        model.traverse((object) => {
          if (!(object as THREE.Mesh).isMesh) return;
          const mesh = object as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        });
      });
      pinkMat.dispose();
      glassMat.dispose();
      chromeMat.dispose();
      dracoLoader.dispose();
      ktx2Loader.dispose();
    };
  }, [playPulseRef, progressRef, tiltRef]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.threeCanvas}
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: "opacity 1s ease-in-out",
        pointerEvents: "none"
      }}
      data-engine="three.js webgl"
      aria-hidden="true"
    />
  );
}

export default function HeroSection() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef(0);
  const tiltRef = useRef<Tilt>({ x: 0, y: 0 });
  const playPulseRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [tilt, setTilt] = useState<Tilt>({ x: 0, y: 0 });

  const markPlay = (points: number) => {
    playPulseRef.current = performance.now();
    setIsPlaying(true);
    setScore((value) => value + points);
  };

  useEffect(() => {
    tiltRef.current = tilt;
  }, [tilt]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }

    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = scene.getBoundingClientRect();
        const distance = Math.max(1, rect.height - window.innerHeight);
        const progress = clamp(-rect.top / distance, 0, 1);
        progressRef.current = progress;
        scene.style.setProperty("--hero-progress", progress.toFixed(4));
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  useEffect(() => {
    const joystick = joystickRef.current;
    if (!joystick) {
      return;
    }

    let pointerId: number | null = null;

    const moveJoystick = (clientX: number, clientY: number) => {
      const rect = joystick.getBoundingClientRect();
      const x = clamp((clientX - rect.left - rect.width / 2) / (rect.width / 2), -1, 1);
      const y = clamp((clientY - rect.top - rect.height / 2) / (rect.height / 2), -1, 1);
      setTilt({ x, y });
    };

    const pointerDown = (event: PointerEvent) => {
      pointerId = event.pointerId;
      joystick.setPointerCapture(pointerId);
      moveJoystick(event.clientX, event.clientY);
      markPlay(1);
    };

    const pointerMove = (event: PointerEvent) => {
      if (pointerId === event.pointerId) {
        moveJoystick(event.clientX, event.clientY);
      }
    };

    const pointerUp = () => {
      pointerId = null;
      setTilt({ x: 0, y: 0 });
    };

    joystick.addEventListener("pointerdown", pointerDown);
    joystick.addEventListener("pointermove", pointerMove);
    joystick.addEventListener("pointerup", pointerUp);
    joystick.addEventListener("pointercancel", pointerUp);

    return () => {
      joystick.removeEventListener("pointerdown", pointerDown);
      joystick.removeEventListener("pointermove", pointerMove);
      joystick.removeEventListener("pointerup", pointerUp);
      joystick.removeEventListener("pointercancel", pointerUp);
    };
  }, []);

  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic-strength]"));

    const cleanups = buttons.map((button) => {
      const inner = button.querySelector<HTMLElement>("[data-magnetic-inner-target]");
      const strength = Number(button.dataset.magneticStrength || 50);
      const innerStrength = Number(button.dataset.magneticStrengthInner || 25);

      const move = (event: PointerEvent) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
        if (inner) {
          inner.style.transform = `translate(${x / innerStrength}px, ${y / innerStrength}px)`;
        }
      };

      const leave = () => {
        button.style.transform = "";
        if (inner) {
          inner.style.transform = "";
        }
      };

      button.addEventListener("pointermove", move);
      button.addEventListener("pointerleave", leave);
      return () => {
        button.removeEventListener("pointermove", move);
        button.removeEventListener("pointerleave", leave);
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return (
    <div
      id="top"
      className={isPlaying ? `${styles.scene} ${styles.isPlaying}` : styles.scene}
      ref={sceneRef}
      style={
        {
          "--tilt-x": tilt.x.toFixed(3),
          "--tilt-y": tilt.y.toFixed(3),
        } as CSSProperties
      }
    >
      <div className={styles.gameLayer}>
        <div className={styles.screenFrame} aria-hidden="true" />
        <ThreeHeroScene progressRef={progressRef} tiltRef={tiltRef} playPulseRef={playPulseRef} />
        <div className={styles.machineReadout}>
          <span>{isPlaying ? "PLAY MODE" : "READY"}</span>
          <strong>{String(score).padStart(2, "0")}</strong>
        </div>
        <div className={styles.heroContent}>
          <AnimatedHeading
            className={styles.heroTitle}
            label="BURHANDEV. Experience the next big web"
            lines={heroLines}
          />
          <div className={styles.heroCta}>
            <MagneticButton onClick={() => markPlay(1)}>Click to play</MagneticButton>
          </div>
        </div>
        <svg className={styles.worldCurve} viewBox="0 0 1428 748" fill="none" aria-hidden="true">
          <path
            d="M27 804c86-34 171-77 224-156 26-39 43-88 35-135-9-57-63-100-118-74-34 16-50 55-42 91 10 41 42 71 81 88 45 21 95 24 145 16 147-25 258-132 370-222 47-38 96-74 148-104 116-69 250-114 386-105 157 10 318 98 381 248 56 131 29 302-88 390-137 104-342 49-434-91-98-145-75-349 28-486 88-120 227-195 372-223 217-41 453 8 651 102 51 25 99 54 143 89 43 33 81 71 119 110"
            pathLength="1"
          />
        </svg>
      </div>

      <div className={styles.playLayer}>
        <button className={styles.joystickHitbox} type="button" aria-label="Move arcade joystick" ref={joystickRef} />
        <button className={styles.dropHitbox} type="button" aria-label="Drop capsule" onClick={() => markPlay(5)} />
        <button className={styles.leftHitbox} type="button" aria-label="Boom button" onClick={() => markPlay(2)} />
        <button className={styles.rightHitbox} type="button" aria-label="Fly button" onClick={() => markPlay(3)} />
      </div>

      <section id="hero" className={styles.hero} data-hero-section="true" aria-label="BURHANDEV hero" />

      <section id="open-capsule" className={styles.openCapsule} aria-label="Enter the World of BURHANDEV">
        <div className={styles.capsuleContent}>
          <AnimatedHeading
            className={styles.capsuleTitle}
            label="Enter the World of BURHANDEV"
            lines={worldLines}
            level="h2"
          />
          <p>We do not just build pages, we create web experiences.</p>
          <MagneticButton href="#contact">Play Game now!</MagneticButton>
        </div>
      </section>
    </div>
  );
}
