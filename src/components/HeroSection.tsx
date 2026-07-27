"use client";

import { useRef, useCallback } from "react";
import styles from "./HeroSection.module.css";
import useVideoScrub from "./useVideoScrub";

export default function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const textCoverRef = useRef<HTMLDivElement>(null);

  // Overlay ikut progress terlembut: headline hilang awal (video ada teks
  // "BURHAN" terbakar dalam footage dari saat pertama — headline mesti
  // pudar sebelum kamera zoom bawa teks tu jadi besar & bertindih),
  // video zoom halus sepanjang journey, tirai akhir digelapkan beransur.
  const onScrubProgress = useCallback((p: number) => {
    const el = contentRef.current;
    if (el) {
      const fade = Math.min(1, Math.max(0, (p - 0.01) / 0.09));
      el.style.transform = `translateX(-50%) translateY(${(-fade * 40).toFixed(1)}px)`;
      el.style.opacity = String(Math.max(0, 1 - fade * 1.15));
    }
    // Tutup kawasan monitor (teks "BURHAN" terbakar dalam video) pada
    // permulaan — larut hanya SELEPAS headline dah hilang, supaya tiada
    // waktu kedua-dua teks kelihatan serentak.
    const cover = textCoverRef.current;
    if (cover) {
      const clear = Math.min(1, Math.max(0, (p - 0.04) / 0.1));
      cover.style.opacity = String(1 - clear);
    }
    const v = videoRef.current;
    if (v) {
      v.style.transform = `scale(${(1 + p * 0.07).toFixed(3)})`;
      // Tirai akhir digelapkan beransur atas jarak lebih panjang (bukan
      // dimampatkan ke saat terakhir sahaja) — handoff rasa lebih licin,
      // sepadan tempoh topBlend section seterusnya.
      const dim = Math.min(1, Math.max(0, (p - 0.88) / 0.11));
      v.style.opacity = String(Math.max(0, 1 - dim));
    }
  }, []);

  // Enjin scrub dikongsi (seek-aware + IO gate + reduced-motion safe)
  useVideoScrub(sectionRef, videoRef, {
    enabled: true,
    onProgress: onScrubProgress,
  });

  return (
    <section
      ref={sectionRef}
      className={styles.videoScrubSection}
      aria-label="BURHANDEV hero"
    >
      <div className={styles.videoSticky}>
        {/* Video Gaming Monitor — frame dipandu scroll */}
        <div className={styles.roomWrap} aria-hidden="true">
          <video
            ref={videoRef}
            className={styles.heroVideo}
            src="/videos/gaming-monitor.mp4"
            muted
            playsInline
            preload="auto"
          />
          <div className={styles.videoShade} />
          <div ref={textCoverRef} className={styles.textCover} />
        </div>

        {/* headline — dipindah dari OpenSection */}
        <div ref={contentRef} className={styles.introContent}>
          <h1 className={styles.introTitle} aria-label="Enter the World of BURHANDEV">
            <span>ENTER THE</span>
            <span>WORLD OF</span>
            <span className={styles.introBrand}>BURHANDEV</span>
          </h1>
          <p className={styles.introSub}>
            We don&apos;t just build sites. We build experiences that convert.
          </p>
        </div>
      </div>
    </section>
  );
}
