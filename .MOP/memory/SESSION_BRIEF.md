# MOP Session Brief

Updated: 2026-07-06T21:05:15.380Z
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
- 2026-07-06T20:23:54.791Z - qih (architect): MarqueeStrip moved from after keyboard video to below Services section (main 8eefa25, deployed); page order now: hero, keyboard scrub, console scrub, manifesto, stats, services, MARQUEE, techstack, process...
- 2026-07-06T21:00:54.511Z - qih (architect): console scrub section journey extended 320vh -> 500vh
- 2026-07-06T21:01:15.924Z - qih (architect): console 500vh: guardian merge after sync
- 2026-07-06T21:02:13.050Z - qih (architect): console 500vh: guardian push retry
- 2026-07-06T21:03:33.033Z - qih (architect): console 500vh: guardian push retry 2
- 2026-07-06T21:04:23.290Z - qih (architect): console 500vh: guardian push final
- 2026-07-06T21:05:15.370Z - qih (architect): console 500vh: guardian push loop
