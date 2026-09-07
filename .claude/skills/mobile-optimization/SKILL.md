---
name: "Mobile View Optimization"
description: "Diagnoses and fixes mobile/tablet responsive issues on the BURHANDEV website with an actual checklist and Playwright device-emulation verification, instead of guessing. Covers touch target sizing, horizontal overflow, safe-area insets, mobile typography/input zoom, fixed-header collisions, and this project's tall scroll-scrubbed video sections specifically. Use whenever the user asks to fix, check, improve, or optimize mobile view, tablet layout, responsive design, or says the site 'looks broken on phone'."
---

# Mobile View Optimization

## What This Skill Does

Turns "fix mobile view" into a real diagnostic pass instead of a guess. Runs
the checklist below against real device viewports via Playwright, finds
concrete issues (not vibes), fixes them, and re-verifies on the same devices
before calling it done.

## Quick Start

Default device set — the same one already used for this project's prior
mobile/tablet responsiveness passes, keep using it for consistency:

| Device | Viewport | Notes |
|---|---|---|
| iPhone SE | 375×667 | smallest common iOS width |
| iPhone 14 | 390×844 | notch, safe-area-inset relevant |
| Pixel 7 | 412×915 | Android, check tap target scaling |
| Galaxy S9 | 360×740 | narrowest common Android width |
| iPad Mini | 768×1024 | portrait + landscape both |
| iPad Pro | 1024×1366 | portrait + landscape both |

Launch Chromium with `channel: "chrome"` (this project's established
Playwright pattern), set `viewport` per device, and check the full
diagnostic list below on each one that's relevant to the reported issue —
don't skip straight to a fix without at least the horizontal-overflow and
tap-target passes, those catch the majority of real mobile bugs.

## Diagnostic Checklist

Work through these in order. Each one names the concrete check, not just the
concept — run it, don't eyeball it.

### 1. Horizontal overflow (most common real bug)
```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
```
If true, binary-search which element causes it — usual suspects: a
fixed-width child, an unconstrained `<img>`/`<video>` without
`max-width:100%`, negative margins, or an absolutely-positioned element
bleeding past its container. Check every section, not just the one
reported — overflow in one section still breaks the whole page's scroll.

### 2. Touch target size
Every interactive element (button, link, form control) should have a
clickable area of at least 44×44px (Apple HIG) / 48×48dp (Material). Check
via `getBoundingClientRect()` on nav links, footer social links, form
buttons, close/menu icons. This project has hit this before — footer nav
links were once 14px tall and had to be enlarged to ~41px.

### 3. Fixed/sticky header collision
This project's header is `position: fixed`/`sticky`. On narrow viewports,
check that section top-padding clears the header's height — a heading
rendering behind or under the header chip is a recurring regression here
whenever section padding gets tuned without re-checking mobile.

### 4. Mobile typography and input zoom
- Any `<input>`/`<textarea>` with `font-size` under 16px causes iOS Safari
  to auto-zoom on focus — check every form field (admin panel, contact
  form) at actual mobile viewport, not just desktop devtools zoom.
- Body/paragraph text shouldn't drop below ~14px on the smallest viewport.

### 5. Safe-area insets (notched devices)
Any fixed-position element pinned to the top/bottom edge (header, sticky
CTA, mobile nav) should account for `env(safe-area-inset-top)` /
`env(safe-area-inset-bottom)` so it doesn't sit under the notch or home
indicator on iPhone.

### 6. Responsive images/video
- Images need `max-width: 100%` (or Next/Image, which already handles
  this) — never a fixed px width wider than the smallest supported
  viewport.
- Video posters/first-frames should look intentional at mobile width, not
  cropped oddly — spot-check visually, not just structurally.

### 7. Tap-friendly spacing
Adjacent interactive elements (nav links, social icons, pricing CTAs) need
enough gap that a real thumb won't mis-tap the neighbor — 8px minimum
between targets, more if either target is near the 44px minimum itself.

## Project-Specific: Scroll-Scrubbed Video Sections

`HeroSection` and `ScrubVideoSection` (via `useVideoScrub`) drive video
frame/opacity/transform off scroll progress across very tall sections
(400–950vh). These need mobile-specific verification beyond the checklist
above, because touch-scroll and wheel-scroll do not behave identically:

- **iOS momentum scroll** can blow past progress checkpoints in one flick
  where desktop wheel-scroll would pass through them gradually — check
  that heading/endTag fade windows are still readable at realistic mobile
  scroll speed, not just reachable in principle.
- **`prefers-reduced-motion`** is more commonly enabled on mobile
  (accessibility settings, battery saver interactions) — always verify the
  reduced-motion fallback path specifically on a mobile emulation, not
  just desktop.
- **IntersectionObserver `rootMargin` gating** (used to pause the scrub
  rAF loop off-screen) needs the same visual result on small viewports —
  confirm the video doesn't visibly stutter or skip frames when the
  sticky section is only a fraction of a narrow viewport tall relative to
  its content.
- Total scroll distance (750vh, 400vh, etc.) is the same raw vh on mobile
  as desktop, but a mobile viewport is physically shorter — that means
  *more* real screen-heights of scrolling to get through the same
  section. If a section already felt long on desktop, treat it as a
  mobile-priority candidate for shortening, not just a nice-to-have.

## Verification

After any fix, re-run the horizontal-overflow check and a full-page
screenshot on every device size relevant to the reported issue — not just
the one where the bug was first noticed. A fix tuned for iPhone SE's 375px
width has broken iPad landscape before in this project; check the full
device set, not just the narrowest one.

## Rules

- Never report "looks fine" without the horizontal-overflow JS check
  having actually run — visual inspection alone misses overflow that's
  scrolled off-screen.
- Name the specific device + viewport where each issue was found, and
  re-confirm the fix on that same device before closing it out.
- Check `.MOP/memory/*.jsonl` for prior mobile/tablet passes before
  starting, so this doesn't reintroduce a bug that was already fixed once
  (the header/section-padding collision has regressed before).
