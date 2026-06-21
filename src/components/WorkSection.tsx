"use client";

import { useEffect, useRef } from "react";
import styles from "./WorkSection.module.css";

/* back → front order — front card is the one that flies out */
const WORKS = [
  { label: "Agency Studio", sub: "Creative studio",    theme: "slate"  },
  { label: "Restaurant",    sub: "Local business",     theme: "amber"  },
  { label: "Startup Web",   sub: "MVP launch site",    theme: "navy"   },
  { label: "Portfolio",     sub: "Personal brand",     theme: "maroon" },
  { label: "Product UI",    sub: "Dashboard & portal", theme: "teal"   },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function WorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stackRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stack   = stackRef.current;
    if (!section || !stack) return;

    const cards = Array.from(
      stack.querySelectorAll<HTMLElement>("[data-card]")
    );
    const n = cards.length;

    const update = () => {
      const rect     = section.getBoundingClientRect();
      const room     = rect.height - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / room));

      cards.forEach((card, i) => {
        const isFront = i === n - 1;
        const depth   = i / (n - 1); // 0 = back, 1 = front

        if (isFront) {
          const scale = lerp(1.0, 1.22, progress);
          const y     = lerp(0, -110, progress);
          card.style.transform = `translateY(${y}px) scale(${scale})`;
          card.style.opacity   = "1";
        } else {
          const gap   = (n - 1 - i) * 18;
          const scale = lerp(
            0.80 + depth * 0.12,
            0.68 + depth * 0.14,
            progress
          );
          const y  = lerp(gap, gap + 40, progress);
          const op = lerp(0.40 + depth * 0.38, 0.15 + depth * 0.25, progress);
          card.style.transform = `translateY(${y}px) scale(${scale})`;
          card.style.opacity   = String(Math.max(0, op));
        }
      });
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} id="work-with-us">
      <div className={styles.sticky}>

        <div className={styles.header}>
          <h2 className={styles.heading}>Work<br />With Us</h2>
          <a href="#contact" className={styles.ctaBtn} aria-label="Contact BURHANDEV">
            <div className={styles.ctaBorder} />
            <span className={styles.ctaLabel}>Say Hello</span>
          </a>
        </div>

        <div ref={stackRef} className={styles.stack}>
          {WORKS.map((w, i) => (
            <div
              key={i}
              data-card={i}
              className={`${styles.card} ${styles[`t_${w.theme}`]}`}
              style={{ zIndex: i }}
            >
              <div className={styles.bar}>
                <span className={styles.dot} style={{ background: "#ff5f57" }} />
                <span className={styles.dot} style={{ background: "#ffbd2e" }} />
                <span className={styles.dot} style={{ background: "#28ca41" }} />
                <span className={styles.urlBar} />
              </div>
              <div className={styles.mock}>
                <div className={styles.mockNav} />
                <div className={styles.mockHero} />
                <div className={styles.mockCols}>
                  <div className={styles.mockCol} />
                  <div className={styles.mockCol} />
                  <div className={styles.mockCol} />
                </div>
              </div>
              <div className={styles.info}>
                <strong className={styles.cardTitle}>{w.label}</strong>
                <span className={styles.cardSub}>{w.sub}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
