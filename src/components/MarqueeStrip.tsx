"use client";

// Marquee dua baris — animasi CSS berterusan + shift dua hala ikut
// scroll (baris A ke kiri, baris B ke kanan) untuk rasa depth.

import { useEffect, useRef } from "react";
import styles from "./MarqueeStrip.module.css";

const ROW_A = ["LANDING PAGE", "FULL WEBSITE", "PRODUCT UI", "SEO", "PERFORMANCE", "BRANDING", "FIX & CARE", "DEPLOYMENT"];
const ROW_B = ["BOLD DESIGN", "RESPONSIVE", "FAST LOAD", "CLEAN CODE", "NEXT.JS", "THREE.JS", "TYPESCRIPT", "VERCEL"];

function Track({
  items,
  reverse,
  trackRef,
}: {
  items: string[];
  reverse?: boolean;
  trackRef?: React.Ref<HTMLDivElement>;
}) {
  const doubled = [...items, ...items];
  return (
    <div ref={trackRef} className={`${styles.track} ${reverse ? styles.reverse : ""}`}>
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
  const stripRef = useRef<HTMLDivElement>(null);
  const rowA = useRef<HTMLDivElement>(null);
  const rowB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Hanya kira bila strip dekat viewport
    const inView = { current: false };
    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
      },
      { rootMargin: "40% 0px" }
    );
    io.observe(strip);

    let raf = 0;
    const onScroll = () => {
      if (!inView.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Condong ikut jarak strip dari tengah viewport — lurus di tengah
        const r = strip.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const off = (r.top + r.height / 2 - vh / 2) / vh;
        const lean = Math.max(-5, Math.min(5, off * 7));
        if (rowA.current) rowA.current.style.transform = `skewX(${lean.toFixed(2)}deg)`;
        if (rowB.current) rowB.current.style.transform = `skewX(${(-lean).toFixed(2)}deg)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={stripRef} className={styles.strip} aria-hidden="true">
      <Track items={ROW_A} trackRef={rowA} />
      <Track items={ROW_B} reverse trackRef={rowB} />
    </div>
  );
}
