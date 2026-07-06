# MOP Session Brief

Updated: 2026-07-06T15:46:44.801Z
Actor: amad
Active agent: qih (architect)
Current month: 2026-07

## Required Session Flow

1. Read `.MOP/STATE.json` and follow `.MOP/PROTOCOL.md`.
2. Restore memory with `node .MOP/scripts/mop-core.mjs memory brief --actor <codename>`.
3. Run `agent route` for the user task before answering.
4. Start every authenticated answer with: `agent: qih (architect) to amad`
5. Save a one-line memory after meaningful work.

## Recent Memory

- 2026-07-06T14:11:32.993Z - qih (architect): perf: fix scroll jank — pause 3D room when hero offscreen/tab hidden, dpr cap 1.5, remove blend-mode on fixed scanline overlay, remove fixed-header backdrop blur, gate WorkSection scroll rAF, drop redundant fixed curtain
- 2026-07-06T14:32:34.279Z - qih (architect): hero v3: guardian merge retry after network hiccup
- 2026-07-06T14:33:25.130Z - qih (architect): hero v3: sync MOP memory stamps + guardian merge retry
- 2026-07-06T14:33:50.568Z - qih (architect): hero v3 cinematic (commits 290a7b0+15888eb, merged main c3af013): src/components/cinema3d/ — cozy gaming room, curved ultrawide monitor w/ animated anime illustration (leaves+face reveal via scroll), pothos instanced, 7 hex panels olive #c8d96f, vinyl toys, HUD desk mat, lamp arm; GSAP ScrollTrigger 380vh sticky 4-stage camera dolly; Bloom+Vignette+DoF desktop; Burhan Console HUD (maroon #6e1f1f/parchment #f0ead6/JetBrains Mono) w/ framer-motion; big headline removed per request; first load 203kB (gsap+framer in main bundle); room3d v2 kept for rollback
- 2026-07-06T14:39:07.435Z - qih (architect): revert: remove cinematic hero v3 per user request — restore v2 gamer room hero (headline+CTA), delete cinema3d components, prune gsap/framer-motion/postprocessing deps
- 2026-07-06T14:39:43.513Z - qih (architect): revert hero v3: guardian merge after branch sync
- 2026-07-06T14:40:06.558Z - qih (architect): reverted hero v3 cinematic per user request (commit 1f1417d, merged main f37fa0b): restored v2 gamer room hero (BURHANDEV headline + MULA PROJEK + CLICK TO PLAY), deleted src/components/cinema3d/, pruned gsap/framer-motion/@react-three/postprocessing, first load back to 117kB; v3 recoverable from git history at 290a7b0
- 2026-07-06T15:10:44.909Z - qih (architect): hero: play Flow video on main 3D monitor via VideoTexture — fallback to code screen until loaded, auto pause offscreen/reduced-motion, root source videos gitignored
- 2026-07-06T15:11:39.851Z - qih (architect): hero video: guardian merge after branch sync
- 2026-07-06T15:12:06.942Z - qih (architect): hero: Flow video (12MB, public/videos/flow.mp4) now plays on main 3D monitor via THREE.VideoTexture (commit f67fb38, merged main 90240a5) — muted loop autoplay, code-screen fallback until loadeddata, pauses when hero offscreen/tab hidden/reduced-motion, root source mp4s gitignored; named nepo (ux) + nepi (design)
- 2026-07-06T15:23:23.599Z - qih (architect): scroll effects sitewide: hero room zoom+rotate on scroll (100vh kept) + headline fade, marquee skew lean by scroll, footer reveal, remove dead data-scroll-stage listener
- 2026-07-06T15:23:46.246Z - qih (architect): scroll effects: guardian merge after branch sync
- 2026-07-06T15:24:18.040Z - qih (architect): sitewide scroll effects (commit f316701, merged main cdf568b): hero room zoom-in+rotate via scrollRef in ParallaxRig + headline fade/rise (hero kept 100vh), marquee rows skewX lean opposite directions by viewport distance, footer reveal class, removed dead data-scroll-stage listener from ScrollEffects; all rAF-gated + IO-gated + reduced-motion safe
- 2026-07-06T15:34:52.193Z - qih (architect): hero: replace 3D room with fullscreen Flow video background — video hero w/ shade overlay for headline contrast, scroll zoom + headline fade kept, pause offscreen/tab-hidden/reduced-motion; removed room3d+Mic3D components and pruned three/@react-three/skinview3d deps
- 2026-07-06T15:35:21.496Z - qih (architect): video hero: guardian merge after branch sync
- 2026-07-06T15:35:44.794Z - qih (architect): hero final: fullscreen Flow video background replaces 3D room entirely (commit 245bf73, merged main 3efcd28) — video hero + dark shade overlay, scroll zoom + headline fade kept, pause offscreen/reduced-motion; deleted room3d/+Mic3D, pruned three/@react-three/*/skinview3d (deps now just next/react); BlockyChar easter egg kept
- 2026-07-06T15:42:29.007Z - qih (architect): hero: video scroll-scrub — 260vh sticky section, video.currentTime lerped to scroll progress (scrub forward/backward), headline fades last 25%, subtle zoom, rAF gated by in-view/tab-visible, reduced-motion gets plain 100vh hero
- 2026-07-06T15:42:51.267Z - qih (architect): video scrub hero: guardian merge after branch sync
- 2026-07-06T15:43:03.086Z - qih (architect): hero video scroll-scrub (commit ed7e779): 260vh sticky section, video.currentTime lerp-scrubbed by scroll progress both directions, headline fade last 25% + subtle zoom, rAF loop gated by IO/tab-visible, reduced-motion = plain 100vh paused-frame hero
- 2026-07-06T15:46:44.791Z - qih (architect): hero: remove header logo images (text-only brand lockup, hamburger-only capsule), extend scroll-scrub journey 260vh -> 420vh
