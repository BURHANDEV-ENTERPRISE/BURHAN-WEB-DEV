# MOP Session Brief

Updated: 2026-07-06T19:37:55.196Z
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

- 2026-07-06T15:35:44.794Z - qih (architect): hero final: fullscreen Flow video background replaces 3D room entirely (commit 245bf73, merged main 3efcd28) — video hero + dark shade overlay, scroll zoom + headline fade kept, pause offscreen/reduced-motion; deleted room3d/+Mic3D, pruned three/@react-three/*/skinview3d (deps now just next/react); BlockyChar easter egg kept
- 2026-07-06T15:42:29.007Z - qih (architect): hero: video scroll-scrub — 260vh sticky section, video.currentTime lerped to scroll progress (scrub forward/backward), headline fades last 25%, subtle zoom, rAF gated by in-view/tab-visible, reduced-motion gets plain 100vh hero
- 2026-07-06T15:42:51.267Z - qih (architect): video scrub hero: guardian merge after branch sync
- 2026-07-06T15:43:03.086Z - qih (architect): hero video scroll-scrub (commit ed7e779): 260vh sticky section, video.currentTime lerp-scrubbed by scroll progress both directions, headline fade last 25% + subtle zoom, rAF loop gated by IO/tab-visible, reduced-motion = plain 100vh paused-frame hero
- 2026-07-06T15:46:44.791Z - qih (architect): hero: remove header logo images (text-only brand lockup, hamburger-only capsule), extend scroll-scrub journey 260vh -> 420vh
- 2026-07-06T15:47:07.055Z - qih (architect): logo removal + longer scrub: guardian merge after sync
- 2026-07-06T16:47:23.262Z - qih (architect): removed Gemini/Veo sparkle watermark from flow.mp4 via ffmpeg delogo at (1688,844,108x110) after pinpointing with magnified grid frames; re-encoded crf21 keyframe-every-12 (smoother scrub), 11.7MB->11MB, verified clean at t=1s/6s (commit 2d2b0f9)
- 2026-07-06T16:49:11.447Z - qih (architect): watermark-free video: guardian merge retry
- 2026-07-06T16:54:14.595Z - qih (architect): hero: extend scroll-scrub journey 420vh -> 600vh for slower cinematic video control
- 2026-07-06T16:55:00.441Z - qih (architect): 600vh scrub: guardian merge after sync
- 2026-07-06T16:55:34.391Z - qih (architect): 600vh scrub: guardian merge after sync
- 2026-07-06T19:03:21.236Z - qih (architect): hero: remove MULA PROJEK + CLICK TO PLAY buttons — headline only over scrub video
- 2026-07-06T19:03:56.561Z - qih (architect): remove hero CTA buttons: guardian merge after sync
- 2026-07-06T19:04:27.638Z - qih (architect): removed MULA PROJEK + CLICK TO PLAY buttons from hero — headline only over scrub video; BlockyChar easter egg now unreachable (code kept)
- 2026-07-06T19:06:07.966Z - qih (architect): sync MOP memory stamps after CTA removal
- 2026-07-06T19:30:42.062Z - qih (architect): scrub v2: shared useVideoScrub hook (seek-aware, smoothed progress, IO gate, lazy preload), hero rewired to hook, new ScrubVideoSection with console.mp4 (delogo+g6) after hero, flow.mp4 re-encoded from original delogo+g6 for silkier scrub
- 2026-07-06T19:31:29.007Z - qih (architect): scrub v2: guardian merge after sync
- 2026-07-06T19:32:27.254Z - qih (architect): scrub v2: guardian merge after network recovery
- 2026-07-06T19:32:57.295Z - qih (architect): scrub v2 shipped (main 029d807): shared useVideoScrub hook — seek-aware (waits seeked event), double-smoothed progress lerp 0.14, IO+visibility gate, lazy preload metadata->auto; hero rewired to hook; new ScrubVideoSection generic component; console.mp4 (7.4MB delogo+g6) added as scrub section after hero; flow.mp4 re-encoded from original delogo+g6 10.1MB; both watermark-free verified
- 2026-07-06T19:37:55.178Z - qih (architect): section 2: swap console.mp4 -> keyboard.mp4 (Keyboard_and_monitor_dissolve, delogo+g6, 7.7MB), remove unused console.mp4
