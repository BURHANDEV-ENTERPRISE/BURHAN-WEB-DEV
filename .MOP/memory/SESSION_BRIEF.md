# MOP Session Brief

Updated: 2026-07-06T20:22:39.859Z
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
- 2026-07-06T20:03:18.207Z - qih (architect): hero text swap: guardian merge retry
- 2026-07-06T20:04:04.712Z - qih (architect): hero text swap: guardian push retry
- 2026-07-06T20:05:23.511Z - qih (architect): restructure (main 61b6043, deployed): OpenSection deleted, its text (ENTER THE WORLD OF BURHANDEV + craft-experiences subtitle) moved into hero replacing old headline; console.mp4 scrub section now fills OpenSection slot after marquee (3 scrub videos total: flow hero, keyboard, console); header chip+hamburger auto-hidden while hero in view via IO + .is-hidden class
- 2026-07-06T20:20:20.524Z - qih (architect): layout: move MarqueeStrip from after keyboard video to below Services section (middle of page)
- 2026-07-06T20:20:40.037Z - qih (architect): marquee below services: guardian merge after sync
- 2026-07-06T20:21:12.416Z - qih (architect): marquee below services: guardian merge retry
- 2026-07-06T20:21:54.738Z - qih (architect): marquee below services: guardian merge retry 2
- 2026-07-06T20:22:39.844Z - qih (architect): marquee below services: guardian merge final retry
