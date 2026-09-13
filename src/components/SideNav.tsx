"use client";

import { useEffect, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? "Close menu" : "Open navigation menu"}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.toggleIcon} data-open={open} aria-hidden="true">
          <i></i>
          <i></i>
        </span>
      </button>

      <aside
        className={styles.sidebar}
        data-open={open}
        aria-label="Primary navigation"
        aria-hidden={!open}
      >
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
            <a key={l.href} href={l.href} className={styles.navPill} onClick={() => setOpen(false)}>
              <span>{l.label}</span>
              <span className={styles.navBadge} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
            </a>
          ))}
        </nav>

        <div className={styles.ctaBlock}>
          <p className={styles.ctaText}>Got a project in mind?</p>
          <a href="#contact" className={styles.ctaBtn} onClick={() => setOpen(false)}>
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
    </div>
  );
}
