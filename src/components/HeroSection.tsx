"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "./HeroSection.module.css";
import BlockyChar, { type Pose } from "./BlockyChar";

const Mic3D = dynamic(() => import("./Mic3D"), { ssr: false });

const FACE_URL = `https://crafatar.com/avatars/d5a391fb-c1cd-4385-868b-5e8a28aa1ccf?size=64&overlay=true`;

type Stage = "intro" | "spawning" | "wave" | "calling" | "running" | "collision" | "pullup";

interface Star { x: number; y: number; size: number; delay: number }

function genStars(): Star[] {
  return Array.from({ length: 70 }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const r = () => { const s = (seed * (i + 1) * 1103515245 + 12345) & 0x7fffffff; return (s % 10000) / 10000; };
    return { x: (i * 137.508) % 100, y: (i * 97.6) % 70, size: i % 5 === 0 ? 3 : 2, delay: (i * 0.23) % 4 };
  });
}

const STARS = genStars();

const FRIENDS = [
  { color: "#c0392b", leg: "#7b241c", side: "left"  as const, idx: 0, delay: "0s" },
  { color: "#2980b9", leg: "#1a5276", side: "right" as const, idx: 1, delay: "0.18s" },
  { color: "#8e44ad", leg: "#6c3483", side: "right" as const, idx: 2, delay: "0.36s" },
];

export default function HeroSection() {
  const [stage, setStage]             = useState<Stage>("intro");
  const [heroBubble, setHeroBubble]   = useState<string | null>(null);
  const [fBubble, setFBubble]         = useState<(string | null)[]>([null, null, null]);
  const [friendsVis, setFriendsVis]   = useState(false);
  const [exploding, setExploding]     = useState(false);
  const scrollBound                   = useRef(false);
  const micWrapRef                    = useRef<HTMLDivElement>(null);
  const sectionRef                    = useRef<HTMLElement>(null);
  const scrollRef                     = useRef<number>(0);   // 0-1, hero section only

  // Scroll-driven mic: reveal → rotate → fade-out → hide (bounded to hero section)
  useEffect(() => {
    if (stage !== "intro") return;
    const el = micWrapRef.current;
    if (!el) return;

    let autoTimer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      clearTimeout(autoTimer);
      const introH = sectionRef.current?.offsetHeight ?? window.innerHeight * 2;
      const sy     = window.scrollY;

      // Hard-hide once fully past the hero section
      if (sy >= introH) {
        el.style.transition = "none";
        el.style.opacity    = "0";
        scrollRef.current   = 1;
        return;
      }

      // Reveal: 0→1 over first 140px of scroll
      const reveal  = Math.min(Math.max((sy - 20) / 140, 0), 1);
      // Fade-out: starts 280px before section end → 0 at section end
      const fadeOut = Math.min(Math.max((introH - sy) / 280, 0), 1);

      el.style.transition = "none";
      el.style.opacity    = String(reveal * fadeOut);
      el.style.transform  = `translateX(-50%) translateY(${(1 - reveal) * -88}px)`;
      scrollRef.current   = sy / introH;
    };

    // Auto-reveal if user never scrolls (after 1.8s)
    autoTimer = setTimeout(() => {
      if (!el) return;
      el.style.transition = "opacity 0.8s ease, transform 0.9s cubic-bezier(0.34,1.3,0.64,1)";
      el.style.opacity    = "1";
      el.style.transform  = "translateX(-50%) translateY(0px)";
    }, 1800);

    el.style.opacity   = "0";
    el.style.transform = "translateX(-50%) translateY(-88px)";
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(autoTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [stage]);

  const handlePlay = useCallback(() => {
    setExploding(true);
    setTimeout(() => {
      setStage("spawning");
      setExploding(false);
    }, 600);

    // Hero lands
    setTimeout(() => {
      setStage("wave");
      setHeroBubble("Hi! Selamat datang ke BurhanDev! 👋");
    }, 1600);

    // Attach scroll trigger
    setTimeout(() => {
      if (scrollBound.current) return;
      scrollBound.current = true;

      const onScroll = () => {
        if (window.scrollY < 50) return;
        window.removeEventListener("scroll", onScroll);

        setStage("calling");
        setHeroBubble("Jom korang! Lari cepat! 📣");
        setTimeout(() => setFriendsVis(true), 400);

        setTimeout(() => setStage("running"), 1000);

        // Collision
        setTimeout(() => {
          setStage("collision");
          setHeroBubble("Ouch! 💥");
          setFBubble(["Ouch! 💢", "Aduh! ⭐", "Aiya! 💫"]);
        }, 3600);

        // Pullup
        setTimeout(() => {
          setStage("pullup");
          setHeroBubble(null);
          setFBubble([null, "Hnnng... 💪", null]);
        }, 6800);
      };
      window.addEventListener("scroll", onScroll);
    }, 2600);
  }, []);

  const heroPose: Pose = stage === "wave" ? "wave"
    : stage === "calling"   ? "call"
    : (stage === "collision" || stage === "pullup") ? "fall"
    : "idle";

  const friendPose = (idx: number): Pose => {
    if (!friendsVis) return "idle";
    if (stage === "running") return "run";
    if (stage === "collision") return "fall";
    if (stage === "pullup") return idx === 1 ? "pull" : "fall";
    return "idle";
  };

  // ── STAGE 1: Intro screen ───────────────────────────
  if (stage === "intro") {
    return (
      <section
        ref={sectionRef}
        className={`${styles.introScreen} ${exploding ? styles.exploding : ""}`}
      >
        {/* PC Monitor frame — dark bezel + chin */}
        <div className={styles.monitorBezel} aria-hidden="true" />
        <div className={styles.monitorChin} aria-hidden="true">
          <div className={styles.chinLed} />
          <span className={styles.chinBrand}>BURHAN</span>
          <div className={styles.chinBtn} />
        </div>

        {/* 3D Condenser Microphone (R3F) — scroll-triggered entrance + rotation */}
        <div ref={micWrapRef} className={styles.mic3dWrap} aria-hidden="true">
          <Mic3D scrollRef={scrollRef} />
        </div>

        {/* 3D decorative balls — left shelf */}
        <div className={styles.balls} aria-hidden="true">
          <div className={styles.ball1} />
          <div className={styles.ball2} />
          <div className={styles.ball3} />
        </div>

        {/* headline + CTA */}
        <div className={styles.introContent}>
          <h1 className={styles.introTitle}>BURHANDEV.</h1>
          <p className={styles.introSub}>BUILD YOUR NEXT BOLD SITE.</p>
          <button className={styles.playBtn} onClick={handlePlay} aria-label="Enter BurhanDev">
            <span className={styles.playIcon} aria-hidden="true">▶</span>
            <span>CLICK TO PLAY</span>
          </button>
        </div>
      </section>
    );
  }

  // ── STAGES 2-6: scene ───────────────────────────────
  return (
    <section className={`${styles.heroScene} ${stage === "collision" ? styles.shake : ""}`}>
      {/* Stars */}
      <div className={styles.stars} aria-hidden="true">
        {STARS.map((s, i) => (
          <div key={i} className={styles.star} style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            animationDelay: `${s.delay}s`,
          }} />
        ))}
      </div>

      {/* Ghost headline */}
      <div className={styles.ghostText} aria-hidden="true">
        <span>WE BUILD</span>
        <span>BOLD</span>
      </div>

      {/* Minecraft Press Start 2P font link */}
      <link
        href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
        rel="stylesheet"
      />

      {/* Scene */}
      <div className={styles.scene}>
        {/* Left friends */}
        {friendsVis && FRIENDS.filter(f => f.side === "left").map(f => (
          <div key={f.idx}
            className={`${styles.friendWrap} ${styles.friendLeft}
              ${stage === "running" ? styles.runLeft : ""}
              ${stage === "collision" || stage === "pullup" ? styles.collided : ""}`}
            style={{ animationDelay: f.delay }}>
            {fBubble[f.idx] && <div className={styles.miniBubble}>{fBubble[f.idx]}</div>}
            <BlockyChar color={f.color} legColor={f.leg} pose={friendPose(f.idx)} flip />
          </div>
        ))}

        {/* Hero */}
        <div className={`${styles.heroWrap} ${stage === "spawning" ? styles.heroSpawn : ""}`}>
          {heroBubble && (
            <div className={styles.bubble} key={heroBubble}>
              <p>{heroBubble}</p>
            </div>
          )}
          {stage === "spawning" && <div className={styles.dustCloud} aria-hidden="true" />}
          <BlockyChar color="#5c8a3c" legColor="#3d5e28" faceUrl={FACE_URL}
            pose={heroPose} scale={1.45} />
        </div>

        {/* Right friends */}
        {friendsVis && FRIENDS.filter(f => f.side === "right").map(f => (
          <div key={f.idx}
            className={`${styles.friendWrap} ${styles.friendRight}
              ${stage === "running" ? styles.runRight : ""}
              ${stage === "collision" || stage === "pullup" ? styles.collided : ""}`}
            style={{ animationDelay: f.delay }}>
            {fBubble[f.idx] && <div className={styles.miniBubble}>{fBubble[f.idx]}</div>}
            <BlockyChar color={f.color} legColor={f.leg} pose={friendPose(f.idx)} />
          </div>
        ))}
      </div>

      {/* Rope for pullup stage */}
      {stage === "pullup" && <div className={styles.rope} aria-hidden="true" />}

      {/* Ground (Minecraft grass) */}
      <div className={styles.ground} />
    </section>
  );
}
