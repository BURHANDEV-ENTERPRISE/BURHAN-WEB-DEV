# BURHANDEV Landing Page UX Spec

## Intent

Build a public landing page for BURHANDEV that tells Malaysian users and
business owners that BURHANDEV provides web developer services.

## Visual Direction

- Use the BURHAN public palette and texture from the broken original site:
  cream canvas, maroon headers/buttons, deep green contrast bands, orange
  accents, low-alpha grid texture, and subtle scanline texture.
- Use a BikeBear-like interaction model without copying brand assets: pinned
  cinematic hero, oversized typography moving behind the foreground object,
  top-right capsule navigation, left vertical badge, bottom ticker, and
  progress-based frame changes while scrolling.
- Use a BURHANDEV-specific generated visual system: logo token, browser panels,
  code panels, cursor mark, and build states. Do not copy BikeBear branding,
  mascot, wording, or image assets.

## Audience

- Small businesses, creators, communities, and operators who need a website,
  landing page, product UI, or operational web tool.
- Users should understand within the first viewport that BURHANDEV builds
  launch-ready web experiences.

## User And Success

- Primary user: Malaysian business owner or project operator comparing web
  developer service providers.
- Secondary user: community owner or creator who needs a fast landing page or
  custom web tool.
- Success: the user can understand the offer in under five seconds, browse
  services, see a clear process, and reach the contact CTA without confusion.

## Scope

- Static Vite landing page in the workspace root.
- Sections: hero, web services, process, featured work concept, contact CTA,
  footer.
- Scroll animation: hero has progress-driven visual frames; other sections
  reveal with scroll.
- Contact CTA links to email or current public site contact path.

## Data Contract

- No backend API for this first version.
- Content is local static data inside the frontend source.
- Contact actions use `mailto:` and public links only.
- Animation state is derived from browser scroll position and viewport size.

## Acceptance Criteria

- First viewport clearly shows BURHANDEV and web development service.
- Theme uses BURHAN cream, maroon, green, orange, and black/ink accents from
  the referenced BURHAN direction.
- Hero includes a frame-by-frame scroll animation using code-driven visual
  states, not a copied external asset.
- Hero composition includes giant background typography, a foreground build
  object, left rail, bottom ticker, and top-right capsule control.
- Services behave like large interactive rows with hover/focus active states.
- Page is responsive for mobile and desktop.
- Motion respects `prefers-reduced-motion`.
- App runs locally with `npm run dev`.

## Risks

- Private GitHub repo cannot be inspected if GitHub CLI or connector access is
  unavailable in this environment.
- The current public site is incomplete, so copy and content must be treated as
  directional rather than final.
- Heavy animation can hurt mobile performance, so transforms should remain
  CSS-based and lightweight.

## Risks Reviewed

- Risk review complete for first implementation scope.
- Avoid copying BikeBear assets or brand-specific language; use only the
  interaction idea and composition pattern as inspiration.
- Keep the hero visual code-generated so the landing page has a visual asset
  without relying on unavailable private assets.
- Include reduced-motion behavior and a static fallback for accessibility.

## Rollback

- Because this is a new static app scaffold, rollback is removing the new
  frontend files and this artifact, or reverting the generated commit once git
  is initialized.

## Test Plan

- Install dependencies.
- Run production build.
- Start local dev server.
- Check desktop and mobile screenshots.
- Confirm no overlapping text in hero, service cards, and CTA.
