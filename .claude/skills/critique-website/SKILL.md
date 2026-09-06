---
name: "Website Critique"
description: "Runs a blunt, expert-level critique of the BURHANDEV marketing site (dev.burhan.my by default, or another URL if given) covering first impression, copywriting, visual design consistency, conversion path/CTA clarity, trust signals, and technical polish. Use when the user asks to critique, roast, review, judge, or get honest/harsh feedback on the website's design or marketing effectiveness - not for a plain technical bug/QA audit (that's a separate concern)."
---

# Website Critique

## What This Skill Does

Reviews the BURHANDEV site the way a paid design/marketing consultant would — as
a critic, not a QA bot. It judges whether the site actually *sells*, not just
whether it *works*. Every finding names what's weak, why it's costing
credibility or conversions, and what to do instead. No "looks great overall!"
padding, and no vague praise without a concrete reason.

## Quick Start

Default target is the live site. Fetch it (Playwright preferred — matches this
project's established pattern of `channel: "chrome"` launches; WebFetch is a
fallback only if no browser is available) and read the current component
source under `app/` and `src/components/` for ground truth on copy/structure,
since the DOM alone won't show intent (e.g. why a section exists).

```bash
# default target
https://dev.burhan.my/
# or, if the user gives a different URL/local build, use that instead
```

Then walk the six critique dimensions below, in order, taking a screenshot per
major section as you go (full-page + key section crops) so findings can
reference what's actually on screen.

## The Six Dimensions

Judge each one specifically — never write "needs improvement" without saying
what a stronger version would contain.

### 1. First Impression / 5-Second Hook
- Read only the hero headline + subheadline, nothing else. Does it say what
  BURHANDEV does AND for whom, specifically? Flag generic openers that could
  belong to any agency ("we build experiences that convert" reads as filler
  unless something concrete backs it up two seconds later).
- Does the visual tone (video, motion, color) match the price point being
  sold on the Pricing section? A RM800 landing-page tier next to a
  cinematic 3D/video hero can read as over-promising.

### 2. Copywriting Effectiveness
- Feature-speak vs benefit-speak: "5–8 pages full build" is a feature; what's
  the benefit stated next to it?
- Count unproven superlatives (bold, fast, clean, seamless) that appear
  with zero evidence (a number, a named client, a before/after) attached.
- Check the testimonials in `src/components/TestimonialsSection.tsx` — do
  they read as specific (named person, named result) or as interchangeable
  placeholder praise? Generic testimonials actively hurt trust once a
  reader notices the pattern.
- Grammar/tone consistency across sections — this site has been rewritten
  many times (Malay→English, several hero rewrites); check for leftover
  tonal seams between sections.

### 3. Visual Design Consistency
- Does every section share one system (the maroon/cream/orange BURHANDEV
  palette, `--font-bebas` display type, the dot-grid texture), or does any
  section still look like a bolted-on experiment from an earlier design
  pass? Grep `src/styles.css` and the `*.module.css` files for one-off
  colors/fonts that don't match the documented palette if something looks off.
- Spacing/rhythm: do section paddings feel deliberate or does density
  visibly jump between sections?

### 4. Conversion Path Clarity
- Is there one obvious primary action per section, or competing CTAs
  fighting for attention?
- Contact is mailto-only (`sales@burhan.my` / `support@burhan.my`) — call
  this out explicitly as a real conversion-cost decision: mailto links lose
  a meaningful fraction of mobile users who don't have a default mail app
  configured, versus an in-page form. State it as a tradeoff, not a bug.
- Is pricing scannable in under 10 seconds? Is the featured/recommended
  plan actually obvious at a glance?
- Is a primary CTA visible above the fold, or does the visitor have to
  scroll through the whole scroll-scrubbed hero journey first?

### 5. Trust Signals
- Portfolio/case studies: does the site show *any* real past work, or only
  claims about capability? A dev agency site with zero visible portfolio is
  a known, specific credibility gap — say so plainly if true.
- Testimonials depth (see #2), client logos, the business registration
  number in the footer (this IS a genuine trust signal — credit it if
  present, don't skip positives entirely).
- Social links: do they resolve to active, populated profiles, or dead/thin
  accounts that undercut the "established agency" framing?

### 6. Technical Polish (light pass only)
This skill is not the technical/security audit — keep this section brief.
Only flag things a visitor would actually notice: load stutter, console
errors, broken images/links, layout shift, mobile overflow. For a deep
technical/SEO/security pass, that's separate work, not this skill's job.

## Output Format

Lead with a one-paragraph, unvarnished verdict: if a stranger landed on this
page cold, would they trust it enough to email sales@? Why or why not, one
sentence of reason.

Then list findings grouped by severity, each with dimension, headline claim
naming the file/section it comes from, and one supported by a **concrete
fix**, not just criticism, e.g. "the Testimonials section should include real names and a specific result".

- **Critical** — actively costs conversions or credibility right now
- **Major** — a competent competitor site would clearly beat this
- **Minor** — polish, not urgent

Close with the single highest-leverage fix to do first, and why that one
over the others.

## Rules

- Never write a finding without naming the concrete fix.
- Don't repeat findings already fixed in a prior pass — check `.MOP/memory/*.jsonl`
  for recent related work (marquee, pricing, hero, footer nav, SEO/security)
  before critiquing those exact areas again, so this doesn't relitigate
  already-shipped changes.
- Stay in the marketing/design/UX lane. Security, dependency, and CI
  concerns belong to a separate audit, not this skill.
- Follow this project's MOP auth/agent-routing gate in `CLAUDE.md` before
  answering, same as any other task in this repo.
