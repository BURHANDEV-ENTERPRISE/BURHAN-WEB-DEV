"use client";

// Section video scroll-scrub generik — elemen sama seperti hero:
// section tinggi + video sticky, frame dipandu scroll melalui useVideoScrub.

import { useCallback, useRef } from "react";
import useVideoScrub from "./useVideoScrub";
import styles from "./ScrubVideoSection.module.css";

interface ScrubVideoSectionProps {
  src: string;
  /** Tinggi journey dalam vh (lalai 320). */
  heightVh?: number;
  shade?: boolean;
  children?: React.ReactNode;
  ariaLabel?: string;
}

export default function ScrubVideoSection({
  src,
  heightVh = 320,
  shade = true,
  children,
  ariaLabel,
}: ScrubVideoSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Zoom halus sepanjang journey
  const onProgress = useCallback((p: number) => {
    const v = videoRef.current;
    if (v) v.style.transform = `scale(${(1 + p * 0.07).toFixed(3)})`;
  }, []);

  useVideoScrub(sectionRef, videoRef, { onProgress });

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      style={{ height: `${heightVh}vh` }}
      aria-label={ariaLabel}
    >
      <div className={styles.sticky}>
        <video
          ref={videoRef}
          className={styles.video}
          src={src}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        {shade && <div className={styles.shade} aria-hidden="true" />}
        {children && <div className={styles.overlay}>{children}</div>}
      </div>
    </section>
  );
}
