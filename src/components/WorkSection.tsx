import styles from "./WorkSection.module.css";
import Image from "next/image";

export default function WorkSection() {
  return (
    <section className={styles.section} id="work-with-us">
      <div className={styles.container}>

        {/* ── Header row ── */}
        <div className={styles.header}>
          <h2 className={styles.heading}>Work<br />With Us</h2>
          <a href="#contact" className={styles.ctaBtn} aria-label="Contact BURHANDEV">
            <div className={styles.ctaBorder} />
            <span className={styles.ctaLabel}>Say Hello</span>
          </a>
        </div>

        {/* ── Sticky image panel ── */}
        <div className={styles.pinWrap}>
          <div className={styles.stickyImage}>
            {/* Branded visual placeholder */}
            <div className={styles.brandPanel}>
              <div className={styles.brandNoise} aria-hidden="true" />

              {/* top bar mockup */}
              <div className={styles.mockBar}>
                <span className={styles.mockDot} style={{ background: "#ff5f57" }} />
                <span className={styles.mockDot} style={{ background: "#ffbd2e" }} />
                <span className={styles.mockDot} style={{ background: "#28ca41" }} />
                <span className={styles.mockUrl}>burhandev.com</span>
              </div>

              {/* inner content */}
              <div className={styles.brandContent}>
                <Image
                  src="/brand/burhan-logo2.png"
                  alt="BURHANDEV"
                  width={64}
                  height={64}
                  className={styles.brandLogo}
                />
                <p className={styles.brandWord}>BURHANDEV</p>
                <p className={styles.brandTagline}>We Build Bold.</p>

                {/* service chips */}
                <div className={styles.chips}>
                  {["Landing Page", "Business Website", "Product UI", "Fix & Care"].map(s => (
                    <span key={s} className={styles.chip}>{s}</span>
                  ))}
                </div>
              </div>

              {/* bottom glow */}
              <div className={styles.glow} aria-hidden="true" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
