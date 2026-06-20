"use client";
import styles from "./BlockyChar.module.css";

export type Pose = "idle" | "wave" | "call" | "run" | "fall" | "pull";

interface BoxProps {
  w: number; h: number; d: number;
  color: string;
  frontImg?: string;
  style?: React.CSSProperties;
  className?: string;
}

function Box({ w, h, d, color, frontImg, style, className }: BoxProps) {
  const base: React.CSSProperties = {
    position: "absolute",
    transformStyle: "preserve-3d",
  };
  return (
    <div className={className} style={{ position: "absolute", width: w, height: h, transformStyle: "preserve-3d", ...style }}>
      {/* front */}
      <div style={{ ...base, width: w, height: h,
        backgroundColor: frontImg ? undefined : color,
        backgroundImage: frontImg ? `url("${frontImg}")` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
        transform: `translateZ(${d / 2}px)` }} />
      {/* back */}
      <div style={{ ...base, width: w, height: h, backgroundColor: color,
        filter: "brightness(0.55)", transform: `rotateY(180deg) translateZ(${d / 2}px)` }} />
      {/* left  (d × h) */}
      <div style={{ ...base, width: d, height: h, left: (w - d) / 2,
        backgroundColor: color, filter: "brightness(0.72)",
        transform: `rotateY(-90deg) translateZ(${w / 2}px)` }} />
      {/* right (d × h) */}
      <div style={{ ...base, width: d, height: h, left: (w - d) / 2,
        backgroundColor: color, filter: "brightness(0.72)",
        transform: `rotateY(90deg) translateZ(${w / 2}px)` }} />
      {/* top   (w × d) */}
      <div style={{ ...base, width: w, height: d, top: (h - d) / 2,
        backgroundColor: color, filter: "brightness(1.2)",
        transform: `rotateX(90deg) translateZ(${h / 2}px)` }} />
      {/* bottom (w × d) */}
      <div style={{ ...base, width: w, height: d, top: (h - d) / 2,
        backgroundColor: color, filter: "brightness(0.48)",
        transform: `rotateX(-90deg) translateZ(${h / 2}px)` }} />
    </div>
  );
}

interface Props {
  color?: string;
  legColor?: string;
  faceUrl?: string;
  pose?: Pose;
  flip?: boolean;
  scale?: number;
}

// Character dimensions (px at scale 1):
// HEAD 40×40×40  BODY 28×40×16  ARM 14×40×14  LEG 14×44×14
// Container: 56 wide × 124 tall
export default function BlockyChar({
  color = "#5c8a3c",
  legColor,
  faceUrl,
  pose = "idle",
  flip = false,
  scale = 1,
}: Props) {
  const lc = legColor ?? color;

  return (
    <div
      className={`${styles.character} ${styles[pose]} ${flip ? styles.flip : ""}`}
      style={{ width: 56 * scale, height: 124 * scale, position: "relative",
        transformStyle: "preserve-3d",
        transform: `scale(${scale}) ${flip ? "rotateY(18deg)" : "rotateY(-18deg)"}`,
        transformOrigin: "bottom center" }}
    >
      {/* HEAD */}
      <Box w={40} h={40} d={40} color={color} frontImg={faceUrl}
        className={styles.head}
        style={{ top: 0, left: 8 }} />

      {/* BODY */}
      <Box w={28} h={40} d={16} color={color}
        className={styles.body}
        style={{ top: 40, left: 14 }} />

      {/* RIGHT ARM — pivot at shoulder (top) */}
      <div className={`${styles.limb} ${styles.rightArm}`}
        style={{ position: "absolute", top: 40, left: 0,
          width: 14, height: 40, transformStyle: "preserve-3d",
          transformOrigin: "center top" }}>
        <Box w={14} h={40} d={14} color={color} style={{ top: 0, left: 0 }} />
      </div>

      {/* LEFT ARM */}
      <div className={`${styles.limb} ${styles.leftArm}`}
        style={{ position: "absolute", top: 40, left: 42,
          width: 14, height: 40, transformStyle: "preserve-3d",
          transformOrigin: "center top" }}>
        <Box w={14} h={40} d={14} color={color} style={{ top: 0, left: 0 }} />
      </div>

      {/* RIGHT LEG — pivot at hip */}
      <div className={`${styles.limb} ${styles.rightLeg}`}
        style={{ position: "absolute", top: 80, left: 14,
          width: 14, height: 44, transformStyle: "preserve-3d",
          transformOrigin: "center top" }}>
        <Box w={14} h={44} d={14} color={lc} style={{ top: 0, left: 0 }} />
      </div>

      {/* LEFT LEG */}
      <div className={`${styles.limb} ${styles.leftLeg}`}
        style={{ position: "absolute", top: 80, left: 28,
          width: 14, height: 44, transformStyle: "preserve-3d",
          transformOrigin: "center top" }}>
        <Box w={14} h={44} d={14} color={lc} style={{ top: 0, left: 0 }} />
      </div>
    </div>
  );
}
