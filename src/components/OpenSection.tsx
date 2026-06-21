"use client";
import { useEffect, useRef } from "react";
import styles from "./OpenSection.module.css";

export default function OpenSection() {
  const lineRef = useRef<SVGPathElement>(null);

  // Animate the SVG stroke on scroll into view
  useEffect(() => {
    const path = lineRef.current;
    if (!path) return;

    const total = path.getTotalLength();
    path.style.strokeDasharray = String(total);
    path.style.strokeDashoffset = String(total);

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          path.style.transition = "stroke-dashoffset 2.2s cubic-bezier(0.4,0,0.2,1)";
          path.style.strokeDashoffset = "0";
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(path);
    return () => obs.disconnect();
  }, []);

  return (
    <section className={styles.open} id="open">
      {/* content pinned to center */}
      <div className={styles.inner}>
        <h2 className={styles.heading} aria-label="Enter the World of BURHANDEV">
          <span>Enter the</span>
          <span>World of</span>
          <span className={styles.brand}>BURHANDEV</span>
        </h2>

        <p className={styles.sub}>
          We don&apos;t just build sites — we craft experiences that convert.
        </p>

        <a href="#contact" className={styles.cta} aria-label="Start your project">
          <span className={styles.ctaIconWrap} aria-hidden="true">
            <svg className={styles.ctaIconA} xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16" fill="none">
              <path d="M11.493 8.175L.77 15.05C.537 15.2.228 15.13.079 14.9.026 14.816-.002 14.72 0 14.62L.253.49C.258.215.486-.005.762 0c.099.002.195.033.276.089L11.508 7.343c.227.158.283.47.126.696a.508.508 0 01-.141.136z" fill="currentColor"/>
            </svg>
            <svg className={styles.ctaIconB} xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true">
              <path d="M11.493 8.175L.77 15.05C.537 15.2.228 15.13.079 14.9.026 14.816-.002 14.72 0 14.62L.253.49C.258.215.486-.005.762 0c.099.002.195.033.276.089L11.508 7.343c.227.158.283.47.126.696a.508.508 0 01-.141.136z" fill="currentColor"/>
            </svg>
          </span>
          <span>Start Your Project</span>
        </a>
      </div>

      {/* animated curve line at bottom */}
      <div className={styles.curveLine} aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1428 748" fill="none" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="burhan-curve" x1="-830" y1="845" x2="1608" y2="276" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff6dc" />
              <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            ref={lineRef}
            d="M26.5 804C112.75 770 197.2 727 250.3 647.9c26.3-38.9 43.7-88.1 35.3-135C276.5 456 223.1 412.9 167.5 438.9 134.4 454.7 118 494.2 126.3 529.6c9.4 41.3 41.6 71.3 80.2 88.8 45.4 20.4 96 23.2 145.2 15.3C498.6 608.7 610.1 501.3 722.4 411.3 769.3 373.7 817.9 338 869.7 307.3 985.6 238.6 1119.6 194.1 1255.5 203.3c157.8 9.4 318.4 97.6 381.1 247.5 56.5 130.8 29 302.1-87.7 389.5-137.5 104.1-342.1 49.6-434-90 -98-145-75.3-348.7 27.5-485.6C1230.8 144.8 1370 69.2 1514.7 41 1732 .1 1967.9 49.3 2166.2 143.2c50.7 25 98.9 54.2 143.3 88.9 42.4 33.1 80.4 71.2 117.9 109.8"
            stroke="url(#burhan-curve)"
            strokeOpacity="0.35"
            strokeWidth="53"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </section>
  );
}
