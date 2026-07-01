import styles from "./MarqueeStrip.module.css";

const ROW_A = ["LANDING PAGE", "FULL WEBSITE", "PRODUCT UI", "SEO", "PERFORMANCE", "BRANDING", "FIX & CARE", "DEPLOYMENT"];
const ROW_B = ["BOLD DESIGN", "RESPONSIVE", "FAST LOAD", "CLEAN CODE", "NEXT.JS", "THREE.JS", "TYPESCRIPT", "VERCEL"];

function Track({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className={`${styles.track} ${reverse ? styles.reverse : ""}`}>
      <div className={styles.inner} aria-hidden="true">
        {doubled.map((item, i) => (
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
