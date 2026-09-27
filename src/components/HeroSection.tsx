"use client";

import { useRef, useCallback } from "react";
import styles from "./HeroSection.module.css";
import useVideoScrub from "./useVideoScrub";

export default function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const onScrubProgress = useCallback((p: number) => {
    const fade = Math.min(1, Math.max(0, (p - 0.02) / 0.18));
    if (contentRef.current) {
      contentRef.current.style.opacity = String(1 - fade);
      contentRef.current.style.transform = `translateY(${-fade * 24}px)`;
    }
    if (stageRef.current) {
      stageRef.current.style.setProperty("--journey", String(p));
      stageRef.current.style.setProperty("--intro", String(1 - fade));
    }
    if (videoRef.current) {
      videoRef.current.style.transform = `scale(${1.03 + p * 0.04})`;
      const dim = Math.min(1, Math.max(0, (p - 0.87) / 0.13));
      videoRef.current.style.opacity = String(1 - dim);
    }
  }, []);

  useVideoScrub(sectionRef, videoRef, { onProgress: onScrubProgress });

  return (
    <section ref={sectionRef} className={styles.section} aria-label="Inside the BURHANDEV studio">
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.media} aria-hidden="true">
          <video ref={videoRef} className={styles.video} src="/videos/gaming-monitor.mp4"
            muted playsInline preload="auto" />
          <div className={styles.shade} />
          <div className={styles.introShade} />
        </div>

        <div className={styles.masthead}>
          <span className={styles.wordmark}>BURHAN<span>DEV</span><span className={styles.brandDot} aria-hidden="true">✳</span></span>
          <span className={styles.studioLabel}>Independent digital studio<br />Made in Malaysia</span>
          <a className={styles.skip} href="#services">Explore services <span aria-hidden="true">↗</span></a>
        </div>

        <div ref={contentRef} className={styles.intro}>
          <p className={styles.eyebrow}><span /> Big ideas. Built here.</p>
          <h1 className={styles.title}>WE MAKE<br />DIGITAL<br /><span>FEEL REAL.</span></h1>
          <p className={styles.description}>Bold websites. Thoughtful experiences.<br />From the first idea to your next big move.</p>
        </div>

        <div className={styles.frameLabel} aria-hidden="true"><span /> A look inside<br /><strong>THE STUDIO</strong></div>

        <div className={styles.footer}>
          <div className={styles.chapter}><span>01 / 02</span><strong>Inside the studio</strong></div>
          <div className={styles.scrollCue}><span aria-hidden="true">↓</span> Scroll to step inside</div>
          <span className={styles.disciplines}>Design / Develop / Deliver</span>
        </div>
        <div className={styles.progress} aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
