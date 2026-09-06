import styles from "./TestimonialsSection.module.css";
import testimonials from "../content/testimonials.json";

const { rowA: ROW_A, rowB: ROW_B } = testimonials;

function Card({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <figure className={styles.card}>
      <blockquote className={styles.quote}>
        <p>&ldquo;{quote}&rdquo;</p>
      </blockquote>
      <figcaption className={styles.author}>
        <span className={styles.name}>{name}</span>
        <span className={styles.role}>{role}</span>
      </figcaption>
    </figure>
  );
}

const COPIES = 4;

function Row({ items, reverse }: { items: typeof ROW_A; reverse?: boolean }) {
  const repeated = Array.from({ length: COPIES }, () => items).flat();
  return (
    <div className={`${styles.row} ${reverse ? styles.reverse : ""}`} aria-hidden="true">
      <div className={styles.inner}>
        {repeated.map((t, i) => <Card key={i} {...t} />)}
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className={`${styles.section} reveal`} aria-labelledby="testi-title">
      <p className={`eyebrow ${styles.eyebrow}`}>Testimonials</p>
      <h2 id="testi-title" className={styles.heading}>What clients say.</h2>
      <div className={styles.marqueeWrap} aria-hidden="true">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
      <p className={styles.note}>Real feedback from real projects.</p>
    </section>
  );
}
