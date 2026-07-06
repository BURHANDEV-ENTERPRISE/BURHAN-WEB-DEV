# MOP Session Brief

Updated: 2026-07-06T20:02:38.564Z
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
- 2026-07-06T19:38:23.662Z - qih (architect): keyboard video swap: guardian merge after sync
- 2026-07-06T19:39:18.673Z - qih (architect): keyboard video swap: guardian merge retry
- 2026-07-06T19:40:47.301Z - qih (architect): section 2 video swapped console->keyboard (Keyboard_and_monitor_dissolve delogo+g6 7.7MB, watermark verified clean incl cable edge), console.mp4 removed from public, merged main df03a9c, Pages deploy success
- 2026-07-06T19:46:04.694Z - qih (architect): transition fix: dip-to-black crossover between video sections — hero fades out last 8-10%, section 2 fades in from dark and out at end, no more hard seam at sticky handoff
- 2026-07-06T19:46:47.736Z - qih (architect): dip-to-black transition: guardian merge after sync
- 2026-07-06T19:47:59.800Z - qih (architect): fixed hard seam between video sections with dip-to-black: hero video fades out p 0.9-0.98, section2 fades in 0-0.08 and out 0.92-1, both sections share bg #0e0806 so sticky handoff is dark-on-dark invisible (main 937d54a, deployed)
- 2026-07-06T20:01:34.028Z - qih (architect): hero text swap + section restructure: OpenSection removed (text ENTER THE WORLD OF BURHANDEV + subtitle moved into hero, old hero headline removed), console.mp4 scrub section replaces OpenSection slot, header chip+hamburger hidden while hero in view (fade in after)
- 2026-07-06T20:02:09.416Z - qih (architect): hero text swap + console section + header hide: push retry
- 2026-07-06T20:02:38.555Z - qih (architect): hero text swap: guardian merge after sync
