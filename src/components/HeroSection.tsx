"use client";

import { useEffect } from "react";
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
                const delay = `${0.03 * letterIndex++}s`;
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
}: {
  children: string;
  href?: string;
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
    <button className={styles.magneticButton} type="button" data-magnetic-strength="50" data-magnetic-strength-inner="25">
      {content}
    </button>
  );
}

function ClawRig() {
  return (
    <div className={styles.clawRig} aria-hidden="true">
      <span className={styles.clawSmoke} />
      <span className={styles.clawCord} />
      <span className={styles.clawCap} />
      <span className={styles.clawBodyTop} />
      <span className={styles.clawBodyMid} />
      <span className={styles.clawJointLeft} />
      <span className={styles.clawJointRight} />
      <span className={styles.clawArmLeft} />
      <span className={styles.clawArmRight} />
      <span className={styles.clawGripLeft} />
      <span className={styles.clawGripRight} />
    </div>
  );
}

function ArcadeConsole() {
  return (
    <div className={styles.arcadeWrap} aria-hidden="true">
      <div className={styles.arcadeSlot} />
      <div className={styles.arcadeDeck}>
        <div className={styles.buttonPanel}>
          <span className={styles.smallButtonOne} />
          <span className={styles.smallButtonTwo} />
          <span className={styles.panelTextTop}>Boom!</span>
          <span className={styles.panelTextBottom}>Fly!</span>
        </div>
        <div className={styles.joystickBase}>
          <span className={styles.joystickStick} />
          <span className={styles.joystickBall} />
        </div>
        <div className={styles.bigDropButton}>
          <span>Drop!</span>
        </div>
      </div>
    </div>
  );
}

function CapsuleCar() {
  return (
    <div className={styles.car} aria-hidden="true">
      <span className={styles.carRoof} />
      <span className={styles.carWindowFront} />
      <span className={styles.carWindowBack} />
      <span className={styles.carBody} />
      <span className={styles.carWheelFront} />
      <span className={styles.carWheelBack} />
    </div>
  );
}

function CapsuleShowcase({ final = false }: { final?: boolean }) {
  return (
    <div className={final ? `${styles.capsuleShowcase} ${styles.capsuleShowcaseFinal}` : styles.capsuleShowcase} aria-hidden="true">
      <span className={styles.capsuleShadow} />
      <span className={styles.capsuleHalfPink} />
      <span className={styles.capsuleHalfSilver} />
      <CapsuleCar />
    </div>
  );
}

export default function HeroSection() {
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
    <div id="top" className={styles.scene}>
      <section id="hero" className={styles.hero} data-hero-section="true" aria-label="BURHANDEV hero">
        <div className={styles.screenFrame} aria-hidden="true" />
        <ClawRig />
        <div className={styles.heroContent}>
          <AnimatedHeading
            className={styles.heroTitle}
            label="BURHANDEV. Experience the next big web"
            lines={heroLines}
          />
          <div className={styles.heroCta}>
            <MagneticButton>Click to play</MagneticButton>
          </div>
        </div>
        <ArcadeConsole />
      </section>

      <section className={styles.capsuleBridge} aria-label="Capsule reveal">
        <div className={styles.consoleUnderside} aria-hidden="true" />
        <CapsuleShowcase />
      </section>

      <section id="open-capsule" className={styles.openCapsule} aria-label="Enter the World of BURHANDEV">
        <svg className={styles.worldCurve} viewBox="0 0 1428 748" fill="none" aria-hidden="true">
          <path
            d="M27 804c86-34 171-77 224-156 26-39 43-88 35-135-9-57-63-100-118-74-34 16-50 55-42 91 10 41 42 71 81 88 45 21 95 24 145 16 147-25 258-132 370-222 47-38 96-74 148-104 116-69 250-114 386-105 157 10 318 98 381 248 56 131 29 302-88 390-137 104-342 49-434-91-98-145-75-349 28-486 88-120 227-195 372-223 217-41 453 8 651 102 51 25 99 54 143 89 43 33 81 71 119 110"
            pathLength="1"
          />
        </svg>

        <div className={styles.finalCapsule}>
          <CapsuleShowcase final />
        </div>

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
