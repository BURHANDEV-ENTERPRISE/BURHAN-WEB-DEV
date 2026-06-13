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
const BG_HEX    = 0x151510;

export default function HeroSection() {
  const bgCanvasRef     = useRef<HTMLCanvasElement>(null);
  const charCanvasRefs  = useRef<(HTMLCanvasElement | null)[]>([]);
  const avatarRefs      = useRef<(HTMLDivElement | null)[]>([]);
  const animFrameRef    = useRef<number>(0);

  const scrollProgressRef = useRef<number>(0);
  const lastScrollRef     = useRef<number>(0);
  const isRunningRef      = useRef<boolean>(false);
  const frozenAtRef       = useRef<number>(0);
  const facingRightRef    = useRef<boolean>(true);
  const prevProgressRef   = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewersRef        = useRef<any[]>([]);

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

          const anim = new sv3d.RunningAnimation();
          anim.paused = true;
          anim.speed  = CHARS[i].runSpeed;
          viewer.animation = anim;

          // Slight toward camera: Math.PI - tilt (22.5°) so face shows while running right
          viewer.playerObject.rotation.y = Math.PI - Math.PI / 8;
          viewersRef.current[i] = viewer;

          // Load skin via proxy (no CORS issue)
          viewer.loadSkin(`/api/skin/${player.uuid}`).catch(console.error);
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
        viewersRef.current.forEach((v) => {
          if (v?.animation) v.animation.paused = true;
        });
      }

      // Update facing direction on viewers
      const facingRight = facingRightRef.current;
      viewersRef.current.forEach((v) => {
        if (!v) return;
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
        viewersRef.current.forEach((v) => {
          if (v?.animation) v.animation.paused = false;
        });
      }

      avatarRefs.current.forEach((el, i) => {
        if (!el) return;
        const c    = CHARS[i];
        const runX = (c.entry + progress * 2.8) * window.innerWidth * c.scroll;
        // guarantee invisible when off-screen right OR scroll fully done
        const hide = progress <= 0.02 || progress >= 0.97 || runX > window.innerWidth * 0.75;
        el.style.transition = "opacity 0.3s ease";
        el.style.opacity    = hide ? "0" : "1";
        el.style.transform  = `translate(calc(-50% + ${runX}px), -85%)`;
      });
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

  return (
    <div id="top" className={styles.scrollStage} data-scroll-stage="">
      <section className={styles.hero}>
        <canvas ref={bgCanvasRef} className={styles.canvas} />
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
      </section>
    </div>
  );
}
