// Canvas-texture "live screens" untuk bilik gamer 3D.
// Semua kandungan dijana lokal — tiada asset/API luar.

import * as THREE from "three";

export interface LiveScreen {
  texture: THREE.CanvasTexture;
  /** Redraw penuh berdasarkan masa (saat). */
  draw: (t: number) => void;
  dispose: () => void;
}

/* ── Kod palsu untuk monitor utama ─────────────────────── */
const CODE_LINES: ReadonlyArray<readonly [string, string]> = [
  ["// burhandev — we build bold", "#6e7681"],
  ["import { Site } from \"@burhan/core\";", "#c792ea"],
  ["", "#fff"],
  ["const stack = [\"next\", \"react\", \"three\"];", "#82aaff"],
  ["", "#fff"],
  ["export function buildBoldSite(client) {", "#ffcb6b"],
  ["  const site = new Site(client.brand);", "#d6deeb"],
  ["  site.addHero({ vibe: \"3D\", bold: true });", "#d6deeb"],
  ["  site.animate(\"scroll\", { buttery: true });", "#d6deeb"],
  ["  site.a11y({ reducedMotion: \"respect\" });", "#d6deeb"],
  ["  site.deploy({ fast: true });", "#d6deeb"],
  ["  return site.launch();", "#7fdb8f"],
  ["}", "#ffcb6b"],
  ["", "#fff"],
  ["// > lighthouse 98 · LCP 1.9s ✓", "#7fdb8f"],
];

const CODE_CPS = 26;          // kelajuan menaip (aksara/saat)
const CODE_LOOP_PAUSE = 3.5;  // rehat sebelum ulang

export function createCodeScreen(): LiveScreen {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const totalChars = CODE_LINES.reduce((n, [s]) => n + Math.max(s.length, 1), 0);
  const loopDur = totalChars / CODE_CPS + CODE_LOOP_PAUSE;

  const draw = (t: number) => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, w, h);

    // Bar tajuk editor
    ctx.fillStyle = "#161b22";
    ctx.fillRect(0, 0, w, 30);
    const dots = ["#ff5f57", "#febc2e", "#28c840"];
    dots.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(20 + i * 20, 15, 5.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#8b949e";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("site.ts — burhandev", w / 2, 19);
    ctx.textAlign = "left";

    // Baris kod menaip mengikut masa
    const typed = Math.floor(((t % loopDur) * CODE_CPS));
    ctx.font = "15px Consolas, monospace";
    let used = 0;
    let y = 56;
    for (const [line, color] of CODE_LINES) {
      const cost = Math.max(line.length, 1);
      if (used >= typed) break;
      const visible = Math.min(line.length, typed - used);
      ctx.fillStyle = color;
      ctx.fillText(line.slice(0, visible), 18, y);
      used += cost;
      // Kursor berkelip di baris aktif
      if (used > typed && Math.floor(t * 2.4) % 2 === 0) {
        const cw = ctx.measureText(line.slice(0, visible)).width;
        ctx.fillStyle = "#58a6ff";
        ctx.fillRect(20 + cw, y - 13, 8, 16);
      }
      y += 21;
      if (y > h - 12) break;
    }
    texture.needsUpdate = true;
  };

  return { texture, draw, dispose: () => texture.dispose() };
}

/* ── Panel stream + chat untuk monitor sisi ────────────── */
const CHAT: ReadonlyArray<readonly [string, string, string]> = [
  ["moon", "#f9a8d4", "gg build 🔥"],
  ["kaizer", "#93c5fd", "ship it 🚀"],
  ["nep", "#fcd34d", "LGTM ✅"],
  ["madzz", "#c4b5fd", "prompt on point"],
  ["qih", "#86efac", "structure solid"],
  ["mad", "#fda4af", "css buttery gila"],
  ["gito", "#7dd3fc", "merged to main"],
  ["anis", "#fdba74", "hotspot works!"],
  ["amad", "#4ade80", "WE BUILD BOLD"],
  ["loli", "#f9a8d4", "hero cantik 😭"],
  ["kid", "#93c5fd", "3d room sheesh"],
  ["nami", "#fcd34d", "push dah lepas"],
];

export function createStreamScreen(): LiveScreen {
  const canvas = document.createElement("canvas");
  canvas.width = 288;
  canvas.height = 352;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const draw = (t: number) => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#0b0e14";
    ctx.fillRect(0, 0, w, h);

    // Header: LIVE + penonton
    ctx.fillStyle = "#12161f";
    ctx.fillRect(0, 0, w, 34);
    const liveOn = Math.floor(t * 1.6) % 2 === 0;
    ctx.fillStyle = liveOn ? "#ef4444" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(18, 17, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f3f4f6";
    ctx.font = "bold 13px monospace";
    ctx.fillText("LIVE", 32, 22);
    const viewers = 1240 + Math.floor(Math.sin(t * 0.7) * 40 + Math.sin(t * 2.3) * 12);
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(`👁 ${viewers}`, w - 78, 22);

    // "Webcam" — muka blocky hijau
    ctx.fillStyle = "#101623";
    ctx.fillRect(10, 44, w - 20, 108);
    const cx = w / 2;
    const bob = Math.sin(t * 1.8) * 2.5;
    ctx.fillStyle = "#5c8a3c";
    ctx.fillRect(cx - 34, 62 + bob, 68, 68);
    ctx.fillStyle = "#3d5e28";
    ctx.fillRect(cx - 34, 62 + bob, 68, 14);          // rambut
    ctx.fillStyle = "#1c2312";
    ctx.fillRect(cx - 22, 90 + bob, 12, 12);           // mata kiri
    ctx.fillRect(cx + 10, 90 + bob, 12, 12);           // mata kanan
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(cx - 10, 112 + bob, 20, 6);           // mulut
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 44, w - 20, 108);

    // Chat scroll
    ctx.font = "12px monospace";
    const shown = 8;
    const head = Math.floor(t / 1.6);
    for (let i = 0; i < shown; i++) {
      const idx = (head + i) % CHAT.length;
      const [name, color, msg] = CHAT[idx];
      const y = 174 + i * 22;
      ctx.globalAlpha = i === 0 ? 0.45 : 1;
      ctx.fillStyle = color;
      ctx.fillText(`${name}:`, 14, y);
      ctx.fillStyle = "#d1d5db";
      ctx.fillText(msg, 14 + ctx.measureText(`${name}: `).width, y);
      ctx.globalAlpha = 1;
    }
    texture.needsUpdate = true;
  };

  return { texture, draw, dispose: () => texture.dispose() };
}

/* ── Hue berkitar untuk elemen RGB ─────────────────────── */
export function applyHue(
  mat: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | null,
  t: number,
  offset: number,
  reduced: boolean
): void {
  if (!mat) return;
  const hue = reduced ? 0.66 : (t * 0.07 + offset) % 1;
  mat.color.setHSL(hue, 0.95, 0.55);
  if ("emissive" in mat) {
    (mat as THREE.MeshStandardMaterial).emissive.setHSL(hue, 0.95, 0.45);
  }
}
