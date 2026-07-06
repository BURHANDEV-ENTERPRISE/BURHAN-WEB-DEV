# BURHANDEV 3D Model Layout UX Spec

## Experience Goal

Tunjukkan kepada pelanggan B2B bahawa BURHANDEV mampu bina website berani dan
berkualiti tinggi — dengan menjadikan website BURHANDEV sendiri sebagai bukti
(portfolio hidup). 3D bukan hiasan hero sahaja: 3D menjadi tulang belakang
layout yang mengikat semua section melalui satu babak scroll yang berterusan.

## Current State (scan 2026-07-06)

- Stack: Next.js 15.3 + React 19 + TypeScript, R3F 9 + drei 10 + three 0.181,
  skinview3d, CSS Modules + `src/styles.css`, font Bebas Neue (next/font).
- Hero sedia ada: intro "CLICK TO PLAY" dengan monitor bezel CSS, mic condenser
  3D (R3F, scroll-driven) dan scene Minecraft BlockyChar (wave/run/collision).
- Section sedia ada: Marquee, Open, Manifesto, Stats, Services (4 row),
  TechStack, Process, Pricing, Work, Contact, WorkSection, Testimonials, Footer.
- Isu diketahui (review moon 2026-06-26 + scan hari ini):
  - Footer dead links (`/#about`, `/#story`, `/contact` tak wujud).
  - Font Press Start 2P dimuat melalui `<link>` dalam body (patut guna next/font).
  - Service rows guna visual identik (mini-browser kosong) — tiada perbezaan.
  - Tiada portfolio sebenar dan tiada contact form.
  - Fail sampah di root: `All`, `a.dist`, `item.id`, `window.innerWidth`,
    `dev.err` (artifact redirect shell — perlu dibuang).

## Key Flows

- Visitor B2B masuk → hero 3D beri "wow" dalam 3 saat → nampak CTA jelas
  ("Mula Projek") tanpa perlu klik "PLAY".
- Scroll → kamera 3D bergerak antara "workstation props" (mic → monitor →
  dashboard) selari dengan section HTML → setiap servis ada visual 3D tersendiri.
- Habis cerita → contact section dengan borang ringkas (nama, syarikat, scope,
  budget) + mailto fallback.
- "CLICK TO PLAY" kekal sebagai easter egg (scene BlockyChar) — bukan laluan
  utama conversion.

## Architecture: Satu Canvas Kongsi (recommended)

- Satu `<Canvas>` R3F sahaja, `position: fixed`, penuh viewport, z-index bawah
  content HTML. Elak banyak WebGL context (prestasi + memori).
- Komponen `Scene3D` (dynamic import, `ssr: false`) memegang camera rig yang
  dipandu scroll progress global (pattern sama seperti `scrollRef` sedia ada
  dalam HeroSection/Mic3D).
- Setiap section HTML ada "anchor" scroll; kamera lerp ke shot ketiga-tiga
  props: mic (hero), monitor 3D (services), panel dashboard (product UI),
  gear/wrench (fix & care).
- Fallback: viewport kecil (<768px) atau `prefers-reduced-motion` → poster
  statik / 3D dimatikan, layout HTML kekal berfungsi sepenuhnya.

## Screens / States

- Default: hero 3D + ghost text "WE BUILD BOLD" + CTA "Mula Projek" & "Lihat
  Servis"; scroll memandu kamera antara section.
- Loading: skeleton cream (#fff6dc) + logo; canvas fade-in bila model sedia
  (guna Suspense, kekalkan boot-guard sedia ada tapi turunkan 3000ms → berdasar
  event load sebenar).
- Empty: portfolio guna 3 kad "coming soon" bergaya 3D jika projek belum ada.
- Error: jika WebGL gagal → terus render fallback poster; site tetap lengkap.
- Success: borang contact hantar → mesej pengesahan + salinan mailto.

## Visual Direction

- Kekalkan sistem brand: cream #fff6dc, aksen maroon/merah, section gelap
  berselang, Bebas Neue untuk display, ghost text bersaiz besar.
- Gaya 3D: low-poly / voxel-friendly — sepadan dengan maskot BlockyChar
  (Minecraft DNA) + bahan physical (chrome mic) untuk rasa premium.
- Setiap servis dapat prop 3D unik: Landing Page = kad browser terapung,
  Business Website = storefront blok, Product UI = panel dashboard, Fix & Care
  = gear + wrench.

## Interaction / Motion

- Scroll = enjin utama: kamera dolly/orbit antara shot, props berputar perlahan
  (lerp 0.07 seperti Mic3D sekarang — kekalkan rasa "buttery").
- Hover service row → prop 3D berkaitan menyala/berpusing sedikit.
- Ambient sway kekal pada semua props (hidup walau tanpa scroll).
- Had motion: satu animasi fokus pada satu masa; tiada autoplay audio.

## Accessibility

- Keyboard: semua CTA/service rows boleh fokus (tabIndex sedia ada dikekalkan);
  canvas `aria-hidden` — kandungan sebenar sentiasa dalam HTML.
- Screen reader: heading hierarchy kekal (h1 hero → h2 section); 3D dianggap
  presentational sahaja.
- Contrast: teks atas cream mesti ≥ 4.5:1 (semak aksen merah atas cream).
- Reduced motion: `prefers-reduced-motion` → matikan camera rig + sway,
  papar poster statik.

## Hero: Bilik Gamer/Coder 3D (diluluskan 2026-07-06)

- Konsep: hero dipacu satu scene 3D — bilik streamer/coder waktu malam.
  Meja + dual monitor (skrin hidup), PC tower RGB, keyboard RGB, mic condenser,
  kerusi gaming, shelf props, neon sign "BURHANDEV" di dinding.
- Sumber model: **Hybrid** — struktur bilik & semua elemen reaktif dibina
  custom R3F (primitives, gaya low-poly); slot glTF di `public/models/` untuk
  1-2 props detail (opsyenal, tambah kemudian).
- Interaksi wajib (semua dipilih):
  1. **Cursor parallax** — kamera miring halus ikut mouse (lerp).
  2. **Skrin monitor hidup** — kod menaip sendiri + panel chat stream scroll
     (canvas texture, tiada video/asset luar).
  3. **RGB neon breathing** — emissive PC/keyboard/neon sign berkitar warna.
  4. **Hotspot klik** — monitor → #services, mic → #contact (cursor pointer +
     glow bila hover).
- Maskot: **BlockyChar versi voxel 3D** duduk di kerusi mengadap monitor,
  animasi menaip; kekalkan warna hijau brand maskot sedia ada.
- Fallback: `prefers-reduced-motion` matikan parallax + RGB cycle; skrin kecil
  guna kamera statik; tiada WebGL → hero HTML sedia ada kekal berfungsi.

## Fasa Pelaksanaan

1. **Foundation** — buang fail sampah root, baiki footer links, betulkan
   font loading (next/font), sediakan `Scene3D` + scroll rig.
2. **Hero rebuild** — gabung mic + monitor + maskot dalam satu komposisi 3D,
   tambah CTA bisnes ("Mula Projek"), kekalkan PLAY sebagai easter egg.
3. **Section props** — prop 3D unik untuk 4 servis + kamera shots; ganti
   mini-browser identik.
4. **Polish & convert** — contact form, portfolio placeholder, mobile/reduced
   motion fallback, bajet prestasi (target LCP < 2.5s, model < 1MB).

## Data Contract (komponen hero bilik gamer)

- Tiada API/endpoint/storage luar — semua kandungan skrin dijana secara lokal
  (canvas texture: baris kod menaip + mesej chat dari senarai statik).
- Interface komponen: `GamerRoom3D({ reducedMotion: boolean, onHotspot:
  (target: "services" | "contact") => void })`; scroll progress dikongsi
  melalui ref pattern sedia ada (`scrollRef: MutableRefObject<number>`).
- Slot glTF: fail diletak di `public/models/*.glb`, dimuat dengan
  `useGLTF` hanya jika wujud — ketiadaan fail tidak boleh memecahkan scene.

## Test Plan

- `npm run build` mesti lulus (type check + production build) sebelum commit.
- Manual verification selepas build: parallax ikut mouse, skrin monitor
  beranimasi, RGB berkitar, klik monitor scroll ke #services, klik mic ke
  #contact, `prefers-reduced-motion` mematikan parallax + RGB cycle.
- Regression: stage "CLICK TO PLAY" → scene BlockyChar masih berfungsi.

## Rollback

- Semua kerja di branch `dev/amad`; `main` hanya berubah selepas review
  BURHAN-MOP. Undo = `git revert <commit>` pada dev branch.
- Komponen lama (monitor bezel CSS, Mic3D standalone) disimpan dalam repo
  sehingga hero baru diluluskan — restore = tukar balik import dalam
  HeroSection.

## Acceptance Checks

- Satu WebGL context sahaja; tiada canvas kedua selepas hero.
- Lighthouse Performance ≥ 85 (desktop), site berfungsi penuh tanpa WebGL.
- CTA bisnes kelihatan atas fold pada 1366×768 dan 390×844.
- Semua link footer sah; tiada fail sampah di root.
