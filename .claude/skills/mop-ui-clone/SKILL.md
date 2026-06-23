---
name: mop-ui-clone
version: 1.0.0
description: >
  AI-powered UI/UX cloner. Scrape mana-mana website — layout, typography,
  warna, CSS animations, 3D WebGL/Three.js, GSAP/Lottie, dan custom assets —
  kemudian bina semula standalone HTML/CSS/JS replica. Untuk 3D kompleks dan
  asset proprietari, gunakan AI visual analysis untuk recreate dari scratch.
sources:
  - mop:mop-browseract (browser engine)
  - mop:frontend (reconstruction)
  - mop:ux (design analysis)
triggers:
  keywords:
    - clone this website, copy ui from, replicate design
    - scrape ui, copy this site's design, extract assets
    - clone ui/ux, rebuild this website, 3d clone, copy animation
providers: [claude, codex, gemini, antigravity]
mop_phases: [idea, ux-spec, implementation]
---

# mop-ui-clone — AI UI/UX Cloner

## 5 Lapisan Clone

```
Lapisan 1: Struktur & Layout    → HTML semantic + CSS Grid/Flexbox
Lapisan 2: Design Visual        → Typography, warna, spacing, shadows
Lapisan 3: Assets               → Gambar, ikon, font, SVG, video
Lapisan 4: Animasi & Interaksi  → CSS transitions, keyframes, JS interactions
Lapisan 5: 3D & WebGL           → Three.js, GSAP, Lottie, shader effects
```

## Etika — WAJIB tanya sebelum clone

```
Sebelum saya clone UI ini, beritahu tujuannya:
[ ] Belajar / analisis reka bentuk
[ ] Inspirasi untuk design sendiri
[ ] Portfolio / demo
[ ] Lain-lain: ___

Saya tidak akan guna untuk phishing, penipuan, atau tujuan
yang melanggar hak cipta / mengelirukan pengguna.
```

## Workflow Penuh

### Fasa 1 — Reconnaissance
```bash
# Buka dengan stealth (elak bot detection)
npx browser-act open <url> --stealth
npx browser-act screenshot --full-page --output clone-reference.png

# Extract HTML + CSS
npx browser-act stealth-extract <url> --format html > raw-page.html

# Capture network resources
npx browser-act open <url> --capture-network --output network-log.json
```

### Fasa 2 — Asset Inventory
```js
// asset-inventory.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('raw-page.html', 'utf8');
const network = JSON.parse(readFileSync('network-log.json', 'utf8'));

const assets = {
  fonts: [], images: [], svgs: [], videos: [],
  lottieFiles: [], threejsDetected: false,
  gsapDetected: false, canvasElements: 0
};

// Detect 3D / animation libraries
assets.threejsDetected = /three\.js|THREE\.|three\.min\.js/i.test(html);
assets.gsapDetected    = /gsap|TweenMax|ScrollTrigger/i.test(html);
assets.canvasElements  = (html.match(/<canvas/g) || []).length;

// Extract dari network log
for (const req of network.requests || []) {
  if (/\.(woff2?|ttf|otf)/.test(req.url))        assets.fonts.push(req.url);
  if (/\.(png|jpg|jpeg|webp|avif|gif)/.test(req.url)) assets.images.push(req.url);
  if (/\.svg/.test(req.url))                      assets.svgs.push(req.url);
  if (/\.(mp4|webm)/.test(req.url))               assets.videos.push(req.url);
  if (/\.json/.test(req.url) && req.type==='fetch') assets.lottieFiles.push(req.url);
}

writeFileSync('asset-inventory.json', JSON.stringify(assets, null, 2));
console.log(assets);
```

### Fasa 3 — Design Token Extraction
```js
// extract-tokens.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('raw-page.html', 'utf8');

const tokens = {
  colors:       [...new Set([...html.matchAll(/#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|hsl\([^)]+\)/g)].map(m=>m[0]))].slice(0,30),
  fontFamilies: [...new Set([...html.matchAll(/font-family:\s*([^;\"]+)/g)].map(m=>m[1].trim()))],
  fontSizes:    [...new Set([...html.matchAll(/font-size:\s*([^;\"]+)/g)].map(m=>m[1].trim()))],
  spacing:      [...new Set([...html.matchAll(/(?:padding|margin|gap):\s*([^;\"]+)/g)].map(m=>m[1].trim()))].slice(0,20),
  borderRadius: [...new Set([...html.matchAll(/border-radius:\s*([^;\"]+)/g)].map(m=>m[1].trim()))],
  shadows:      [...new Set([...html.matchAll(/box-shadow:\s*([^;\"]+)/g)].map(m=>m[1].trim()))],
};

writeFileSync('design-tokens.json', JSON.stringify(tokens, null, 2));
```

### Fasa 4 — Animation Capture
```js
// extract-animations.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('raw-page.html', 'utf8');

const animations = {
  keyframes:    [...html.matchAll(/@keyframes[\s\S]*?\}\s*\}/g)].map(m=>m[0]),
  transitions:  [...new Set([...html.matchAll(/transition:\s*([^;\"]+)/g)].map(m=>m[1].trim()))],
  scrollEffects: [],
};

if (/IntersectionObserver|data-aos|ScrollReveal/.test(html)) animations.scrollEffects.push('intersection-observer');
if (/ScrollTrigger|scrollmagic/.test(html)) animations.scrollEffects.push('gsap-scrolltrigger');

writeFileSync('animations.json', JSON.stringify(animations, null, 2));
```

### Fasa 5 — 3D Scene Analysis (bila Three.js dikesan)
```bash
# Screenshot 8 angle
for angle in 0 45 90 135 180 225 270 315; do
  npx browser-act screenshot --output "3d-angle-$angle.png"
  npx browser-act eval "window.__mop_rotate = $angle" 2>/dev/null
done

# Screenshot semasa scroll
for pct in 0 25 50 75 100; do
  npx browser-act scroll --percent $pct
  npx browser-act screenshot --output "3d-scroll-$pct.png"
done
```

```js
// analyze-3d.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('raw-page.html', 'utf8');

const scene = {
  geometries:    ['BoxGeometry','SphereGeometry','PlaneGeometry','CylinderGeometry','TorusGeometry'].filter(g => html.includes(g)).map(g=>g.replace('Geometry','')),
  materials:     html.includes('ShaderMaterial') ? ['custom-shader'] : html.includes('MeshStandardMaterial') ? ['standard-pbr'] : ['basic'],
  lights:        ['AmbientLight','DirectionalLight','PointLight'].filter(l=>html.includes(l)).map(l=>l.replace('Light','')),
  controls:      html.includes('OrbitControls') ? 'orbit' : html.includes('ScrollControls') ? 'scroll' : 'none',
  postProcessing: /EffectComposer|postprocessing/.test(html),
  customShaders:  /ShaderMaterial|glsl|\.vert|\.frag/.test(html),
};

writeFileSync('3d-analysis.json', JSON.stringify(scene, null, 2));
console.log('3D Scene:', scene);
```

## Strategi Rekonstruksi

| Asset | Strategi | Output |
|---|---|---|
| Layout & CSS | Extract + copy terus | `layout.css` |
| Font (Google) | Link terus ke Google Fonts | `<link>` dalam HTML |
| Font (custom WOFF2) | Download + base64 embed | `css/fonts.css` |
| Image / SVG | Download ke `assets/` | `assets/images/` |
| Image (protected) | Screenshot → AI describe → placeholder gradient | `ai-recreated/` |
| CSS `@keyframes` | Copy terus | `animations.css` |
| GSAP / ScrollTrigger | Translate ke CSS + IntersectionObserver | `interactions.js` |
| Lottie `.json` | Download + `lottie-web` library | `assets/lottie/` |
| Three.js (simple) | AI infer scene → Three.js code | `scene.js` |
| Three.js (complex) | 8-angle screenshot → AI analysis → recreate | `scene.js` + `shaders/` |
| WebGL custom shader | Screenshot ref → AI tulis GLSL approximate | `ai-recreated/shaders/` |

## Output Structure

```
clone-output/
├── index.html              ← standalone, buka terus
├── css/
│   ├── design-tokens.css   ← CSS variables
│   ├── layout.css
│   ├── components.css
│   └── animations.css
├── js/
│   ├── interactions.js
│   ├── animations.js
│   └── scene.js            ← Three.js (kalau ada)
├── assets/
│   ├── fonts/
│   ├── images/
│   ├── svgs/
│   ├── lottie/
│   └── videos/
├── ai-recreated/
│   ├── shaders/            ← GLSL AI-written
│   └── *.svg               ← AI-recreated assets
└── clone-report.md
```

## clone-report.md

```markdown
# UI Clone Report — [URL]
## Fidelity Score: [X]/100

### ✅ Exact copy
- Layout, typography, colors ([N] warna)
- CSS animations ([N] keyframes)
- Images ([N]/[T] downloaded), Fonts ([N]/[T] embedded)

### ⚠ Approximate (AI recreation)
- 3D scene: [perbezaan yang ada]
- Custom shader: [effect yang hampir sama]

### ❌ Tidak dapat disalin
- [Senarai]

### Stack digunakan dalam clone
- [Three.js / Lottie / CSS-only / dll]
```

## MOP Ledger
```bash
node .MOP/scripts/mop-core.mjs memory add \
  --actor "$MOP_ACTOR" --kind ui-clone \
  --summary "Clone: $URL | fidelity: $SCORE/100 | 3D: $HAS_3D | assets: $COUNT"
```
```
