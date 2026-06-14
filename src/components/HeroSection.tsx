"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MutableRefObject } from "react";
import * as THREE from "three";
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

function makeTextSprite(text: string, width = 512, height = 180) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (context) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(255,255,255,0.78)";
    context.font = "900 54px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.translate(width / 2, height / 2);
    context.rotate((-8 * Math.PI) / 180);
    context.fillText(text, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.35, height / width, 1);
  return { sprite, texture, material };
}

function createButtonLabel(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  if (context) {
    context.fillStyle = "rgba(255,255,255,0.78)";
    context.font = "900 42px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.translate(192, 64);
    context.rotate((5 * Math.PI) / 180);
    context.fillText(text, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.48), material);
  return { mesh, texture, material };
}

function createArcadeScene() {
  const root = new THREE.Group();
  const disposeList: Array<{ dispose: () => void }> = [];
  const addDisposable = <T extends { dispose: () => void }>(item: T) => {
    disposeList.push(item);
    return item;
  };

  const red = addDisposable(new THREE.MeshStandardMaterial({ color: 0xf31312, roughness: 0.34, metalness: 0.15 }));
  const deepRed = addDisposable(new THREE.MeshStandardMaterial({ color: 0x9c0008, roughness: 0.5, metalness: 0.12 }));
  const black = addDisposable(new THREE.MeshStandardMaterial({ color: 0x070309, roughness: 0.38, metalness: 0.45 }));
  const purple = addDisposable(new THREE.MeshStandardMaterial({ color: 0x2f2349, roughness: 0.42, metalness: 0.2 }));
  const metal = addDisposable(new THREE.MeshStandardMaterial({ color: 0xd8d3c6, roughness: 0.22, metalness: 0.8 }));
  const chrome = addDisposable(new THREE.MeshStandardMaterial({ color: 0xaaa8a2, roughness: 0.18, metalness: 0.85 }));
  const whiteRubber = addDisposable(new THREE.MeshStandardMaterial({ color: 0xd9d7cf, roughness: 0.38, metalness: 0.18 }));
  const pink = addDisposable(new THREE.MeshStandardMaterial({ color: 0xff2b93, roughness: 0.25, metalness: 0.14 }));
  const glass = addDisposable(
    new THREE.MeshStandardMaterial({
      color: 0xf2f0eb,
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    }),
  );
  const carMat = addDisposable(new THREE.MeshStandardMaterial({ color: 0xc4ada2, roughness: 0.43, metalness: 0.18 }));
  const windowMat = addDisposable(new THREE.MeshStandardMaterial({ color: 0x071321, roughness: 0.18, metalness: 0.35 }));
  [red, deepRed, black, purple, metal, chrome, whiteRubber, pink, glass, carMat, windowMat].forEach((material) => {
    material.userData.baseOpacity = material.opacity;
  });

  const deck = new THREE.Group();
  deck.name = "deck";
  root.add(deck);

  const slot = new THREE.Mesh(addDisposable(new THREE.BoxGeometry(4.2, 0.8, 0.55)), red);
  slot.position.set(0, -1.15, -1.55);
  slot.rotation.x = -0.04;
  slot.castShadow = true;
  deck.add(slot);

  const panel = new THREE.Mesh(addDisposable(new THREE.BoxGeometry(7.8, 0.92, 2.05, 12, 1, 1)), red);
  panel.position.set(0, -1.85, 0);
  panel.rotation.x = -0.08;
  panel.castShadow = true;
  panel.receiveShadow = true;
  deck.add(panel);

  const frontLip = new THREE.Mesh(addDisposable(new THREE.BoxGeometry(8.25, 0.24, 0.45)), deepRed);
  frontLip.position.set(0, -2.28, 0.94);
  frontLip.rotation.x = -0.08;
  deck.add(frontLip);

  const buttonBoard = new THREE.Mesh(addDisposable(new THREE.BoxGeometry(2.12, 0.12, 1.1)), purple);
  buttonBoard.position.set(-2.45, -1.22, 0.1);
  buttonBoard.rotation.set(-0.18, 0.03, -0.04);
  buttonBoard.castShadow = true;
  deck.add(buttonBoard);

  const buttonOne = new THREE.Mesh(addDisposable(new THREE.CylinderGeometry(0.25, 0.29, 0.18, 48)), red);
  buttonOne.position.set(-2.88, -1.06, -0.12);
  buttonOne.rotation.x = Math.PI / 2 - 0.12;
  buttonOne.castShadow = true;
  deck.add(buttonOne);

  const buttonTwo = buttonOne.clone();
  buttonTwo.position.set(-2.15, -1.04, 0.42);
  deck.add(buttonTwo);

  const boom = makeTextSprite("Boom!", 420, 150);
  boom.sprite.position.set(-2.07, -0.93, -0.1);
  boom.sprite.scale.set(0.82, 0.28, 1);
  deck.add(boom.sprite);
  const fly = makeTextSprite("Fly!", 360, 150);
  fly.sprite.position.set(-3.03, -0.9, 0.55);
  fly.sprite.scale.set(0.68, 0.25, 1);
  deck.add(fly.sprite);
  disposeList.push(boom.texture, boom.material, fly.texture, fly.material);

  const joyBoard = new THREE.Mesh(addDisposable(new THREE.BoxGeometry(1.85, 0.14, 1.24)), purple);
  joyBoard.position.set(0, -1.15, 0.2);
  joyBoard.rotation.x = -0.12;
  joyBoard.castShadow = true;
  deck.add(joyBoard);

  const joyRing = new THREE.Mesh(addDisposable(new THREE.TorusGeometry(0.48, 0.1, 24, 72)), chrome);
  joyRing.position.set(0, -0.98, 0.22);
  joyRing.rotation.x = Math.PI / 2 - 0.08;
  joyRing.castShadow = true;
  deck.add(joyRing);

  const joySocket = new THREE.Mesh(addDisposable(new THREE.CylinderGeometry(0.46, 0.56, 0.24, 64)), black);
  joySocket.position.set(0, -0.99, 0.22);
  joySocket.rotation.x = Math.PI / 2 - 0.08;
  joySocket.castShadow = true;
  deck.add(joySocket);

  const joystick = new THREE.Group();
  joystick.name = "joystick";
  joystick.position.set(0, -0.82, 0.17);
  deck.add(joystick);

  const stick = new THREE.Mesh(addDisposable(new THREE.CylinderGeometry(0.09, 0.12, 1.25, 36)), black);
  stick.position.y = 0.58;
  stick.castShadow = true;
  joystick.add(stick);

  const ball = new THREE.Mesh(addDisposable(new THREE.SphereGeometry(0.42, 48, 32)), red);
  ball.position.y = 1.27;
  ball.castShadow = true;
  joystick.add(ball);

  const dropBase = new THREE.Mesh(addDisposable(new THREE.CylinderGeometry(0.82, 0.92, 0.35, 64)), chrome);
  dropBase.position.set(2.8, -1.04, 0.23);
  dropBase.rotation.x = Math.PI / 2 - 0.1;
  dropBase.castShadow = true;
  deck.add(dropBase);

  const dropButton = new THREE.Mesh(addDisposable(new THREE.CylinderGeometry(0.76, 0.78, 0.32, 64)), whiteRubber);
  dropButton.position.set(2.8, -0.87, 0.2);
  dropButton.rotation.x = Math.PI / 2 - 0.1;
  dropButton.castShadow = true;
  deck.add(dropButton);

  const dropLabel = createButtonLabel("Drop!");
  dropLabel.mesh.position.set(2.8, -0.67, 0.2);
  dropLabel.mesh.rotation.x = -0.15;
  deck.add(dropLabel.mesh);
  disposeList.push(dropLabel.texture, dropLabel.material, dropLabel.mesh.geometry);

  const legLeft = new THREE.Mesh(addDisposable(new THREE.BoxGeometry(1.1, 1.4, 0.22)), deepRed);
  legLeft.position.set(-2.7, -2.78, 0.28);
  legLeft.rotation.z = -0.25;
  deck.add(legLeft);
  const legRight = legLeft.clone();
  legRight.position.x = 2.7;
  legRight.rotation.z = 0.25;
  deck.add(legRight);

  const claw = new THREE.Group();
  claw.name = "claw";
  claw.position.set(0, 1.15, -0.45);
  root.add(claw);

  const cord = new THREE.Mesh(addDisposable(new THREE.CylinderGeometry(0.1, 0.12, 1.45, 24)), black);
  cord.position.y = 1.15;
  claw.add(cord);

  const cap = new THREE.Mesh(addDisposable(new THREE.CapsuleGeometry(0.36, 0.4, 8, 32)), metal);
  cap.position.y = 0.42;
  cap.rotation.z = Math.PI / 2;
  claw.add(cap);

  const bodyTop = new THREE.Mesh(addDisposable(new THREE.CapsuleGeometry(0.42, 0.72, 8, 32)), metal);
  bodyTop.position.y = -0.36;
  claw.add(bodyTop);

  const bodyLow = new THREE.Mesh(addDisposable(new THREE.BoxGeometry(0.92, 0.42, 0.68)), metal);
  bodyLow.position.y = -1.05;
  claw.add(bodyLow);

  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(addDisposable(new THREE.CylinderGeometry(0.05, 0.07, 1.55, 16)), metal);
    arm.position.set(side * 0.68, -1.42, 0);
    arm.rotation.z = side * 0.47;
    claw.add(arm);

    const grip = new THREE.Mesh(addDisposable(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 16)), metal);
    grip.position.set(side * 0.93, -2.1, 0.05);
    grip.rotation.z = side * -0.62;
    claw.add(grip);

    const joint = new THREE.Mesh(addDisposable(new THREE.SphereGeometry(0.13, 24, 16)), black);
    joint.position.set(side * 0.44, -0.86, 0.04);
    claw.add(joint);
  });

  const capsule = new THREE.Group();
  capsule.name = "capsule";
  capsule.position.set(0, -0.25, 0);
  root.add(capsule);

  const topShell = new THREE.Mesh(addDisposable(new THREE.SphereGeometry(1.25, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2)), pink);
  topShell.position.set(-0.46, 0.08, 0);
  topShell.rotation.set(0.55, 0, -0.38);
  topShell.scale.set(1.15, 0.86, 1);
  topShell.castShadow = true;
  capsule.add(topShell);

  const lowerShell = new THREE.Mesh(
    addDisposable(new THREE.SphereGeometry(1.2, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)),
    glass,
  );
  lowerShell.position.set(0.48, -0.04, 0);
  lowerShell.rotation.set(0.48, 0.12, 0.48);
  lowerShell.scale.set(1.05, 0.86, 1);
  lowerShell.castShadow = true;
  capsule.add(lowerShell);

  const rim = new THREE.Mesh(addDisposable(new THREE.TorusGeometry(1.13, 0.07, 16, 96)), chrome);
  rim.position.set(0.06, -0.03, 0);
  rim.rotation.set(1.66, 0.08, 0.18);
  rim.scale.set(1.18, 0.5, 1);
  capsule.add(rim);

  const car = new THREE.Group();
  car.position.set(0.02, -0.25, 0.25);
  car.rotation.set(-0.1, -0.22, -0.04);
  capsule.add(car);

  const carBody = new THREE.Mesh(addDisposable(new THREE.BoxGeometry(1.18, 0.3, 0.42)), carMat);
  carBody.position.y = 0;
  carBody.castShadow = true;
  car.add(carBody);

  const carRoof = new THREE.Mesh(addDisposable(new THREE.BoxGeometry(0.62, 0.28, 0.38)), carMat);
  carRoof.position.set(-0.05, 0.27, 0);
  carRoof.castShadow = true;
  car.add(carRoof);

  const windshield = new THREE.Mesh(addDisposable(new THREE.BoxGeometry(0.45, 0.2, 0.43)), windowMat);
  windshield.position.set(0.12, 0.27, 0.02);
  car.add(windshield);

  [-0.43, 0.43].forEach((x) => {
    const wheel = new THREE.Mesh(addDisposable(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 32)), black);
    wheel.position.set(x, -0.2, 0.26);
    wheel.rotation.x = Math.PI / 2;
    wheel.castShadow = true;
    car.add(wheel);

    const hub = new THREE.Mesh(addDisposable(new THREE.CylinderGeometry(0.08, 0.08, 0.13, 24)), chrome);
    hub.position.copy(wheel.position);
    hub.rotation.x = Math.PI / 2;
    car.add(hub);
  });

  const spot = new THREE.Mesh(addDisposable(new THREE.CircleGeometry(0.18, 32)), addDisposable(new THREE.MeshBasicMaterial({ color: 0xffa54b })));
  spot.position.set(-0.88, 0.69, 0.9);
  spot.rotation.set(-0.2, 0.3, 0.25);
  capsule.add(spot);

  const spotLabel = createButtonLabel("BayView");
  spotLabel.mesh.position.set(-0.88, 0.7, 0.92);
  spotLabel.mesh.scale.set(0.5, 0.5, 0.5);
  spotLabel.mesh.rotation.set(-0.2, 0.3, 0.35);
  capsule.add(spotLabel.mesh);
  disposeList.push(spotLabel.texture, spotLabel.material, spotLabel.mesh.geometry);
  spotLabel.material.userData.baseOpacity = spotLabel.material.opacity;

  return { root, deck, claw, joystick, capsule, disposeList };
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

    const { root, deck, claw, joystick, capsule, disposeList } = createArcadeScene();
    scene.add(root);

    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.22 });
    const floorGeometry = new THREE.PlaneGeometry(14, 7);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, -2.74, 0.2);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

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

      camera.position.x = lerp(0, 0.22, worldReveal);
      camera.position.y = lerp(0.25, -0.05, worldReveal);
      camera.position.z = lerp(7.6, 6.45, worldReveal);
      camera.lookAt(0, lerp(-0.05, -0.16, worldReveal), 0);

      deck.position.y = lerp(0, 3.7, fadeIn(progress, 0.1, 0.32));
      deck.position.z = lerp(0, -0.4, capsuleReveal);
      deck.rotation.x = -0.05 + tilt.y * 0.08;
      deck.rotation.y = tilt.x * -0.09;
      deck.rotation.z = Math.sin(time * 0.8) * 0.004;
      deck.scale.setScalar(lerp(1, 0.84, capsuleReveal));
      deck.traverse((object) => {
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

      claw.position.y = lerp(0, 2.6, fadeIn(progress, 0.08, 0.28)) + Math.sin(time * 1.2) * 0.025;
      claw.rotation.z = Math.sin(time * 1.1) * 0.025 + tilt.x * 0.02;
      claw.traverse((object) => {
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

      joystick.rotation.z = tilt.x * -0.18;
      joystick.rotation.x = tilt.y * 0.12;
      joystick.scale.setScalar(1 + pulse * 0.05);

      capsule.visible = capsuleReveal > 0.01;
      capsule.position.x = lerp(0, -0.16, worldReveal) + tilt.x * 0.09;
      capsule.position.y = lerp(-2.1, -0.32, capsuleReveal) + Math.sin(time * 0.9) * 0.035 + pulse * 0.08;
      capsule.position.z = lerp(0.3, 0.95, worldReveal);
      capsule.rotation.x = lerp(-0.08, -0.18, worldReveal) + tilt.y * 0.04;
      capsule.rotation.y = time * 0.12 + tilt.x * 0.08;
      capsule.rotation.z = lerp(-0.12, 0.05, worldReveal);
      capsule.scale.setScalar(lerp(0.58, 1.72, capsuleReveal) + pulse * 0.04);
      capsule.traverse((object) => {
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
      disposeList.forEach((item) => item.dispose());
    };
  }, [playPulseRef, progressRef, tiltRef]);

  return <canvas ref={canvasRef} className={styles.threeCanvas} data-engine="three.js webgl" aria-hidden="true" />;
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
          <MagneticButton href="#contact">Play project now!</MagneticButton>
        </div>
      </section>
    </div>
  );
}
