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
          src="/videos/keyboard.mp4"
          heightVh={460}
          ariaLabel="BURHANDEV keyboard and monitor dissolve"
          heading="Built for Performance."
          subheading="Real hardware, real focus — the setup behind every line we ship."
          endTag="Turning Ideas Into Interfaces"
        />
        <ScrubVideoSection
          src="/videos/console.mp4"
          heightVh={500}
          ariaLabel="BURHANDEV console reveal"
        />

        <StatsSection />

        <WorkSection />

        <MarqueeStrip />

        <TechStackSection />

        <PricingSection />

        <section id="work" className="work-section reveal" aria-labelledby="work-title">
          <div className="work-copy">
            <p className="eyebrow">Why Us</p>
            <h2 id="work-title">Kenapa BURHANDEV?</h2>
            <p>
              Sebab kami bina website macam produk — ada sistem visual, cerita
              brand, dan flow yang bawa visitor terus kepada tindakan.
            </p>
          </div>

          <div className="work-panels" aria-hidden="true">
            <article>
              <span>Bold</span>
              <strong>Design berani ikut brand</strong>
            </article>
            <article>
              <span>Fast</span>
              <strong>Laju & smooth semua device</strong>
            </article>
            <article>
              <span>Convert</span>
              <strong>Visitor jadi customer</strong>
            </article>
          </div>
        </section>

        <section id="contact" className="contact-section reveal" aria-labelledby="contact-title">
          <p className="eyebrow">Start</p>
          <h2 id="contact-title">Nak website BURHANDEV-style untuk project anda?</h2>
          <p>Hantar scope ringkas, deadline, dan contoh style. Kita susun next step.</p>
          <div className="contact-actions">
            <a className="button button-light" href="mailto:hello@burhan.my">hello@burhan.my</a>
            <a className="button button-dark" href="https://burhan.my/">burhan.my</a>
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
            <a className="site-footer__topbutton" href="#top" aria-label="Back to top">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 7-7 7 7"></path>
                <path d="M12 19V5"></path>
              </svg>
            </a>
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
