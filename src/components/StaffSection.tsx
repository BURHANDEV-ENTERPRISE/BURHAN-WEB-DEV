import styles from "./StaffSection.module.css";
import staff from "../content/staff.json";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function StaffSection() {
  return (
    <section className={`${styles.section} reveal`} aria-labelledby="staff-title">
      <p className="eyebrow">Who We Are</p>
      <h2 id="staff-title" className={styles.heading}>The Team</h2>
      <div className={styles.grid}>
        {staff.map((s) => (
          <article key={s.name} className={styles.card}>
            <span className={styles.mono} aria-hidden="true">{initials(s.name)}</span>
            <div className={styles.info}>
              <strong className={styles.name}>{s.name}</strong>
              <span className={styles.role}>{s.role}</span>
              <p className={styles.tagline}>{s.tagline}</p>
              {s.portfolio && (
                <a
                  className={styles.portfolioLink}
                  href={s.portfolio}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Portfolio <span aria-hidden="true">→</span>
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
