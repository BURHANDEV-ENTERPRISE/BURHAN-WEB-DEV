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
];

export default function TechStackSection() {
  return (
    <section className={`${styles.section} reveal`} aria-labelledby="tech-title">
      <p className={`eyebrow ${styles.eyebrow}`}>Tech Stack</p>
      <h2 id="tech-title" className={styles.heading}>
        Tools yang kita guna untuk build.
      </h2>
      <div className={styles.grid} role="list">
        {TECHS.map(({ name, mark, color }, i) => (
          <div
            key={name}
            className={styles.badge}
            role="listitem"
            style={{
              "--tc": color,
              animationDelay: `${(i % 6) * 0.35}s`,
            } as React.CSSProperties}
          >
            <span className={styles.mark} aria-hidden="true">{mark}</span>
            <span className={styles.name}>{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
