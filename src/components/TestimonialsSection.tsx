import styles from "./TestimonialsSection.module.css";

const ROW_A = [
  { quote: "Website siap dalam 7 hari, response laju, result impressive. Memang recommended.", name: "Hafiz A.",  role: "Brand Owner"        },
  { quote: "Landing page conversion kami naik 3x selepas redesign dengan BURHANDEV.",          name: "Siti R.",   role: "Founder, SR Studio" },
  { quote: "Clean code, mudah maintain sendiri. First hire web dev terus puas hati.",          name: "Ahmad Z.",  role: "SME Owner"          },
  { quote: "Animation hero section tu betul-betul wow. Client puji berkali-kali.",             name: "Rizal M.",  role: "Startup Founder"    },
];

const ROW_B = [
  { quote: "UI match 100% dengan brand kami. Tak payah banyak revision, terus kena.",         name: "Nadia K.",  role: "Creative Director"  },
  { quote: "Best web dev yang pernah kami hire. Delivery on time, quality above expectation.", name: "Farah B.",  role: "Agency Principal"   },
  { quote: "Dari scope sampai launch dalam 2 minggu. Process smooth, comms always clear.",     name: "Danial H.", role: "E-commerce Founder" },
  { quote: "Mobile experience dia flawless. Scroll animation pun buttery smooth.",             name: "Izzah M.",  role: "Content Creator"    },
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

function Row({ items, reverse }: { items: typeof ROW_A; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className={`${styles.row} ${reverse ? styles.reverse : ""}`} aria-hidden="true">
      <div className={styles.inner}>
        {doubled.map((t, i) => <Card key={i} {...t} />)}
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className={`${styles.section} reveal`} aria-labelledby="testi-title">
      <p className={`eyebrow ${styles.eyebrow}`}>Testimonials</p>
      <h2 id="testi-title" className={styles.heading}>Apa client kata.</h2>
      <div className={styles.marqueeWrap} aria-hidden="true">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
      <p className={styles.note}>Real feedback dari real projects.</p>
    </section>
  );
}
