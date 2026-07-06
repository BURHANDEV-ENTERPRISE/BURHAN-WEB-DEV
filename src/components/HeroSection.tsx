"use client";

import { useRef, useState, useCallback } from "react";
import styles from "./HeroSection.module.css";
import BlockyChar, { type Pose } from "./BlockyChar";
import useVideoScrub from "./useVideoScrub";

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
  const contentRef                    = useRef<HTMLDivElement>(null);
  const videoRef                      = useRef<HTMLVideoElement>(null);
  const sectionRef                    = useRef<HTMLElement>(null);

  // Overlay ikut progress terlembut: headline naik & pudar pada 25% akhir,
  // video zoom halus sepanjang journey
  const onScrubProgress = useCallback((p: number) => {
    const el = contentRef.current;
    if (el) {
      const fade = p < 0.75 ? 0 : (p - 0.75) / 0.25;
      el.style.transform = `translateX(-50%) translateY(${(-fade * 64).toFixed(1)}px)`;
      el.style.opacity = String(Math.max(0, 1 - fade * 1.1));
    }
    const v = videoRef.current;
    if (v) {
      v.style.transform = `scale(${(1 + p * 0.07).toFixed(3)})`;
      // Dip-to-black di hujung journey — handoff ke section seterusnya
      // jadi gelap-ke-gelap, tiada seam video bertindih
      v.style.opacity = String(
        p > 0.9 ? Math.max(0, 1 - (p - 0.9) / 0.08) : 1
      );
    }
  }, []);

  // Enjin scrub dikongsi (seek-aware + IO gate + reduced-motion safe)
  useVideoScrub(sectionRef, videoRef, {
    enabled: stage === "intro",
    onProgress: onScrubProgress,
  });

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

  // ── STAGE 1: Intro — video Flow scroll-scrub (260vh, sticky) ────
  if (stage === "intro") {
    return (
      <section
        ref={sectionRef}
        className={`${styles.videoScrubSection} ${exploding ? styles.exploding : ""}`}
        aria-label="BURHANDEV hero"
      >
        <div className={styles.videoSticky}>
          {/* Video Flow — frame dipandu scroll */}
          <div className={styles.roomWrap} aria-hidden="true">
            <video
              ref={videoRef}
              className={styles.heroVideo}
              src="/videos/flow.mp4"
              muted
              playsInline
              preload="auto"
            />
            <div className={styles.videoShade} />
          </div>

          {/* headline — dipindah dari OpenSection */}
          <div ref={contentRef} className={styles.introContent}>
            <h1 className={styles.introTitle} aria-label="Enter the World of BURHANDEV">
              <span>ENTER THE</span>
              <span>WORLD OF</span>
              <span className={styles.introBrand}>BURHANDEV</span>
            </h1>
            <p className={styles.introSub}>
              We don&apos;t just build sites — we craft experiences that convert.
            </p>
          </div>
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
