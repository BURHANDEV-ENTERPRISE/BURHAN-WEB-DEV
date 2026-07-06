"use client";

import { useEffect, useRef, useCallback } from "react";
import styles from "./WorkSection.module.css";

const WORKS = [
  { label: "Landing Page",  sub: "Conversion hero",    theme: "maroon" },
  { label: "Business Site", sub: "Company profile",    theme: "navy"   },
  { label: "Product UI",    sub: "Dashboard & portal", theme: "teal",  featured: true },
  { label: "E-Commerce",    sub: "Shop & checkout",    theme: "amber"  },
  { label: "Fix & Care",    sub: "Polish & deploy",    theme: "slate"  },
  { label: "Portfolio",     sub: "Personal brand",     theme: "maroon" },
  { label: "Startup Web",   sub: "MVP launch",         theme: "navy"   },
  { label: "Restaurant",    sub: "Local business",     theme: "amber"  },
  { label: "Agency Studio", sub: "Creative studio",    theme: "slate"  },
];

// Start transform for each card: [translateX%, translateY%, scale, rotateDeg]
// % is relative to each card's own size.
// At scroll=0  → cards are clustered near the featured card (center-ish).
// At scroll=1  → all transforms zero out → natural CSS Grid positions.
const START: [number, number, number, number][] = [
  [ 230,  65, 0.50, -9 ], // col1 row1
  [ 105,  30, 0.57, -4 ], // col2 row1
  [   0,   0, 1.14,  0 ], // col3 featured — already centered, just bigger
  [-105,  30, 0.57,  4 ], // col4 row1
  [-230,  65, 0.50,  9 ], // col5 row1
  [ 210, -65, 0.50,  7 ], // col1 row2
  [ 100, -30, 0.57,  3 ], // col2 row2
  [-100, -30, 0.57, -3 ], // col4 row2
  [-210, -65, 0.50, -7 ], // col5 row2
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function WorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const hoverRef   = useRef<[number, number][]>(WORKS.map(() => [0, 0]));
  const rafRef     = useRef(0);

  const getProgress = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, -r.top / (r.height - window.innerHeight)));
  }, []);

  const render = useCallback(() => {
    const t = easeOut(getProgress());
    cardRefs.current.forEach((card, i) => {
      if (!card || !START[i]) return;
      const [sx, sy, ss, sr] = START[i];
      const [hx, hy]         = hoverRef.current[i];
      card.style.transform =
        `translate(${lerp(sx, 0, t) + hx}%, ${lerp(sy, 0, t) + hy}%) ` +
        `scale(${lerp(ss, 1, t)}) rotate(${lerp(sr, 0, t)}deg)`;
    });
  }, [getProgress]);

  useEffect(() => {
    // Hanya kira transform bila section hampir/dalam viewport —
    // elak kerja rAF pada setiap scroll event di seluruh page.
    const inView = { current: false };
    const el = sectionRef.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
        if (entry.isIntersecting) render();
      },
      { rootMargin: "30% 0px" }
    );
    if (el) io.observe(el);

    const onScroll = () => {
      if (!inView.current) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(render);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    render();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
    };
  }, [render]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
    const card = cardRefs.current[i];
    if (!card) return;
    const r  = card.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width  - 0.5;
    const ny = (e.clientY - r.top)  / r.height - 0.5;
    hoverRef.current[i] = [-nx * 8, -ny * 6]; // repel away from cursor
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
  };

  const onLeave = (i: number) => {
    hoverRef.current[i] = [0, 0];
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
  };

  return (
    <section ref={sectionRef} className={styles.section} id="services">
      <div className={styles.sticky}>

        <div className={styles.header}>
          <h2 className={styles.heading}>Work<br />With Us</h2>
          <a href="#contact" className={styles.ctaBtn} aria-label="Contact BURHANDEV">
            <div className={styles.ctaBorder} />
            <span className={styles.ctaLabel}>Say Hello</span>
          </a>
        </div>

        <div className={styles.grid}>
          {WORKS.map((w, i) => (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              className={[
                styles.card,
                styles[`t_${w.theme}`],
                w.featured ? styles.featured : "",
              ].join(" ")}
              onMouseMove={e => onMove(e, i)}
              onMouseLeave={() => onLeave(i)}
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
