"use client";

// Enjin scroll-scrub video yang dikongsi (hero + section lain).
// Optimization:
// - Progress dilembutkan (lerp) sebelum dipetakan ke currentTime — cair.
// - Seek-aware: tunggu event `seeked` sebelum hantar seek baru, elak
//   membanjiri decoder (punca utama scrub tersentak).
// - IntersectionObserver + visibility gate: tiada kerja bila offscreen.
// - Lazy upgrade preload metadata→auto bila section menghampiri viewport.
// - prefers-reduced-motion: enjin tidak berjalan langsung (frame statik).

import { useEffect, type RefObject } from "react";

interface ScrubOptions {
  enabled?: boolean;
  /** Dipanggil setiap frame dengan progress terlembut 0..1 (untuk overlay). */
  onProgress?: (p: number) => void;
}

export default function useVideoScrub(
  sectionRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  { enabled = true, onProgress }: ScrubOptions = {}
) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sec = sectionRef.current;
    const v = videoRef.current;
    if (!sec || !v) return;
    v.pause();

    // Aktif hanya bila section dekat viewport; naik taraf preload sekali
    let inView = false;
    let preloaded = v.preload === "auto";
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !preloaded) {
          preloaded = true;
          v.preload = "auto";
          v.load();
        }
      },
      { rootMargin: "80% 0px" }
    );
    io.observe(sec);

    // Seek-aware: satu seek pada satu masa
    let seekBusy = false;
    const onSeeked = () => {
      seekBusy = false;
    };
    v.addEventListener("seeked", onSeeked);

    let raf = 0;
    let alive = true;
    let smooth = 0;
    const tick = () => {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      if (!inView || document.visibilityState !== "visible") return;

      const rect = sec.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / travel));

      // Lembutkan progress itu sendiri — semua yang ikut dia jadi cair
      smooth += (p - smooth) * 0.14;
      if (Math.abs(p - smooth) < 0.0004) smooth = p;
      onProgress?.(smooth);

      if (!seekBusy && v.readyState >= 2 && v.duration) {
        const target = smooth * Math.max(0, v.duration - 0.08);
        if (Math.abs(target - v.currentTime) > 1 / 60) {
          seekBusy = true;
          v.currentTime = target;
        }
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      v.removeEventListener("seeked", onSeeked);
      io.disconnect();
    };
  }, [enabled, sectionRef, videoRef, onProgress]);
}
