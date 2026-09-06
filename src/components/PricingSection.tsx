import styles from "./PricingSection.module.css";
import PLANS from "../content/pricing.json";

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
            <a href="#contact" className={styles.cta}>
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
