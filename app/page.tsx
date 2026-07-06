import ScrollEffects from "../src/components/ScrollEffects";
import HeroSection from "../src/components/HeroSection";
import ScrubVideoSection from "../src/components/ScrubVideoSection";
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
        <a className="menu-capsule" href="#contact" aria-label="Contact BURHANDEV">
          <span className="hamburger-icon" aria-hidden="true">
            <i></i>
            <i></i>
          </span>
        </a>
      </header>

      <main>
        <HeroSection />
        <ScrubVideoSection
          src="/videos/keyboard.mp4"
          heightVh={320}
          ariaLabel="BURHANDEV keyboard and monitor dissolve"
        />
        <ScrubVideoSection
          src="/videos/console.mp4"
          heightVh={320}
          ariaLabel="BURHANDEV console reveal"
        />

        <section className="manifesto-section reveal" aria-labelledby="manifesto-title">
          <p className="eyebrow">Digital Craft</p>
          <h2 id="manifesto-title">
            Web yang nampak berani, rasa laju, dan terus bawa user ke tindakan.
          </h2>
        </section>

        <StatsSection />

        <section id="services" className="services-section reveal" aria-labelledby="services-title">
          <div className="section-heading">
            <p className="eyebrow">Services</p>
            <h2 id="services-title">Pilih build yang match dengan stage bisnes.</h2>
          </div>

          <div className="service-rows">
            <article className="service-row is-active" data-service-row="" tabIndex={0}>
              <span className="row-index">01</span>
              <div className="row-copy">
                <h3>Landing Page</h3>
                <p>Offer, campaign, event, dan launch page yang fokus pada trust dan conversion.</p>
              </div>
              <div className="row-visual" aria-hidden="true">
                <div className="mini-browser"></div>
                <div className="mini-stack"></div>
              </div>
            </article>

            <article className="service-row" data-service-row="" tabIndex={0}>
              <span className="row-index">02</span>
              <div className="row-copy">
                <h3>Business Website</h3>
                <p>Company profile, service pages, gallery, contact flow, dan struktur content yang clear.</p>
              </div>
              <div className="row-visual" aria-hidden="true">
                <div className="mini-browser"></div>
                <div className="mini-stack"></div>
              </div>
            </article>

            <article className="service-row" data-service-row="" tabIndex={0}>
              <span className="row-index">03</span>
              <div className="row-copy">
                <h3>Product UI</h3>
                <p>Dashboard, portal, member area, admin console, dan interface untuk daily operation.</p>
              </div>
              <div className="row-visual" aria-hidden="true">
                <div className="mini-browser"></div>
                <div className="mini-stack"></div>
              </div>
            </article>

            <article className="service-row" data-service-row="" tabIndex={0}>
              <span className="row-index">04</span>
              <div className="row-copy">
                <h3>Fix And Care</h3>
                <p>Repair layout rosak, responsive polish, speed cleanup, deployment, dan handoff.</p>
              </div>
              <div className="row-visual" aria-hidden="true">
                <div className="mini-browser"></div>
                <div className="mini-stack"></div>
              </div>
            </article>
          </div>
        </section>

        <MarqueeStrip />

        <TechStackSection />

        <section id="process" className="process-section reveal" aria-labelledby="process-title">
          <div className="process-intro">
            <p className="eyebrow">Process</p>
            <h2 id="process-title">Dari rough idea sampai live site.</h2>
          </div>

          <div className="process-lanes">
            <article>
              <span>01</span>
              <h3>Scope</h3>
              <p>Clarify audience, offer, pages, content, CTA, dan timeline.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Design</h3>
              <p>Susun layout, visual rhythm, mobile flow, dan motion direction.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Develop</h3>
              <p>Build responsive frontend dengan code yang mudah maintain.</p>
            </article>
            <article>
              <span>04</span>
              <h3>Launch</h3>
              <p>Test, polish, deploy bila owner approve, dan handoff next steps.</p>
            </article>
          </div>
        </section>

        <PricingSection />

        <section id="work" className="work-section reveal" aria-labelledby="work-title">
          <div className="work-copy">
            <p className="eyebrow">Direction</p>
            <h2 id="work-title">Website yang ada rasa brand, bukan page kosong.</h2>
            <p>
              BURHANDEV boleh susun visual system, sections, dan interaction
              yang buat visitor cepat faham siapa anda dan apa tindakan seterusnya.
            </p>
          </div>

          <div className="work-panels" aria-hidden="true">
            <article>
              <span>Hero</span>
              <strong>Big first impression</strong>
            </article>
            <article>
              <span>Service</span>
              <strong>Clear offer rows</strong>
            </article>
            <article>
              <span>CTA</span>
              <strong>Action without friction</strong>
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

        <WorkSection />
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
