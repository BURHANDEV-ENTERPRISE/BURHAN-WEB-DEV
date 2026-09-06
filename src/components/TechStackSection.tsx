"use client";

import { useRef } from "react";
import styles from "./TechStackSection.module.css";

const TECHS = [
  { name: "React",       mark: "⚛",  color: "#61dafb" },
  { name: "Next.js",     mark: "▲",  color: "#e2e2e2" },
  { name: "TypeScript",  mark: "TS", color: "#3b82f6" },
  { name: "Three.js",    mark: "◈",  color: "#e2e2e2" },
  { name: "CSS Modules", mark: "⬡",  color: "#6897bb" },
  { name: "Node.js",     mark: "⬢",  color: "#86efac" },
  { name: "Figma",       mark: "✦",  color: "#f97316" },
  { name: "Vercel",      mark: "▴",  color: "#e2e2e2" },
  { name: "GitHub",      mark: "◉",  color: "#c4b5fd" },
  { name: "Tailwind",    mark: "~",  color: "#38bdf8" },
  { name: "Framer",      mark: "◇",  color: "#e879f9" },
  { name: "Supabase",    mark: "⚡", color: "#4ade80" },
  { name: "Playwright",  mark: "▶",  color: "#2ead33" },
  { name: "ESLint",      mark: "⬣",  color: "#8080f2" },
  { name: "GitHub Actions", mark: "⚙", color: "#2088ff" },
  { name: "Docker",      mark: "◫",  color: "#2496ed" },
  { name: "PostgreSQL",  mark: "⛁",  color: "#6ba3d6" },
  { name: "Stripe",      mark: "$",  color: "#8c7dfa" },
];

function Badge({ name, mark, color, delay }: { name: string; mark: string; color: string; delay: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const nx = px / r.width - 0.5;
    const ny = py / r.height - 0.5;
    el.style.setProperty("--rx", `${(-ny * 18).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(nx * 18).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${px}px`);
    el.style.setProperty("--my", `${py}px`);
    el.style.setProperty("--glow", "1");
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glow", "0");
  };

  return (
    <div
      ref={ref}
      className={styles.badge}
      role="listitem"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ "--tc": color, animationDelay: delay } as React.CSSProperties}
    >
      <span className={styles.glow} aria-hidden="true" />
      <span className={styles.mark} aria-hidden="true">{mark}</span>
      <span className={styles.name}>{name}</span>
    </div>
  );
}

export default function TechStackSection() {
  return (
    <section className={`${styles.section} reveal`} aria-labelledby="tech-title">
      <p className={`eyebrow ${styles.eyebrow}`}>Tech Stack</p>
      <h2 id="tech-title" className={styles.heading}>
        Tools we use to build.
      </h2>
      <div className={styles.grid} role="list">
        {TECHS.map(({ name, mark, color }, i) => (
          <Badge key={name} name={name} mark={mark} color={color} delay={`${(i % 6) * 0.35}s`} />
        ))}
      </div>
    </section>
  );
}
