import ScrollEffects from "../src/components/ScrollEffects";
import HeroSection from "../src/components/HeroSection";
import ScrubVideoSection from "../src/components/ScrubVideoSection";
import NavMenu from "../src/components/NavMenu";
import WorkSection from "../src/components/WorkSection";
import MarqueeStrip from "../src/components/MarqueeStrip";
import StatsSection from "../src/components/StatsSection";
import TechStackSection from "../src/components/TechStackSection";
import PricingSection from "../src/components/PricingSection";
import TestimonialsSection from "../src/components/TestimonialsSection";

export default function Home() {
  return (
    <div id="app">
      <header className="top-shell" aria-label="Primary navigation">
        <a className="brand-lockup" href="#top" aria-label="BURHANDEV home">
          <span>BURHANDEV</span>
        </a>
        <NavMenu />
      </header>

      <main>
        <HeroSection />
        <ScrubVideoSection
          src="/videos/project1.mp4"
          heightVh={750}
          ariaLabel="BURHANDEV keyboard transition"
          heading="Built for Performance."
          subheading="Real hardware, real focus. The setup behind every line we ship."
          headingWindow={[0.04, 0.13, 0.32, 0.4]}
          endTag="Loading the Next Level."
          endTagWindow={[0.85, 0.91, 0.97, 0.995]}
          curtainWindow={[0.95, 0.045]}
        />

        <StatsSection />

        <WorkSection />

        <MarqueeStrip />

        <TechStackSection />

        <PricingSection />

        <section id="work" className="work-section reveal" aria-labelledby="work-title">
          <div className="work-copy">
            <p className="eyebrow">Why Us</p>
            <h2 id="work-title">Why BURHANDEV?</h2>
            <p>
              We build websites like products: a visual system, a brand story,
              and a flow that drives visitors straight to action.
            </p>
          </div>

          <div className="work-panels" aria-hidden="true">
            <article>
              <span>Bold</span>
              <strong>Bold design that fits your brand</strong>
            </article>
            <article>
              <span>Fast</span>
              <strong>Fast & smooth on every device</strong>
            </article>
            <article>
              <span>Convert</span>
              <strong>Visitors turn into customers</strong>
            </article>
          </div>
        </section>

        <section id="contact" className="contact-section reveal" aria-labelledby="contact-title">
          <p className="eyebrow">Start</p>
          <h2 id="contact-title">Want a BURHANDEV-style website for your project?</h2>
          <p>Send us a brief scope, deadline, and style references. We&apos;ll map out the next step.</p>
          <div className="contact-cards">
            <a className="contact-card" href="mailto:sales@burhan.my">
              <span className="contact-card__label">Sales</span>
              <span className="contact-card__email">sales@burhan.my</span>
              <span className="contact-card__hint">New projects &amp; quotes <span aria-hidden="true">→</span></span>
            </a>
            <a className="contact-card" href="mailto:support@burhan.my">
              <span className="contact-card__label">Support</span>
              <span className="contact-card__email">support@burhan.my</span>
              <span className="contact-card__hint">Existing projects &amp; help <span aria-hidden="true">→</span></span>
            </a>
          </div>
        </section>

        <TestimonialsSection />
      </main>

      <footer className="site-footer site-footer--new">
        <div className="site-footer__inner reveal">
          <div className="site-footer__top">
            <nav className="site-footer__nav">
              <a href="/#hero">Home</a>
              <a href="/#about">About Us</a>
              <a href="/#story">Story</a>
              <a href="/#services">Services</a>
              <a href="/contact">Contact Us</a>
            </nav>
            <div className="site-footer__social">
              <a href="https://www.threads.com/@burhanbistro" target="_blank" rel="noreferrer">Threads</a>
              <span className="site-footer__sep" aria-hidden="true">|</span>
              <a href="https://www.instagram.com/burhanbistro" target="_blank" rel="noreferrer">Instagram</a>
              <span className="site-footer__sep" aria-hidden="true">|</span>
              <a href="https://x.com/BurhanSupp93316" target="_blank" rel="noreferrer">X</a>
              <span className="site-footer__sep" aria-hidden="true">|</span>
              <a href="https://www.facebook.com/profile.php?id=61574313087464&_rdc=1&_rdr#" target="_blank" rel="noreferrer">Facebook</a>
              <span className="site-footer__sep" aria-hidden="true">|</span>
              <a href="https://www.tiktok.com/@burhanbistro" target="_blank" rel="noreferrer">TikTok</a>
            </div>
          </div>
          <div className="site-footer__brand">
            <h2 className="site-footer__wordmark">BURHANDEV</h2>
            <img
              className="site-footer__logo"
              src="/brand/burhan-logo2.png"
              alt="BURHANDEV logo"
              width={64}
              height={64}
            />
          </div>
          <div className="site-footer__bottom">
            <p className="site-footer__tagline">DESIGN TO DISRUPT.</p>
            <p className="site-footer__copy">© 2026 BURHANDEV ENTERPRISE<span className="site-footer__copy-sep">|</span>202603062782 (003830874-A)</p>
          </div>
        </div>
      </footer>

      <ScrollEffects />
    </div>
  );
}
