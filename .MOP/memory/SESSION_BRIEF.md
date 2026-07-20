# MOP Session Brief

Updated: 2026-07-20T11:24:10.224Z
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

- 2026-07-07T16:56:40.097Z - qih (architect): fable-5-mode -> Pro: add process layer (mandatory verification loop w/ 5-iteration cap, docs-on-demand no-API-from-memory, plan-step-verify scaffolding, critic pass) to SKILL.md + system-prompt.txt, portable copy synced, manifest refreshed
- 2026-07-07T16:57:29.281Z - qih (architect): fable-5-mode -> Pro: add process layer (mandatory verification loop w/ 5-iteration cap, docs-on-demand no-API-from-memory, plan-step-verify scaffolding, critic pass) to SKILL.md + system-prompt.txt, portable copy synced, manifest refreshed
- 2026-07-07T16:57:53.377Z - qih (architect): fable-5-mode upgraded to Pro (main 5360465): added Layer 2 process protocol — A) mandatory verification loop (run real feedback tool, verbatim errors, 5-iteration cap, done-requires-named-check), B) docs-on-demand no-API-from-memory, C) plan-step-verify scaffolding w/ requirement map, D) critic pass; system-prompt.txt updated, portable copy + manifest refreshed (4 providers ready)
- 2026-07-11T15:13:23.994Z - qih (architect): fable-5-mode compact: system prompt 900->350 tokens (imperatives only, merged rules), 3 cheap high-yield cognitive moves added (task restate+unknowns, 2-approach sketch, tools-over-memory), SKILL.md 7.4KB->2.6KB, Gemini/AI Studio setup steps
- 2026-07-11T15:14:12.993Z - qih (architect): fable-5-mode compact: system prompt 900->350 tokens (imperatives only, merged rules), 3 cheap high-yield cognitive moves added (task restate+unknowns, 2-approach sketch, tools-over-memory), SKILL.md 7.4KB->2.6KB, Gemini/AI Studio setup steps
- 2026-07-11T15:14:50.084Z - qih (architect): fable-5-mode compacted (main 1e6ecda): system-prompt.txt 900->350 tokens keeping only high-yield imperatives, added 3 cheap cognitive moves (restate task+unknowns, 2-approach sketch for hard problems, tools-over-memory), SKILL.md 7.4KB->2.6KB progressive disclosure + Gemini/AI Studio setup steps, portable copy + manifest synced
- 2026-07-11T20:16:21.363Z - qih (architect): transition: soft top-blend gradient (34vh, curtain color -> transparent, fades out by 25pct journey) on incoming video sections — removes hard seam line at sticky handoff
- 2026-07-11T20:17:09.721Z - qih (architect): transition: soft top-blend gradient (34vh, curtain color -> transparent, fades out by 25pct journey) on incoming video sections — removes hard seam line at sticky handoff
- 2026-07-11T20:18:24.788Z - qih (architect): seam transition fix (main 2864b40, deployed): 34vh top-blend gradient on ScrubVideoSection (curtain #0e0806 -> transparent, opacity fades out by 25pct of journey via onProgress) — hard handoff line between video sections now a soft transition
- 2026-07-20T10:51:23.414Z - qih (architect): hero: swap video Flow -> Gaming Monitor (Gaming_room_monitor_displays_BURHAN, delogo watermark removed at 1110,559,85x85, g6 keyframes for smooth scrub), reuses existing scroll-scrub engine (useVideoScrub, 600vh sticky section), old flow.mp4 removed
- 2026-07-20T10:52:14.371Z - qih (architect): hero: swap video Flow -> Gaming Monitor (Gaming_room_monitor_displays_BURHAN, delogo watermark removed at 1110,559,85x85, g6 keyframes for smooth scrub), reuses existing scroll-scrub engine (useVideoScrub, 600vh sticky section), old flow.mp4 removed
- 2026-07-20T10:53:25.364Z - qih (architect): hero video swapped Flow -> Gaming Monitor (main 836e36d, deployed): source Gaming_room_monitor_displays_BURHAN_202607121905.mp4, Gemini watermark removed via delogo (found true position 1150,599 after first attempt missed by ~35px producing arrow artifact, fixed box 1110,559,85x85), re-encoded g6 crf21 2.7MB, reused existing scroll-scrub engine unchanged (600vh sticky, useVideoScrub hook), old flow.mp4 deleted
- 2026-07-20T10:58:09.326Z - qih (architect): hero scrub journey extended 600vh -> 850vh for slower scroll pace
- 2026-07-20T10:58:57.601Z - qih (architect): hero scrub journey extended 600vh -> 850vh for slower scroll pace
- 2026-07-20T11:00:11.103Z - qih (architect): hero scrub journey extended 600vh->850vh for slower scroll pace (main 9ce535b, deployed)
- 2026-07-20T11:05:21.482Z - qih (architect): hero fixes: headline now fades within first 10pct of scroll (was last 25pct) to stop overlapping the BURHAN text baked into the gaming-monitor video from frame 1; smoothed section handoff — hero end-curtain darkens gradually over 11pct instead of compressed 3.5pct, incoming topBlend 34vh->58vh with longer solid+fade for a seamless transition
- 2026-07-20T11:06:09.278Z - qih (architect): hero fixes: headline now fades within first 10pct of scroll (was last 25pct) to stop overlapping the BURHAN text baked into the gaming-monitor video from frame 1; smoothed section handoff — hero end-curtain darkens gradually over 11pct instead of compressed 3.5pct, incoming topBlend 34vh->58vh with longer solid+fade for a seamless transition
- 2026-07-20T11:07:18.705Z - qih (architect): hero fixes (main 9718970, deployed): headline fade window moved from p 0.75-1.0 to p 0.01-0.10 (disappears within ~1 viewport of scroll) since gaming-monitor.mp4 has BURHAN text baked into footage from t=0 causing persistent overlap; hero end-curtain darken window widened p 0.96-0.995 -> p 0.88-0.99 for gradual fade; ScrubVideoSection topBlend 34vh->58vh w/ 22pct solid hold before gradient, fade-out slowed p*4->p*2.2 to eliminate visible seam at section handoff
- 2026-07-20T11:23:21.354Z - qih (architect): keyboard scrub section: added scroll-triggered heading (Built for Performance) + subheading + endTag synced to video's dissolve ending (Turning Ideas Into Interfaces), all fade in/out driven by scroll progress via new ScrubVideoSection heading/endTag props; smoothed end-curtain to match hero (gradual p 0.88-0.99 vs compressed 0.96-0.995); slowed pace 320vh->460vh; re-verified Gemini watermark clean across full 10s duration (already removed)
- 2026-07-20T11:24:10.214Z - qih (architect): keyboard scrub section: added scroll-triggered heading (Built for Performance) + subheading + endTag synced to video's dissolve ending (Turning Ideas Into Interfaces), all fade in/out driven by scroll progress via new ScrubVideoSection heading/endTag props; smoothed end-curtain to match hero (gradual p 0.88-0.99 vs compressed 0.96-0.995); slowed pace 320vh->460vh; re-verified Gemini watermark clean across full 10s duration (already removed)
