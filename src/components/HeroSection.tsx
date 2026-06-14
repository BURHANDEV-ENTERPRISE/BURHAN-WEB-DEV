"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroSection.module.css";

const PLAYERS = [
  { name: "Amad",   uuid: "d5a391fb-c1cd-4385-868b-5e8a28aa1ccf" },
  { name: "Matnep", uuid: "d0d758bd-9df5-42f0-83d7-1ae64c1e7645" },
  { name: "Kaizer", uuid: "e0ca5465-072b-4517-8320-929ecbde3d8e" },
  { name: "Moon",   uuid: "ba096b9e-5370-437d-b84b-d8eb241ddf53" },
  { name: "Ashot",  uuid: "4b5f1ad6-60cf-4c6f-8f36-4d39065561d2" },
];

// Spread across scroll, similar speeds → stay evenly spaced, random-feeling run rates
const CHARS = [
  { entry: -0.60, scroll: 0.70, runSpeed: 1.3 },
  { entry: -1.10, scroll: 0.68, runSpeed: 1.0 },
  { entry: -1.60, scroll: 0.66, runSpeed: 0.8 },
  { entry: -0.90, scroll: 0.72, runSpeed: 1.1 },
  { entry: -1.35, scroll: 0.67, runSpeed: 0.9 },
];

const GROUND_Y  = 100;
const CW        = 260;
const CH        = 380;
// Clear colour to match hero background so WebGL canvas blends in
const BG_HEX    = 0x000000;
// Index of the character that stays last and pulls the curtain up
const PULLER    = 2;

export default function HeroSection() {
  const bgCanvasRef     = useRef<HTMLCanvasElement>(null);
  const charCanvasRefs  = useRef<(HTMLCanvasElement | null)[]>([]);
  const avatarRefs      = useRef<(HTMLDivElement | null)[]>([]);
  const curtainInnerRef = useRef<HTMLDivElement>(null);
  const animFrameRef    = useRef<number>(0);

  const scrollProgressRef = useRef<number>(0);
  const lastScrollRef     = useRef<number>(0);
  const isRunningRef      = useRef<boolean>(false);
  const frozenAtRef       = useRef<number>(0);
  const facingRightRef    = useRef<boolean>(true);
  const prevProgressRef   = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewersRef        = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sv3dRef           = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idleAnimsRef      = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runAnimsRef       = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pullAnimRef       = useRef<any>(null);
  const liftProgRef       = useRef<number>(0);
  const heroOverlayRef    = useRef<HTMLDivElement>(null);
  const heroBtnRef        = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // ── Particles background ─────────────────────────────────
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const bg    = bgCanvas as HTMLCanvasElement;
    const bgCtx = bg.getContext("2d")!;

    function resizeBg() {
      bg.width  = window.innerWidth;
      bg.height = window.innerHeight;
    }
    resizeBg();
    window.addEventListener("resize", resizeBg);

    type P = { x: number; y: number; r: number; vx: number; vy: number; a: number };
    const particles: P[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * bg.width,
      y: Math.random() * bg.height,
      r: 0.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.08 - Math.random() * 0.12,
      a: 0.08 + Math.random() * 0.15,
    }));

    // ── skinview3d 3D models ─────────────────────────────────
    import("skinview3d").then((sv3d) => {
      sv3dRef.current = sv3d;
      PLAYERS.forEach((player, i) => {
        const canvas = charCanvasRefs.current[i];
        if (!canvas) return;

        try {
          const viewer = new sv3d.SkinViewer({
            canvas,
            width:  CW,
            height: CH,
          });

          viewer.renderer.setClearColor(BG_HEX, 1);

          // Slight 3/4 front view — offset Z toward character's front (-Z)
          viewer.camera.position.set(45, 10, 6);
          viewer.camera.lookAt(0, 10, 0);

          // Idle — subtle breathing/sway when standing still
          const idleAnim = new sv3d.FunctionAnimation((player: any, ctx: any) => {
            const b = Math.sin(ctx.elapsed * 1.2) * 0.025;
            const sw = Math.sin(ctx.elapsed * 0.7) * 0.015;
            player.skin.body.rotation.set(0.06 + b, sw, 0);
            player.skin.head.rotation.set(-0.05 - b * 0.5, -sw * 1.5, 0);
            player.skin.rightArm.rotation.set(0.08, 0,  0.22 + b);
            player.skin.leftArm.rotation.set( 0.08, 0, -0.22 - b);
            player.skin.rightLeg.rotation.set(0, 0, 0);
            player.skin.leftLeg.rotation.set( 0, 0, 0);
          });
          idleAnimsRef.current[i] = idleAnim;

          // Running — forward lean + dynamic arm/leg swing matching reference frames
          const spd = CHARS[i].runSpeed;
          const runAnim = new sv3d.FunctionAnimation((player: any, ctx: any) => {
            const t   = ctx.elapsed * spd * 3.2;
            const leg = Math.sin(t) * 0.95;
            const arm = Math.sin(t + Math.PI) * 0.82;
            const bob = Math.abs(Math.sin(t)) * 0.04;
            player.skin.body.rotation.set(0.32 + bob, 0, 0);
            player.skin.head.rotation.set(-0.08, 0, 0);
            player.skin.rightLeg.rotation.set( leg, 0,  0.04);
            player.skin.leftLeg.rotation.set( -leg, 0, -0.04);
            player.skin.rightArm.rotation.set( arm, 0,  0.12);
            player.skin.leftArm.rotation.set( -arm, 0, -0.12);
          });
          runAnimsRef.current[i] = runAnim;

          viewer.animation = idleAnim;

          // Slight toward camera: Math.PI - tilt (22.5°) so face shows while running right
          viewer.playerObject.rotation.y = Math.PI - Math.PI / 8;
          viewersRef.current[i] = viewer;

          viewer.loadSkin(`https://mc-heads.net/skin/${player.uuid}`).catch(console.error);
        } catch (e) {
          console.error("skinview3d init error", e);
        }
      });
    }).catch(console.error);

    // ── Main RAF loop (particles only) ───────────────────────
    function loop() {
      const now = Date.now();

      // Stop running 200ms after last scroll
      if (isRunningRef.current && now - lastScrollRef.current > 200) {
        isRunningRef.current = false;
        frozenAtRef.current  = now;
        viewersRef.current.forEach((v, idx) => {
          if (!v) return;
          // Keep puller animating while actively pulling curtain
          if (idx === PULLER && liftProgRef.current > 0.05) return;
          v.animation = idleAnimsRef.current[idx];
        });
      }

      // Update facing direction on viewers
      const facingRight = facingRightRef.current;
      viewersRef.current.forEach((v, idx) => {
        if (!v) return;
        // Puller faces more directly toward viewer during pull
        if (idx === PULLER && liftProgRef.current > 0.05) {
          v.playerObject.rotation.y = Math.PI / 2;
          return;
        }
        // slight toward camera on both directions (22.5° tilt)
        v.playerObject.rotation.y = facingRight
          ? Math.PI - Math.PI / 8   // running right, face slightly toward camera
          : Math.PI / 8;            // running left, face slightly toward camera
      });

      bgCtx.clearRect(0, 0, bg.width, bg.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = bg.height + 10; p.x = Math.random() * bg.width; }
        if (p.x < -10) p.x = bg.width + 10;
        if (p.x > bg.width + 10) p.x = -10;
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(196,164,74,${p.a})`;
        bgCtx.fill();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    }
    loop();

    // ── Scroll handler ────────────────────────────────────────
    const hero = document.querySelector<HTMLElement>("[data-scroll-stage]");
    function updateScroll() {
      if (!hero) return;
      const bounds   = hero.getBoundingClientRect();
      const travel   = Math.max(1, bounds.height - window.innerHeight);
      const progress = Math.min(Math.max(-bounds.top / travel, 0), 1);

      // Detect direction
      const prev = prevProgressRef.current;
      if (progress !== prev) {
        facingRightRef.current  = progress > prev;
        prevProgressRef.current = progress;
      }

      scrollProgressRef.current = progress;
      lastScrollRef.current     = Date.now();

      // Start running
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        viewersRef.current.forEach((v, i) => {
          if (v) v.animation = runAnimsRef.current[i];
        });
      }

      // Phase timings
      const reachStart  = 0.70;
      const liftStart   = 0.85;

      // ease-out on lift
      const liftRaw   = Math.max(0, (progress - liftStart) / (1 - liftStart));
      const liftProg  = 1 - Math.pow(1 - Math.min(1, liftRaw), 2);
      liftProgRef.current = liftProg;

      avatarRefs.current.forEach((el, i) => {
        if (!el) return;
        const c    = CHARS[i];
        const runX = (c.entry + progress * 2.8) * window.innerWidth * c.scroll;

        if (i === PULLER && progress >= reachStart) {
          // Position at curtain top edge — rises with curtain (the "pull" effect)
          const curtainTopPx = liftProg > 0
            ? window.innerHeight * (1 - liftProg)
            : window.innerHeight * (GROUND_Y / 100);
          const centerX = window.innerWidth / 2 - CW / 2;

          el.style.top        = `${curtainTopPx}px`;
          el.style.left       = "0px";
          el.style.opacity    = "1";
          el.style.transition = "opacity 0.3s ease";
          el.style.transform  = `translateX(${centerX}px) translateY(-85%)`;

          // Switch to pulling pose when curtain is rising
          if (liftProg > 0.05) {
            const sv3d = sv3dRef.current;
            const v = viewersRef.current[PULLER];
            if (sv3d && v && sv3d.FunctionAnimation && v.animation !== pullAnimRef.current) {
              const pullAnim = new sv3d.FunctionAnimation((player: any, ctx: any) => {
                const CYCLE = 1.5;
                const t = (ctx.elapsed % CYCLE) / CYCLE;
                function s(x: number) { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); }

                let headX: number, bodyX: number;
                let rArmX: number, lArmX: number;
                let rArmZ: number, lArmZ: number;
                let rLegX: number, lLegX: number;

                if (t < 0.30) {
                  // Reach up — arms raise, head tilts back, body arches back
                  const p = s(t / 0.30);
                  headX = -0.5 * p; bodyX = -0.25 * p;
                  rArmX = 2.8 * p;  lArmX = 2.8 * p;
                  rArmZ = 0.2 + 0.4 * p; lArmZ = -(0.2 + 0.4 * p);
                  rLegX = 0.15 * p; lLegX = -0.15 * p;
                } else if (t < 0.70) {
                  // Pull down — arms drag curtain down, body leans forward
                  const p = s((t - 0.30) / 0.40);
                  headX = -0.5 + 1.0 * p; bodyX = -0.25 + 0.6 * p;
                  rArmX = 2.8 - 3.4 * p;  lArmX = 2.8 - 3.4 * p;
                  rArmZ = 0.6 - 0.2 * p;  lArmZ = -(0.6 - 0.2 * p);
                  rLegX = 0.15 - 0.05 * p; lLegX = -(0.15 - 0.05 * p);
                } else if (t < 0.85) {
                  // Hold low — body recovers
                  const p = s((t - 0.70) / 0.15);
                  headX = 0.5 - 0.9 * p; bodyX = 0.35 - 0.55 * p;
                  rArmX = -0.6 + 0.4 * p; lArmX = -0.6 + 0.4 * p;
                  rArmZ = 0.4; lArmZ = -0.4;
                  rLegX = 0.1; lLegX = -0.1;
                } else {
                  // Snap back up to reach
                  const p = s((t - 0.85) / 0.15);
                  headX = -0.4 - 0.1 * p; bodyX = -0.2 - 0.05 * p;
                  rArmX = -0.2 + 3.0 * p; lArmX = -0.2 + 3.0 * p;
                  rArmZ = 0.4 + 0.2 * p;  lArmZ = -(0.4 + 0.2 * p);
                  rLegX = 0.1 + 0.05 * p; lLegX = -(0.1 + 0.05 * p);
                }

                player.skin.head.rotation.set(headX, 0, 0);
                player.skin.body.rotation.set(bodyX, 0, 0);
                player.skin.rightArm.rotation.set(rArmX, 0, rArmZ);
                player.skin.leftArm.rotation.set(lArmX, 0, lArmZ);
                player.skin.rightLeg.rotation.set(rLegX, 0, 0);
                player.skin.leftLeg.rotation.set(lLegX, 0, 0);
              });
              pullAnimRef.current = pullAnim;
              v.animation = pullAnim;
            }
          }
          return;
        }

        // Reset puller when scrolling back up
        if (i === PULLER && progress < reachStart) {
          el.style.top  = `${GROUND_Y}%`;
          el.style.left = "50%";
          const v = viewersRef.current[PULLER];
          if (v && v.animation === pullAnimRef.current) {
            v.animation = isRunningRef.current
              ? runAnimsRef.current[PULLER]
              : idleAnimsRef.current[PULLER];
          }
        }

        const hide = progress <= 0.02 || progress >= 0.97 || runX > window.innerWidth * 0.75;
        el.style.transition = "opacity 0.3s ease";
        el.style.opacity    = hide ? "0" : "1";
        el.style.transform  = `translate(calc(-50% + ${runX}px), -85%)`;
      });

      // Fade hero overlay text as user starts scrolling
      const overlay = heroOverlayRef.current;
      if (overlay) {
        overlay.style.opacity = String(Math.max(0, 1 - progress * 6));
        overlay.style.pointerEvents = progress > 0.1 ? "none" : "auto";
      }

      // Curtain rises after character grabs (inside hero, above dark bg, below avatars)
      const curtain = curtainInnerRef.current;
      if (curtain) {
        curtain.style.transform = `translateY(${(1 - liftProg) * 100}%)`;
        curtain.style.boxShadow = liftProg > 0.05
          ? `0 -10px 50px rgba(200,40,40,${0.7 * liftProg})`
          : "none";
      }
    }
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);

    return () => {
      window.removeEventListener("resize", resizeBg);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      cancelAnimationFrame(animFrameRef.current);
      viewersRef.current.forEach((v) => v?.dispose());
    };
  }, []);

  // Magnetic button effect — button follows cursor like Cinnamon
  useEffect(() => {
    const btn = heroBtnRef.current;
    if (!btn) return;
    const inner = btn.querySelector<HTMLElement>("[data-magnetic-inner-target]");

    function onMove(e: MouseEvent) {
      const r  = btn!.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist   = Math.sqrt(dx * dx + dy * dy);
      const radius = Math.max(r.width, r.height) * 0.9;
      if (dist < radius) {
        const p  = 1 - dist / radius;
        const mx = dx * p * 0.45;
        const my = dy * p * 0.45;
        btn!.style.transform  = `translate(${mx}px, ${my}px)`;
        if (inner) inner.style.transform = `translate(${mx * 0.5}px, ${my * 0.5}px)`;
      }
    }

    function onLeave() {
      btn!.style.transform  = "";
      if (inner) inner.style.transform = "";
    }

    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("mouseleave", onLeave);
    return () => {
      btn.removeEventListener("mousemove", onMove);
      btn.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
    <div id="top" className={styles.scrollStage} data-scroll-stage="">
      <section className={styles.hero}>
        <canvas ref={bgCanvasRef} className={styles.canvas} />
        <div ref={curtainInnerRef} className={styles.curtainInner} />
        <div className={styles.avatarLayer}>
          {PLAYERS.map((player, i) => (
            <div
              key={player.uuid}
              ref={(el) => { avatarRefs.current[i] = el; }}
              className={styles.avatarCard}
              style={{
                left: "50%",
                top: `${GROUND_Y}%`,
                transform: "translate(calc(-50% - 200vw), -85%)",
              }}
            >
              <canvas
                ref={(el) => { charCanvasRefs.current[i] = el; }}
                className={styles.avatarCanvas}
                width={CW}
                height={CH}
              />
            </div>
          ))}
        </div>

        {/* Hero title overlay — fades on scroll */}
        <div ref={heroOverlayRef} className={styles.heroOverlay}>
          <div className={styles.heroCenterContent}>
            <h1 className={styles.heroTitle} aria-label="BURHANDEV. Web yang berani, rasa laju." style={{ opacity: 1 }}>
              {(() => {
                let idx = 0;
                return [
                  ["BURHANDEV."],
                  ["Web", "yang", "berani,"],
                  ["rasa", "laju."],
                ].map((words, li) => (
                  <div key={li} aria-hidden="true" style={{ position: "relative", display: "block", textAlign: "center" }}>
                    {words.map((word, wi) => (
                      <>
                        {wi > 0 && " "}
                        <div key={wi} aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>
                          {word.split("").map((ch, ci) => {
                            const delay = `${idx++ * 0.038 + 0.15}s`;
                            return (
                              <div key={ci} aria-hidden="true" className={styles.heroLetter} style={{ animationDelay: delay }}>
                                {ch}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ))}
                  </div>
                ));
              })()}
            </h1>

            <div className={styles.heroCta}>
              <div className={styles.heroBtnWrap}>
                <button ref={heroBtnRef} className={styles.heroBtn} onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>
                  <div className={styles.heroBtnBg} />
                  <div className={styles.heroBtnInner} data-magnetic-inner-target="">
                    <div className={styles.heroBtnIconBox}>
                      <div className={styles.heroBtnIconBorder} />
                      <div className={styles.heroBtnIconSlider}>
                        <svg className={styles.heroBtnSvg} xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16" fill="none">
                          <path d="M11.4931 8.17516L0.769825 15.0502C0.537362 15.1992 0.228082 15.1316 0.0790342 14.8992C0.025763 14.816-0.00172645 14.719 3.87638e-05 14.6203L0.252776 0.491131C0.257715 0.215025 0.485543-0.00478539 0.761639 0.000153306C0.860333 0.00191871 0.956305 0.0328602 1.03744 0.0890703L11.508 7.34319C11.735 7.50048 11.7915 7.81204 11.6342 8.03896C11.5966 8.0932 11.5487 8.13955 11.4931 8.17516Z" fill="white"/>
                        </svg>
                        <svg className={`${styles.heroBtnSvg} ${styles.heroBtnSvgClone}`} xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16" fill="none">
                          <path d="M11.4931 8.17516L0.769825 15.0502C0.537362 15.1992 0.228082 15.1316 0.0790342 14.8992C0.025763 14.816-0.00172645 14.719 3.87638e-05 14.6203L0.252776 0.491131C0.257715 0.215025 0.485543-0.00478539 0.761639 0.000153306C0.860333 0.00191871 0.956305 0.0328602 1.03744 0.0890703L11.508 7.34319C11.735 7.50048 11.7915 7.81204 11.6342 8.03896C11.5966 8.0932 11.5487 8.13955 11.4931 8.17516Z" fill="white"/>
                        </svg>
                      </div>
                    </div>
                    <span className={styles.heroBtnTextWrap}>
                      <span className={styles.heroBtnTextPrimary}>Mulakan Projek</span>
                      <span aria-hidden="true" className={styles.heroBtnTextClone}>Mulakan Projek</span>
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
