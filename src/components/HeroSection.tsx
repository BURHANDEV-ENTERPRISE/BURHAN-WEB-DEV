"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroSection.module.css";

const heroLines = [["BURHANDEV."], ["Experience", "the"], ["next", "big", "web"]];
const capsuleLines = [["Enter", "the"], ["World", "of", "BURHANDEV"]];

type AnimatedHeadingProps = {
  as: "h1" | "h2";
  lines: string[][];
  label: string;
  className?: string;
  delayOffset?: number;
};

function AnimatedHeading({
  as: Tag,
  lines,
  label,
  className,
  delayOffset = 0,
}: AnimatedHeadingProps) {
  let letterIndex = 0;

  return (
    <Tag className={className} aria-label={label}>
      {lines.map((words, lineIndex) => (
        <span key={lineIndex} className={styles.headingLine} aria-hidden="true">
          {words.map((word, wordIndex) => (
            <span key={`${word}-${wordIndex}`} className={styles.headingWord}>
              {wordIndex > 0 && <span className={styles.wordGap}> </span>}
              {word.split("").map((char, charIndex) => {
                const delay = `${delayOffset + letterIndex * 0.035}s`;
                letterIndex += 1;
                return (
                  <span
                    key={`${char}-${charIndex}`}
                    className={styles.headingLetter}
                    style={{ animationDelay: delay }}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
          ))}
          {lineIndex < lines.length - 1 && <span className={styles.lineTextGap}> </span>}
        </span>
      ))}
    </Tag>
  );
}

type MagneticButtonProps = {
  children: string;
  href?: string;
  onClick?: () => void;
};

function PlayIcon() {
  return (
    <svg
      className={styles.playIcon}
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M10.9 8 1.1 14.3V1.7L10.9 8Z" fill="currentColor" />
    </svg>
  );
}

function MagneticButton({ children, href, onClick }: MagneticButtonProps) {
  const content = (
    <>
      <span className={styles.buttonBase} aria-hidden="true" />
      <span className={styles.buttonInner} data-magnetic-inner-target="">
        <span className={styles.buttonIconBox}>
          <span className={styles.buttonIconBorder} />
          <span className={styles.buttonIconTrack}>
            <PlayIcon />
            <PlayIcon />
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
      <a className={styles.magneticButton} href={href} data-magnetic-button="">
        {content}
      </a>
    );
  }

  return (
    <button className={styles.magneticButton} onClick={onClick} data-magnetic-button="">
      {content}
    </button>
  );
}

export default function HeroSection() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function clamp(value: number, min: number, max: number) {
      return Math.min(Math.max(value, min), max);
    }

    function updateProgress() {
      if (!scene) return;
      if (reduceMotion.matches) {
        scene.style.setProperty("--scene-progress", "1");
        return;
      }

      const bounds = scene.getBoundingClientRect();
      const travel = Math.max(1, bounds.height - window.innerHeight);
      const progress = clamp(-bounds.top / travel, 0, 1);
      scene.style.setProperty("--scene-progress", progress.toFixed(4));
    }

    const magneticItems = Array.from(
      scene.querySelectorAll<HTMLElement>("[data-magnetic-button]")
    );

    function onMove(event: MouseEvent) {
      const target = event.currentTarget as HTMLElement;
      const inner = target.querySelector<HTMLElement>("[data-magnetic-inner-target]");
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);
      const radius = Math.max(rect.width, rect.height) * 0.95;

      if (distance > radius) return;

      const pull = 1 - distance / radius;
      const moveX = deltaX * pull * 0.42;
      const moveY = deltaY * pull * 0.42;
      target.style.transform = `translate(${moveX}px, ${moveY}px)`;
      if (inner) inner.style.transform = `translate(${moveX * 0.48}px, ${moveY * 0.48}px)`;
    }

    function onLeave(event: MouseEvent) {
      const target = event.currentTarget as HTMLElement;
      const inner = target.querySelector<HTMLElement>("[data-magnetic-inner-target]");
      target.style.transform = "";
      if (inner) inner.style.transform = "";
    }

    magneticItems.forEach((item) => {
      item.addEventListener("mousemove", onMove);
      item.addEventListener("mouseleave", onLeave);
    });

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    reduceMotion.addEventListener("change", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      reduceMotion.removeEventListener("change", updateProgress);
      magneticItems.forEach((item) => {
        item.removeEventListener("mousemove", onMove);
        item.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <div id="top" ref={sceneRef} className={styles.scene} data-scroll-stage="">
      <section id="hero" className={styles.hero} data-hero-section="true">
        <div className={styles.heroTexture} aria-hidden="true" />
        <div className={styles.orbitField} aria-hidden="true">
          <span className={`${styles.orbitRing} ${styles.orbitRingOne}`} />
          <span className={`${styles.orbitRing} ${styles.orbitRingTwo}`} />
          <span className={`${styles.orbitRing} ${styles.orbitRingThree}`} />
          <span className={`${styles.energyDot} ${styles.energyDotOne}`} />
          <span className={`${styles.energyDot} ${styles.energyDotTwo}`} />
          <span className={`${styles.energyDot} ${styles.energyDotThree}`} />
          <span className={styles.capsuleSeed}>
            <span />
          </span>
        </div>
        <svg className={styles.heroRail} viewBox="0 0 1440 620" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="heroRailGradient" x1="-94" y1="500" x2="1534" y2="250" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" stopOpacity="0.02" />
              <stop offset="0.46" stopColor="#8fffff" stopOpacity="0.34" />
              <stop offset="1" stopColor="#ff5200" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <path
            d="M-94 554C37 442 178 442 303 506C447 580 579 540 671 412C760 288 843 204 992 236C1113 262 1160 348 1261 329C1364 309 1413 218 1534 218"
            stroke="url(#heroRailGradient)"
            pathLength="1"
          />
        </svg>

        <div className={styles.heroContent}>
          <AnimatedHeading
            as="h1"
            lines={heroLines}
            label="BURHANDEV. Experience the next big web"
            className={styles.heroTitle}
          />
          <div className={styles.heroCta}>
            <MagneticButton onClick={() => document.getElementById("open-capsule")?.scrollIntoView({ behavior: "smooth" })}>
              Click to enter
            </MagneticButton>
          </div>
        </div>
      </section>

      <section id="open-capsule" className={styles.openCapsule}>
        <div className={styles.capsuleContent}>
          <AnimatedHeading
            as="h2"
            lines={capsuleLines}
            label="Enter the World of BURHANDEV"
            className={styles.capsuleTitle}
            delayOffset={0.28}
          />
          <p>We do not just make websites, we create experiences.</p>
          <MagneticButton href="#contact">Start project now!</MagneticButton>
        </div>

        <div className={styles.capsuleCurveWrap} aria-hidden="true">
          <svg className={styles.capsuleCurve} viewBox="0 0 1428 748" fill="none">
            <defs>
              <linearGradient id="capsuleCurveGradient" x1="-124" y1="570" x2="1500" y2="320" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" stopOpacity="0.26" />
                <stop offset="0.62" stopColor="#8fffff" stopOpacity="0.18" />
                <stop offset="1" stopColor="#ff5200" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path
              d="M-124 758C-12 687 137 665 244 547C322 462 301 328 201 327C141 326 99 380 116 444C138 528 236 580 351 553C513 514 605 344 754 275C904 206 1074 190 1217 268C1377 355 1407 531 1311 642C1191 781 948 721 917 552C889 397 1011 227 1167 145C1331 59 1529 64 1686 142C1770 184 1830 237 1901 312"
              stroke="url(#capsuleCurveGradient)"
              pathLength="1"
            />
          </svg>
        </div>
      </section>
    </div>
  );
}
