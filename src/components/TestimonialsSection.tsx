import styles from "./TestimonialsSection.module.css";

const ROW_A = [
  { quote: "Website delivered in 7 days, fast response, impressive results. Highly recommended.", name: "Hafiz A.",  role: "Brand Owner"        },
  { quote: "Our landing page conversion went up 3x after redesigning with BURHANDEV.",             name: "Siti R.",   role: "Founder, SR Studio" },
  { quote: "Clean code, easy to maintain ourselves. First web dev hire and we're already satisfied.", name: "Ahmad Z.",  role: "SME Owner"          },
  { quote: "The hero section animation is genuinely wow. Clients keep complimenting it.",          name: "Rizal M.",  role: "Startup Founder"    },
];

const ROW_B = [
  { quote: "The UI matched our brand 100%. Barely needed revisions, nailed it first try.",     name: "Nadia K.",  role: "Creative Director"  },
  { quote: "Best web dev we've ever hired. On-time delivery, quality above expectations.",      name: "Farah B.",  role: "Agency Principal"   },
  { quote: "From scope to launch in 2 weeks. Smooth process, communication always clear.",      name: "Danial H.", role: "E-commerce Founder" },
  { quote: "The mobile experience is flawless. Scroll animation is buttery smooth too.",         name: "Izzah M.",  role: "Content Creator"    },
];

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
