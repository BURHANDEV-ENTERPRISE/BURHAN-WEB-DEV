# Homepage studio video

Owner: amad. Agent: mad (frontend). Date: 2026-09-27.

## Goal and scope

Improve the existing homepage video concept for prospective customers: a clear
studio introduction, readable typography and a shorter path to services.
Use the existing monitor and keyboard footage with the BURHANDEV cream, maroon
and peach palette. Scope is hero/video presentation, scroll pacing and links.
Navigation, services, pricing and admin content remain outside this change.

## Design and data contract

Concept: Inside the BURHANDEV studio. The opening combines an editorial headline
at the left with the monitor visible at the right. Small chapter labels and a
scroll progress rail explain the interaction. A persistent skip link reaches
services. The second chapter connects the keyboard imagery to craft and delivery.
Existing local MP4 URLs and the shared scroll hook remain the media interface;
there is no API, schema or storage change and no new dependency.

## Acceptance criteria and verification

- Intro scroll distance is substantially shorter than the existing 950vh + 400vh.
- Headline and video compose cleanly at desktop and 390px mobile widths.
- Scroll updates video time, chapter progress and overlay visibility together.
- Services link works by mouse and keyboard; invisible overlays have no controls.
- Reduced motion presents readable static scenes and working links.
- Run TypeScript, ESLint and production build; inspect desktop/mobile screenshots,
  scroll endpoints and reduced motion in Chrome using Playwright.

## Risk and rollback

Risk: text already burned into footage can compete with overlays. Keep added
headlines away from the monitor, fade them before the camera approaches it, and
inspect intermediate frames. Preserve the seek-aware scrub engine. Avoid heavy
filters, autoplay or new video downloads. On small screens prioritise readable
text and the monitor centre. Static background and text remain a failure fallback.
Rollback: revert the scoped presentation commit; original video binaries remain.

## Review and result

Readiness passed. Adversarial review: proceed. Source footage quality is unchanged;
the change improves composition, overlays and pacing. No new third-party code or
data collection. Links remain visible as text fades; decorative progress is hidden
from assistive technology. The original seek-aware video hook is unchanged.

Desktop journey: 480vh + 260vh (previously 950vh + 400vh). Mobile journey:
360vh + 220vh. Reduced motion: two static viewport scenes, with the extra end tag
hidden to avoid simultaneous competing messages. Fixed the second scene's
previous text positioning and end-tag horizontal centering.

Validation: production build, TypeScript and scoped ESLint passed. Chrome checks
at 1440x900 and 390x844 verified video seeks, headline fade, no horizontal overflow,
and keyboard activation of the services link. Reduced motion verified at 390x844.
No page or console errors in those three runs. Screenshots inspected for both
chapters. Preview server needed HTTP byte-range support for accurate seek testing.
Local review screenshots and the temporary harness are in ignored
`.cache/homepage-review/`.
