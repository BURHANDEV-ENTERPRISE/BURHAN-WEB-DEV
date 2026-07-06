# MOP Session Brief

Updated: 2026-07-06T16:46:26.910Z
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
- 2026-07-06T15:47:07.055Z - qih (architect): logo removal + longer scrub: guardian merge after sync
- 2026-07-06T15:47:17.879Z - qih (architect): removed header logo images (brand-lockup text-only, menu capsule hamburger-only, next/image import pruned) + hero scrub journey lengthened 260vh->420vh (commit 895e1cd)
- 2026-07-06T15:53:35.755Z - qih (architect): Pages deploy failure for edbb0fc was transient GitHub-side (artifact 21MB fine, config healthy); gh run rerun 28804263803 --failed -> build+deploy success, dev.burhan.my live with latest hero
- 2026-07-06T16:46:26.900Z - qih (architect): video: remove Gemini watermark via ffmpeg delogo (x1688 y844 108x110), re-encode crf21 g12 for smoother scroll-scrub, faststart
