"use client";

// Overlay DOM gaya console Burhan — info-card bersempadan di sudut,
// segerak dengan scroll progress yang sama memandu kamera 3D.

import React, { useState } from "react";
import {
  motion,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import styles from "./HudOverlay.module.css";

const STAGES = ["ESTABLISHING", "MONITOR PUSH", "DESK ORBIT", "DETAIL PASS"];

interface HudOverlayProps {
  progress: MotionValue<number>;
  onPlay: () => void;
}

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

export default function HudOverlay({ progress, onPlay }: HudOverlayProps) {
  const [stage, setStage] = useState(0);

  useMotionValueEvent(progress, "change", (v) => {
    const idx = Math.min(STAGES.length - 1, Math.floor(v * STAGES.length));
    setStage((s) => (s === idx ? s : idx));
  });

  // Segerak dengan kamera: hint hilang awal, kad atas pudar hujung journey
  const hintOpacity = useTransform(progress, [0, 0.06], [1, 0]);
  const topOpacity = useTransform(progress, [0, 0.82, 0.96], [1, 1, 0.25]);
  const camOpacity = useTransform(progress, [0.02, 0.07], [0, 1]);
  const barScale = useTransform(progress, [0, 1], [0, 1]);

  return (
    <div className={styles.hud} aria-hidden={false}>
      {/* Atas-kiri: identiti console */}
      <motion.div
        className={`${styles.card} ${styles.tl}`}
        style={{ opacity: topOpacity }}
        {...cardAnim(0.2)}
      >
        <span className={styles.title}>
          BURHANDEV <span className={styles.dim}>//</span> CONSOLE
          <span className={styles.cursor}>▮</span>
        </span>
        <span className={styles.sub}>SESSION: LIVE — WE BUILD BOLD</span>
      </motion.div>

      {/* Atas-kanan: tag versi */}
      <motion.div
        className={`${styles.tagRow} ${styles.tr}`}
        style={{ opacity: topOpacity }}
        {...cardAnim(0.35)}
      >
        <span className={styles.tag}>V3.0.0 BETA</span>
        <span className={`${styles.tag} ${styles.tagSolid}`}>ADMINISTRATOR</span>
      </motion.div>

      {/* Bawah-kiri: penunjuk stage kamera */}
      <motion.div
        className={`${styles.card} ${styles.bl}`}
        style={{ opacity: camOpacity }}
      >
        <span className={styles.sub}>
          CAM 0{stage + 1}/0{STAGES.length} — {STAGES[stage]}
        </span>
        <div className={styles.barTrack}>
          <motion.div className={styles.barFill} style={{ scaleX: barScale }} />
        </div>
      </motion.div>

      {/* Bawah-kanan: CTA console */}
      <motion.div className={`${styles.ctaCol} ${styles.br}`} {...cardAnim(0.55)}>
        <a className={styles.ctaMain} href="#contact">
          MULA PROJEK <span aria-hidden="true">→</span>
        </a>
        <button className={styles.ctaGhost} onClick={onPlay} type="button">
          ▶ PLAY_MODE
        </button>
      </motion.div>

      {/* Hint scroll tengah-bawah */}
      <motion.div className={styles.hint} style={{ opacity: hintOpacity }} {...cardAnim(0.9)}>
        SCROLL ▼
      </motion.div>
    </div>
  );
}
