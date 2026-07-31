# MOP Session Brief

Updated: 2026-07-31T08:23:33.660Z
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

- 2026-07-27T13:00:19.577Z - qih (architect): mobile/tablet responsiveness pass: fixed fixed-header colliding with Pricing and Why Us section headings at mobile/tablet widths (top padding was equal to or less than the header's clearance, causing text to render behind the BURHANDEV chip), and enlarged undersized footer nav/social link tap targets (14px tall) to ~41px for touch usability. Verified across iPhone SE/14, Pixel 7, Galaxy S9, iPad Mini, iPad Pro portrait+landscape with no horizontal overflow anywhere
- 2026-07-27T13:02:10.207Z - qih (architect): mobile/tablet responsiveness audit + fixes: Pricing and Why Us headings were colliding with the fixed header at mobile/tablet widths (insufficient top padding), footer nav/social links had 14px-tall tap targets - both fixed and verified across iPhone/Android/iPad, no horizontal overflow found. Deployed main@21ca985
- 2026-07-27T17:40:17.855Z - qih (architect): sync pending polish: testimonials anti-flash marquee fix mirroring MarqueeStrip, footer logo swap replacing back-to-top arrow, pricing featured-card hover-only highlight
- 2026-07-27T17:42:19.312Z - qih (architect): sync pending polish: testimonials anti-flash marquee fix mirroring MarqueeStrip, footer logo swap replacing back-to-top arrow, pricing featured-card hover-only highlight
- 2026-07-27T17:59:32.116Z - qih (architect): code quality cleanup: removed ~600 lines of unreachable dead code (Hero Minecraft easter-egg state machine that never triggered + orphaned BlockyChar component), deleted untracked tsconfig.tsbuildinfo build-cache artifact, fixed broken footer nav (linked to nonexistent #hero/#about/#story anchors and a nonexistent /contact route), switched footer logo to next/image, and wired up a working ESLint config (npm run lint was previously non-functional)
- 2026-07-27T18:06:22.294Z - qih (architect): fix CI break: package-lock.json was out of sync with package.json after adding ESLint devDependencies, causing npm ci to fail in GitHub Actions with EUSAGE (missing/invalid @emnapi/* optional deps). Regenerated a clean lockfile from scratch and verified npm ci succeeds locally before pushing
- 2026-07-28T17:17:05.402Z - mad (frontend): hero: vertically center headline (was anchored near top) and add burhan logo image beside BURHANDEV wordmark; pricing: give featured card a subtle default highlight (border+shadow) instead of hover-only; why-us panels: add hover interactivity (straighten rotation, lift, deepen shadow) since they were fully static before
- 2026-07-29T12:08:34.603Z - anis (core): amad asked if I can access 'mobin' - no match found anywhere in repo/tools; asked amad to clarify what mobin refers to (site, account, person, or typo)
- 2026-07-29T12:16:37.600Z - anis (core): clarified 'mobin' = Mobbin MCP (design inspiration tool); confirmed via claude mcp list that only mop-flow is registered in this project, not mobbin; gave amad the claude mcp add command + noted browser auth step must be done by amad since this session is non-interactive
- 2026-07-29T12:18:51.505Z - anis (core): mobbin MCP server now registered (claude mcp add done) but shows 'Needs authentication' - amad still needs to run /mcp and authenticate via browser sign-in before tools become available
- 2026-07-29T12:37:14.397Z - mad (frontend): pricing: unify hover glow across all cards to match featured card's border+shadow highlight (smoothed with border-width transition); add SEO-ready feature bullet to Landing Page plan
- 2026-07-29T12:39:06.612Z - mad (frontend): pricing: unify hover glow across all cards to match featured card's border+shadow highlight (smoothed with border-width transition); add SEO-ready feature bullet to Landing Page plan
- 2026-07-29T12:43:35.642Z - mad (frontend): shipped to main (dfa8087): pricing cards now all glow on hover (2.5px solid maroon border + deep box-shadow) matching the featured card's look, smoothed with a border-width transition; Landing Page plan gained an 'SEO-ready page' feature bullet alongside Business Website's existing 'SEO-ready structure'
- 2026-07-29T12:53:11.738Z - mad (frontend): fix why-us panels 2/3 hover cancelled by later nth-child rotate rule (equal CSS specificity, source-order lost); add missing burhan logo image beside BURHANDEV wordmark in header brand-lockup
- 2026-07-29T12:54:24.933Z - mad (frontend): shipped to main (6fde032): fixed why-us panels 2&3 not animating on hover (nth-child rotate rule had equal CSS specificity to :hover and came later, so it silently won and cancelled the hover transform); added the missing burhan-logo2.png image beside the BURHANDEV wordmark in the top header brand-lockup (hero and footer already had it, header never did)
- 2026-07-29T13:37:27.321Z - mad (frontend): hero: remove burhan logo image from the BURHANDEV wordmark row (kept hero/header/footer wordmarks consistent per request); drop now-dead introBrandRow/introLogo CSS
- 2026-07-29T13:38:45.675Z - mad (frontend): shipped to main (b62c3c4): removed the burhan logo image from the hero's BURHANDEV wordmark row per amad's request; also deleted the now-dead .introBrandRow/.introLogo CSS and unused Image import that only existed to support it
- 2026-07-29T13:53:48.653Z - qih (architect): perf: re-encode both videos with libx264 CRF-based compression (project1.mp4 CRF30, gaming-monitor.mp4 CRF27, tight GOP kept for scrub smoothness) cutting video weight from 8.27MB to 3.78MB (54% smaller); resize+convert oversized 1660px logo PNG to a 256px WebP (107KB->6.3KB); delete unreferenced 326KB box_2048px_Normal.png
- 2026-07-29T13:55:48.599Z - qih (architect): shipped to main (5f20f72): site optimization pass - re-encoded both videos (project1.mp4 CRF30, gaming-monitor.mp4 CRF27, kept tight GOP for scrub smoothness), total video weight 8.27MB->3.78MB (54% smaller), verified visually via extracted frames including the hero's burned-in BURHAN text (no visible artifacts); shrunk oversized 1660px logo PNG to a 256px WebP (107KB->6.3KB); deleted unreferenced 326KB box_2048px_Normal.png. JS bundle was already lean (~115KB) so left untouched
- 2026-07-31T08:23:33.620Z - qih (architect): add .gitignore rules to keep the AI-training dataset (script + generated JSONL, built from MOP memory diary) local-only per decision: repo is public and dataset content isn't cleared for publishing even with credentials redacted
