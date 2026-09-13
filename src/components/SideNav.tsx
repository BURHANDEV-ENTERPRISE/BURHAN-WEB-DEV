import Image from "next/image";
import styles from "./SideNav.module.css";

const LINKS = [
  { href: "#top", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#pricing", label: "Pricing" },
  { href: "#work", label: "Why Us" },
  { href: "#contact", label: "Contact" },
];

const SOCIALS = [
  { href: "https://www.threads.com/@burhanbistro", label: "Threads" },
  { href: "https://www.instagram.com/burhanbistro", label: "IG" },
  { href: "https://x.com/BurhanSupp93316", label: "X" },
  { href: "https://www.facebook.com/profile.php?id=61574313087464&_rdc=1&_rdr#", label: "FB" },
  { href: "https://www.tiktok.com/@burhanbistro", label: "TT" },
];

export default function SideNav() {
  return (
    <aside className={styles.sidebar} aria-label="Primary navigation">
      <div className={styles.brandRow}>
        <Image
          className={styles.brandLogo}
          src="/brand/burhan-logo2.webp"
          alt="BURHANDEV"
          width={28}
          height={28}
        />
      </div>

      <nav className={styles.navList} aria-label="Section navigation">
        {LINKS.map((l, i) => (
          <a key={l.href} href={l.href} className={styles.navPill}>
            <span>{l.label}</span>
            <span className={styles.navBadge} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
          </a>
        ))}
      </nav>

      <div className={styles.ctaBlock}>
        <p className={styles.ctaText}>Got a project in mind?</p>
        <a href="#contact" className={styles.ctaBtn}>
          Start a project
        </a>
      </div>

      <div className={styles.bottomRow}>
        <span className={styles.copy}>&copy; 2026 BURHANDEV</span>
        <div className={styles.socials}>
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
