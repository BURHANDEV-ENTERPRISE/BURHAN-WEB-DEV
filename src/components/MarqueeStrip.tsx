"use client";

// Marquee dua baris — animasi CSS berterusan, baris lurus/selari.
// Item diulang 6x (bukan 2x) supaya trek sentiasa lebih lebar daripada
// viewport pada skrin lebar — jika tidak, jurang kosong terdedah semasa
// gelung animasi (bug "tiba-tiba hilang, tiba-tiba muncul").

import styles from "./MarqueeStrip.module.css";

const ROW_A = ["LANDING PAGE", "FULL WEBSITE", "PRODUCT UI", "SEO", "PERFORMANCE", "BRANDING", "FIX & CARE", "DEPLOYMENT"];
const ROW_B = ["BOLD DESIGN", "RESPONSIVE", "FAST LOAD", "CLEAN CODE", "NEXT.JS", "THREE.JS", "TYPESCRIPT"];

const COPIES = 6;

function Track({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const repeated = Array.from({ length: COPIES }, () => items).flat();
  return (
    <div className={`${styles.track} ${reverse ? styles.reverse : ""}`}>
      <div className={styles.inner} aria-hidden="true">
        {repeated.map((item, i) => (
          <span key={i} className={styles.item}>
            {item}
            <span className={styles.sep}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MarqueeStrip() {
  return (
    <div className={styles.strip} aria-hidden="true">
      <Track items={ROW_A} />
      <Track items={ROW_B} reverse />
    </div>
  );
}
