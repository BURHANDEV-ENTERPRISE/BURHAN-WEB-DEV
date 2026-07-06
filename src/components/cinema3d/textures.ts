// Texture dijana lokal untuk hero cinematic — tiada asset luar.
// Ilustrasi anime (leaves + face reveal) untuk monitor ultrawide,
// desk mat HUD taktikal, dan keycap keyboard.

import * as THREE from "three";

export interface AnimatedTexture {
  texture: THREE.CanvasTexture;
  /** t = masa (saat), reveal = 0..1 (daun terbuka, muka muncul) */
  draw: (t: number, reveal: number) => void;
  dispose: () => void;
}

const CREAM = "#f0ead6";
const MAROON = "#6e1f1f";
const OLIVE = "#c8d96f";

/* Daun bentuk hati — blok binaan ilustrasi & pokok */
function leaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rot: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.bezierCurveTo(-size * 1.1, size * 0.1, -size * 0.6, -size * 0.8, 0, -size * 0.25);
  ctx.bezierCurveTo(size * 0.6, -size * 0.8, size * 1.1, size * 0.1, 0, size);
  ctx.fill();
  ctx.restore();
}

export function createIllustrationScreen(): AnimatedTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 440;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const draw = (t: number, reveal: number) => {
    const w = canvas.width;
    const h = canvas.height;

    // Langit senja maroon-ungu
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#160a14");
    sky.addColorStop(0.55, "#3a1626");
    sky.addColorStop(1, "#6e1f1f");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Bulan + glow
    ctx.save();
    ctx.shadowColor = CREAM;
    ctx.shadowBlur = 60;
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(775, 140, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(110,31,31,0.18)";
    ctx.beginPath();
    ctx.arc(748, 122, 18, 0, Math.PI * 2);
    ctx.arc(800, 158, 12, 0, Math.PI * 2);
    ctx.fill();

    // Bukit siluet
    ctx.fillStyle = "#1c0d12";
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h - 90);
    ctx.quadraticCurveTo(240, h - 170, 520, h - 96);
    ctx.quadraticCurveTo(780, h - 40, w, h - 120);
    ctx.lineTo(w, h);
    ctx.fill();

    // Muka profil anime (cream) — muncul ikut reveal
    if (reveal > 0.02) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, reveal * 1.25);
      ctx.translate(392, 96);
      // Rambut belakang
      ctx.fillStyle = "#2a1017";
      ctx.beginPath();
      ctx.moveTo(58, -18);
      ctx.bezierCurveTo(190, -44, 236, 150, 176, 292);
      ctx.bezierCurveTo(150, 336, 66, 330, 48, 296);
      ctx.bezierCurveTo(96, 210, 92, 96, 58, -18);
      ctx.fill();
      // Profil muka
      ctx.fillStyle = CREAM;
      ctx.beginPath();
      ctx.moveTo(60, -10);
      ctx.bezierCurveTo(10, 18, -2, 74, 12, 110);   // dahi
      ctx.bezierCurveTo(2, 132, -8, 146, 4, 152);    // hidung
      ctx.bezierCurveTo(-4, 166, 6, 172, 2, 182);    // bibir
      ctx.bezierCurveTo(-2, 198, 18, 210, 36, 208);  // dagu
      ctx.bezierCurveTo(52, 246, 60, 268, 58, 296);  // leher
      ctx.lineTo(150, 296);
      ctx.bezierCurveTo(150, 170, 140, 40, 60, -10);
      ctx.fill();
      // Mata tertutup + kening
      ctx.strokeStyle = "#2a1017";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(30, 118);
      ctx.quadraticCurveTo(52, 132, 74, 124);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(28, 96);
      ctx.quadraticCurveTo(56, 88, 80, 96);
      ctx.stroke();
      // Blush
      ctx.fillStyle = "rgba(110,31,31,0.4)";
      ctx.beginPath();
      ctx.ellipse(58, 158, 16, 8, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Daun foreground — terbuka ke tepi ikut reveal, sway ikut masa
    const part = reveal * 200;
    const clusters: Array<[number, number, number, number]> = [
      [56 - part, 60, 1.25, 0.4],
      [16 - part, 240, 1.05, -0.5],
      [120 - part, 400, 1.35, 0.15],
      [968 + part, 90, 1.2, -0.35],
      [1008 + part, 300, 1.3, 0.5],
      [905 + part, 425, 1.1, -0.15],
    ];
    clusters.forEach(([cx, cy, cs, cr], ci) => {
      const sway = Math.sin(t * 0.85 + ci * 1.7) * 7;
      for (let i = 0; i < 6; i++) {
        const a = cr + i * 1.05 + Math.sin(t * 0.5 + i) * 0.05;
        leaf(
          ctx,
          cx + Math.cos(a) * 52 * cs + sway,
          cy + Math.sin(a) * 46 * cs,
          (26 + (i % 3) * 9) * cs,
          a + 1.6,
          i % 2 === 0 ? "#5d6b2f" : OLIVE
        );
      }
    });

    // Scanline + footer console
    ctx.fillStyle = "rgba(10,4,8,0.16)";
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = "rgba(20,8,10,0.72)";
    ctx.fillRect(0, h - 34, w, 34);
    ctx.fillStyle = OLIVE;
    ctx.font = "16px 'JetBrains Mono', monospace";
    const cursor = Math.floor(t * 2) % 2 === 0 ? "▮" : " ";
    ctx.fillText(`> burhan_console --scene dusk.reveal ${cursor}`, 22, h - 11);
    ctx.fillStyle = CREAM;
    ctx.textAlign = "right";
    ctx.fillText("REC ● 07:32 PM", w - 22, h - 11);
    ctx.textAlign = "left";

    texture.needsUpdate = true;
  };

  return { texture, draw, dispose: () => texture.dispose() };
}

/* Desk mat HUD taktikal — statik, lukis sekali */
export function createDeskMatTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 288;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#140b09";
  ctx.fillRect(0, 0, c.width, c.height);
  // Grid halus
  ctx.strokeStyle = "rgba(240,234,214,0.07)";
  ctx.lineWidth = 1;
  for (let x = 0; x < c.width; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
  }
  for (let y = 0; y < c.height; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
  }
  // Crosshair kanan
  ctx.strokeStyle = "rgba(200,217,111,0.5)";
  ctx.lineWidth = 2;
  [58, 84, 104].forEach((r) => {
    ctx.beginPath();
    ctx.arc(492, 144, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(492 - 118, 144); ctx.lineTo(492 + 118, 144);
  ctx.moveTo(492, 144 - 118); ctx.lineTo(492, 144 + 118);
  ctx.stroke();
  // Ticks sudut
  ctx.strokeStyle = "rgba(110,31,31,0.9)";
  ctx.lineWidth = 3;
  [[8, 8], [c.width - 8, 8], [8, c.height - 8], [c.width - 8, c.height - 8]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + (y < 100 ? 18 : -18)); ctx.lineTo(x, y);
    ctx.lineTo(x + (x < 100 ? 18 : -18), y);
    ctx.stroke();
  });
  // Teks HUD
  ctx.fillStyle = "#f0ead6";
  ctx.font = "bold 26px 'JetBrains Mono', monospace";
  ctx.fillText("BURHAN CONSOLE", 30, 66);
  ctx.fillStyle = "#c8d96f";
  ctx.font = "15px 'JetBrains Mono', monospace";
  ctx.fillText("V3.0.0 BETA — ADMINISTRATOR", 30, 96);
  ctx.fillStyle = "rgba(240,234,214,0.55)";
  ctx.fillText("LAT 3.1390 / LNG 101.6869", 30, 236);
  ctx.fillText("SIGNAL ▂▄▆█  SYS OK", 30, 260);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* Keycap keyboard — statik dengan aksen olive/maroon */
export function createKeysTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#181410";
  ctx.fillRect(0, 0, c.width, c.height);
  for (let row = 0; row < 4; row++) {
    const keys = row === 3 ? 7 : 13;
    const kw = row === 3 ? 30 : 17;
    for (let col = 0; col < keys; col++) {
      const x = 6 + col * (kw + 2);
      const y = 8 + row * 22;
      const wide = row === 3 && col === 3;
      ctx.fillStyle = (row + col) % 7 === 0 ? MAROON : "#2a241d";
      ctx.fillRect(x, y, wide ? 70 : kw, 17);
      ctx.fillStyle = "rgba(200,217,111,0.4)";
      ctx.fillRect(x, y + 14, wide ? 70 : kw, 3);
      if (wide) col += 2;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
