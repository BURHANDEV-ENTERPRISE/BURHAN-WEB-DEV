"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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

// Section ids to watch for scrollspy — matches LINKS minus the synthetic "top".
const SPY_IDS = ["services", "pricing", "work", "contact"];

export default function SideNav() {
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#top");
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

  // Scrollspy: highlight whichever section pill matches what's in view.
  useEffect(() => {
    const sections = SPY_IDS
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveHref(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));

    const onScroll = () => {
      if (window.scrollY < window.innerHeight * 0.5) setActiveHref("#top");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={`${styles.toggle} sidenav-toggle`}
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
            <a
              key={l.href}
              href={l.href}
              className={styles.navPill}
              data-active={l.href === activeHref}
              onClick={() => setOpen(false)}
            >
              <span>{l.label}</span>
              <span className={styles.navBadge} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
            </a>
          ))}
          <Link href="/blog/" className={styles.navPill} onClick={() => setOpen(false)}>
            <span>Blog</span>
            <span className={styles.navBadge} aria-hidden="true">
              06
            </span>
          </Link>
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
