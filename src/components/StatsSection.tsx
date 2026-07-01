"use client";
import { useEffect, useRef } from "react";
import styles from "./StatsSection.module.css";

const STATS = [
  { value: 50,  suffix: "+",  label: "Projects Built"   },
  { value: 3,   suffix: "+",  label: "Years Active"     },
  { value: 100, suffix: "%",  label: "Mobile-First"     },
  { value: 15,  suffix: "K+", label: "Lines of Code"    },
];

function countUp(el: HTMLElement, target: number, suffix: string, duration = 1600) {
  const start = performance.now();
  const run = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (p < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

export default function StatsSection() {
  const ref      = useRef<HTMLElement>(null);
  const fired    = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !fired.current) {
          fired.current = true;
          ref.current?.querySelectorAll<HTMLElement>("[data-count]").forEach(el => {
            countUp(el, Number(el.dataset.count), el.dataset.suffix ?? "");
          });
        }
      },
      { threshold: 0.25 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className={`${styles.section} reveal`} aria-label="By the numbers">
      <p className={`eyebrow ${styles.eyebrow}`}>By The Numbers</p>
      <div className={styles.grid}>
        {STATS.map(({ value, suffix, label }, i) => (
          <div key={label} className={styles.card} style={{ "--i": i } as React.CSSProperties}>
            <span
              className={styles.number}
              data-count={value}
              data-suffix={suffix}
              aria-label={`${value}${suffix} ${label}`}
            >
              0{suffix}
            </span>
            <span className={styles.label}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
