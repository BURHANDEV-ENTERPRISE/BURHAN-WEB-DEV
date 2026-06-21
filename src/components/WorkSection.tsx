import styles from "./WorkSection.module.css";

const WORKS = [
  { label: "Landing Page",  sub: "Conversion-focused hero",    theme: "maroon" },
  { label: "Business Site", sub: "Company profile & services", theme: "navy"   },
  { label: "Product UI",    sub: "Dashboard & portal",         theme: "teal",  featured: true },
  { label: "E-Commerce",    sub: "Shop, cart & checkout",      theme: "amber"  },
  { label: "Fix & Care",    sub: "Polish, speed & deploy",     theme: "slate"  },
  { label: "Portfolio",     sub: "Personal brand",             theme: "maroon" },
  { label: "Startup Web",   sub: "MVP launch site",            theme: "navy"   },
  { label: "Restaurant",    sub: "Local business",             theme: "amber"  },
  { label: "Agency Studio", sub: "Creative studio",            theme: "slate"  },
];

export default function WorkSection() {
  return (
    <section className={styles.section} id="work-with-us">
      <div className={styles.container}>

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
              className={[
                styles.card,
                styles[`t_${w.theme}`],
                w.featured ? styles.featured : "",
              ].join(" ")}
            >
              {/* mini browser chrome */}
              <div className={styles.bar}>
                <span className={styles.dot} style={{ background: "#ff5f57" }} />
                <span className={styles.dot} style={{ background: "#ffbd2e" }} />
                <span className={styles.dot} style={{ background: "#28ca41" }} />
                <span className={styles.urlBar} />
              </div>

              {/* wireframe site layout */}
              <div className={styles.mock}>
                <div className={styles.mockNav} />
                <div className={styles.mockHero} />
                <div className={styles.mockCols}>
                  <div className={styles.mockCol} />
                  <div className={styles.mockCol} />
                  <div className={styles.mockCol} />
                </div>
              </div>

              {/* bottom label */}
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
