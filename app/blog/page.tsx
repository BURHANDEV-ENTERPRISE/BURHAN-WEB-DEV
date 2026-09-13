import Image from "next/image";
import Link from "next/link";
import ScrollEffects from "../../src/components/ScrollEffects";
import SideNav from "../../src/components/SideNav";
import posts from "../../src/content/blog.json";
import styles from "./blog.module.css";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogPage() {
  return (
    <div id="app">
      <header className="top-shell" aria-label="Primary navigation">
        <Link className="brand-lockup" href="/" aria-label="BURHANDEV home">
          <Image
            className="brand-lockup__logo"
            src="/brand/burhan-logo2.webp"
            alt=""
            width={32}
            height={32}
          />
          <span>BURHANDEV</span>
        </Link>
      </header>

      <SideNav />

      <main className={styles.section}>
        <p className="eyebrow">Blog</p>
        <h1 className={styles.heading}>From The Studio</h1>
        <p className={styles.sub}>Notes on building websites that actually convert.</p>

        <div className={styles.grid}>
          {posts.map((post) => (
            <article key={post.title} className={styles.card}>
              <time className={styles.date} dateTime={post.date}>
                {formatDate(post.date)}
              </time>
              <h2 className={styles.title}>{post.title}</h2>
              <p className={styles.excerpt}>{post.excerpt}</p>
              {post.link && (
                <a className={styles.readMore} href={post.link} target="_blank" rel="noreferrer">
                  Read more <span aria-hidden="true">→</span>
                </a>
              )}
            </article>
          ))}
        </div>

        <Link href="/" className={styles.backLink}>
          <span aria-hidden="true">←</span> Back to BURHANDEV
        </Link>
      </main>

      <ScrollEffects />
    </div>
  );
}
