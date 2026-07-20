"use client";

// Section video scroll-scrub generik — elemen sama seperti hero:
// section tinggi + video sticky, frame dipandu scroll melalui useVideoScrub.

import { useCallback, useRef } from "react";
import useVideoScrub from "./useVideoScrub";
import styles from "./ScrubVideoSection.module.css";

interface FadeWindow {
  /** [inStart, inEnd, outStart, outEnd] dalam progress 0..1 */
  window: [number, number, number, number];
}

interface PositionedOverlay {
  /** Kotak posisi sebagai peratus kawasan video (left/top/width/height, "0-100"). */
  box: { top: number; left: number; width: number; height: number };
  text: string;
  window: [number, number, number, number];
  /** Animasi kelip berterusan (bukan sekadar fade in/out sekali). */
  blink?: boolean;
  /** Ada href = jadi butang boleh klik yang scroll ke section tersebut. */
  href?: string;
  variant?: "badge" | "card" | "button";
}

interface ScrubVideoSectionProps {
  src: string;
  /** Tinggi journey dalam vh (lalai 320). */
  heightVh?: number;
  shade?: boolean;
  children?: React.ReactNode;
  ariaLabel?: string;
  /** Heading utama — fade in awal, fade out sebelum pertengahan journey. */
  heading?: string;
  subheading?: string;
  headingWindow?: FadeWindow["window"];
  /** Teks kedua disegerak dengan detik "ending" video (contoh: dissolve),
   * fade out sebelum tirai akhir mula gelap. */
  endTag?: string;
  endTagWindow?: FadeWindow["window"];
  /** [mula, tempoh] tirai akhir gelap — lalai [0.88, 0.11]. Naikkan "mula"
   * kalau video ada payoff visual lewat (contoh reveal menu) yang perlu
   * kekal jelas lebih lama sebelum digelapkan. */
  curtainWindow?: [number, number];
  /** Elemen berposisi bebas atas video: badge berkelip, label kad, atau
   * butang boleh klik (href) — semua digerakkan oleh progress yang sama. */
  overlays?: PositionedOverlay[];
}

/** Segitiga fade: 0 -> 1 antara [inStart,inEnd], kekal 1, 1 -> 0 antara [outStart,outEnd] */
function windowedFade(p: number, [inStart, inEnd, outStart, outEnd]: FadeWindow["window"]) {
  if (p <= inStart || p >= outEnd) return 0;
  if (p < inEnd) return (p - inStart) / (inEnd - inStart);
  if (p < outStart) return 1;
  return 1 - (p - outStart) / (outEnd - outStart);
}

export default function ScrubVideoSection({
  src,
  heightVh = 320,
  shade = true,
  children,
  ariaLabel,
  heading,
  subheading,
  headingWindow = [0.05, 0.15, 0.42, 0.52],
  endTag,
  endTagWindow = [0.6, 0.68, 0.82, 0.87],
  curtainWindow = [0.88, 0.11],
  overlays = [],
}: ScrubVideoSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const blendRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const endTagRef = useRef<HTMLDivElement>(null);
  const overlayRefs = useRef<Array<HTMLDivElement | HTMLAnchorElement | null>>([]);

  // Zoom halus; video kelihatan penuh dari awal (curtain reveal dari
  // section sebelumnya) dan gelap beransur menjelang hujung journey
  // (sepadan tempoh tirai hero, bukan dimampatkan ke saat terakhir).
  // topBlend melembutkan garis sempadan semasa handoff, kemudian larut.
  // heading/endTag ialah teks scroll-triggered — fade in/out ikut progress.
  const onProgress = useCallback((p: number) => {
    const v = videoRef.current;
    if (v) {
      v.style.transform = `scale(${(1 + p * 0.07).toFixed(3)})`;
      const [cStart, cDur] = curtainWindow;
      const dim = Math.min(1, Math.max(0, (p - cStart) / cDur));
      v.style.opacity = String(Math.max(0, 1 - dim));
    }
    // Larut lebih beransur (gone by ~45% journey) — sepadan tempoh tirai
    // akhir video sebelumnya supaya tiada sempadan tegas semasa handoff
    const b = blendRef.current;
    if (b) b.style.opacity = String(Math.max(0, 1 - p * 2.2));

    const h = headingRef.current;
    if (h) {
      const f = windowedFade(p, headingWindow);
      h.style.opacity = String(f);
      h.style.transform = `translateY(${((1 - f) * 18).toFixed(1)}px)`;
    }
    const e = endTagRef.current;
    if (e) {
      const f = windowedFade(p, endTagWindow);
      e.style.opacity = String(f);
      e.style.transform = `translateY(${((1 - f) * 14).toFixed(1)}px)`;
    }

    overlays.forEach((ov, i) => {
      const el = overlayRefs.current[i];
      if (!el) return;
      const f = windowedFade(p, ov.window);
      el.style.opacity = String(f);
      el.style.pointerEvents = ov.href && f > 0.5 ? "auto" : "none";
    });
  }, [headingWindow, endTagWindow, curtainWindow, overlays]);

  useVideoScrub(sectionRef, videoRef, { onProgress });

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      style={{ height: `${heightVh}vh` }}
      aria-label={ariaLabel}
    >
      <div className={styles.sticky}>
        <video
          ref={videoRef}
          className={styles.video}
          src={src}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        {shade && <div className={styles.shade} aria-hidden="true" />}
        <div ref={blendRef} className={styles.topBlend} aria-hidden="true" />

        {heading && (
          <div ref={headingRef} className={styles.textBlock} style={{ opacity: 0 }}>
            <h2 className={styles.heading2}>{heading}</h2>
            {subheading && <p className={styles.subheading2}>{subheading}</p>}
          </div>
        )}
        {endTag && (
          <div ref={endTagRef} className={styles.endTag} style={{ opacity: 0 }}>
            {endTag}
          </div>
        )}

        {overlays.map((ov, i) => {
          const boxStyle: React.CSSProperties = {
            position: "absolute",
            top: `${ov.box.top}%`,
            left: `${ov.box.left}%`,
            width: `${ov.box.width}%`,
            height: `${ov.box.height}%`,
            opacity: 0,
            pointerEvents: "none",
          };
          const cls = [
            styles.posOverlay,
            ov.variant === "card" ? styles.posCard : "",
            ov.variant === "button" ? styles.posButton : "",
            ov.variant === "badge" ? styles.posBadge : "",
            ov.blink ? styles.blinking : "",
          ]
            .filter(Boolean)
            .join(" ");

          const content =
            ov.variant === "card" && ov.text.includes("\n") ? (
              (() => {
                const [idx, label] = ov.text.split("\n");
                return (
                  <>
                    <span className={styles.cardIndex}>{idx}</span>
                    <span className={styles.cardLabel}>{label}</span>
                  </>
                );
              })()
            ) : (
              ov.text
            );

          if (ov.href) {
            return (
              <a
                key={i}
                ref={(el) => {
                  overlayRefs.current[i] = el;
                }}
                href={ov.href}
                className={cls}
                style={boxStyle}
              >
                {content}
              </a>
            );
          }
          return (
            <div
              key={i}
              ref={(el) => {
                overlayRefs.current[i] = el;
              }}
              className={cls}
              style={boxStyle}
              aria-hidden="true"
            >
              {content}
            </div>
          );
        })}

        {children && <div className={styles.overlay}>{children}</div>}
      </div>
    </section>
  );
}
