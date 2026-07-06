"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useMotionValue } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./HeroSection.module.css";
import BlockyChar, { type Pose } from "./BlockyChar";
import HudOverlay from "./cinema3d/HudOverlay";

const CinematicHero = dynamic(() => import("./cinema3d/CinematicHero"), { ssr: false });

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
  const [reducedMotion, setReducedMotion] = useState(false);
  const [roomInView, setRoomInView]   = useState(true);
  const [tabVisible, setTabVisible]   = useState(true);
  const scrollBound                   = useRef(false);
  const roomWrapRef                   = useRef<HTMLDivElement>(null);
  const sectionRef                    = useRef<HTMLElement>(null);
  const progressRef                   = useRef(0);         // scroll 0..1 → kamera 3D
  const progressMV                    = useMotionValue(0); // sumber sama untuk HUD DOM

  // Pause render 3D bila hero keluar viewport atau tab hidden — jimat GPU masa scroll
  useEffect(() => {
    if (stage !== "intro") return;
    const el = roomWrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setRoomInView(entry.isIntersecting),
      { threshold: 0.02 }
    );
    io.observe(el);
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [stage]);

  // Hormati prefers-reduced-motion: matikan parallax + animasi RGB bilik 3D
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // GSAP ScrollTrigger: satu sumber progress memandu kamera 3D + HUD DOM
  useEffect(() => {
    if (stage !== "intro" || reducedMotion) return;
    const el = sectionRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progressRef.current = self.progress;
        progressMV.set(self.progress);
      },
    });
    return () => st.kill();
  }, [stage, reducedMotion, progressMV]);

  const handlePlay = useCallback(() => {
    window.scrollTo(0, 0); // easter egg bermula dari atas
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

  // ── STAGE 1: Intro — cinematic scroll journey bilik gaming ────
  if (stage === "intro") {
    return (
      <section
        ref={sectionRef}
        className={`${styles.cinemaSection} ${exploding ? styles.exploding : ""}`}
        aria-label="BURHANDEV cinematic hero"
      >
        <div className={styles.stickyStage}>
          {/* Scene 3D — kamera dolly ikut scroll */}
          <div ref={roomWrapRef} className={styles.roomWrap} aria-hidden="true">
            <CinematicHero
              reducedMotion={reducedMotion}
              paused={!roomInView || !tabVisible}
              progressRef={progressRef}
            />
          </div>
          {/* HUD console — segerak dengan progress kamera */}
          <HudOverlay progress={progressMV} onPlay={handlePlay} />
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
