import styles from "./PricingSection.module.css";

const PLANS = [
  {
    num:      "01",
    label:    "Landing Page",
    price:    "RM 800",
    period:   "one-time",
    desc:     "Untuk offer, campaign, atau launch. Satu page, fully focused pada conversion.",
    features: [
      "1 responsive page",
      "Mobile-first design",
      "5–7 day delivery",
      "Contact / WhatsApp form",
      "Vercel deployment",
    ],
    cta:      "Start Project",
    featured: false,
  },
  {
    num:      "02",
    label:    "Business Website",
    price:    "RM 2,500",
    period:   "one-time",
    desc:     "Company profile lengkap. Semua pages, clear structure, siap untuk grow.",
    features: [
      "5–8 pages full build",
      "CMS / editable content",
      "SEO-ready structure",
      "Gallery & service pages",
      "14-day delivery",
      "1 month post-launch support",
    ],
    cta:      "Pilih Plan Ini",
    featured: true,
  },
  {
    num:      "03",
    label:    "Custom Build",
    price:    "Contact Us",
    period:   "",
    desc:     "Dashboard, portal, member area, atau apa-apa yang complex. Scope-based.",
    features: [
      "Product UI / dashboard",
      "API integration",
      "Authentication system",
      "Multi-role access",
      "Timeline & cost by scope",
    ],
    cta:      "Discuss Scope",
    featured: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className={`${styles.section} reveal`} aria-labelledby="pricing-title">
      <p className={`eyebrow ${styles.eyebrow}`}>Pricing</p>
      <h2 id="pricing-title" className={styles.heading}>
        Pick your build level.
      </h2>
      <div className={styles.grid}>
        {PLANS.map(plan => (
          <div
            key={plan.label}
            className={`${styles.card} ${plan.featured ? styles.featured : ""}`}
          >
            {plan.featured && (
              <span className={styles.badge} aria-label="Most popular plan">Most Popular</span>
            )}
            <div className={styles.top}>
              <span className={styles.num}>{plan.num}</span>
              <h3 className={styles.planName}>{plan.label}</h3>
              <div className={styles.priceRow}>
                <span className={styles.price}>{plan.price}</span>
                {plan.period && <span className={styles.period}>{plan.period}</span>}
              </div>
              <p className={styles.desc}>{plan.desc}</p>
            </div>
            <ul className={styles.features} aria-label="Plan features">
              {plan.features.map(f => (
                <li key={f}>
                  <span className={styles.check} aria-hidden="true">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              className={`${styles.cta} ${plan.featured ? styles.ctaFeatured : ""}`}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
