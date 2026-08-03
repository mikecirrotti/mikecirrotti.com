---
name: responsive-audit
description: Render and audit mikecirrotti.com across phone, tablet, and laptop viewports in light and dark themes, with automated horizontal-overflow and clipped-text detection. Use this whenever asked to check how the site looks or renders on different devices or screen sizes, review layout or visual organization, take screenshots of the site, verify responsive behavior, or before merging any change that touches CSS, breakpoints, component styles, or page structure — even if the request doesn't say "audit" (e.g. "does this look right on mobile?", "check the layout", "screenshot the homepage").
---

# Responsive Layout Audit

Builds the site, serves it, captures full-page screenshots across a device matrix, and
runs programmatic layout diagnostics. Use it to catch regressions before they ship and
to ground any layout discussion in real renders instead of guesses.

## Quick start

```bash
npm run build
npm i --no-save playwright-core        # skip if node_modules/playwright-core exists
npx astro preview --port 4321 &        # serve the built site
node .claude/skills/responsive-audit/scripts/audit.mjs
```

Output lands in `.responsive-audit/` (gitignored): screenshots organized by
`<theme>/<width>/<page>.png`, plus `summary.json` and a console report of findings.
Kill the preview server when done.

The script auto-discovers pages from `dist/` (every built `index.html` becomes a route),
so new pages and work entries are picked up automatically.

## Why this device matrix

| Width | Represents | What tends to break here |
|---|---|---|
| 320 | iPhone SE, smallest real phones | long headings clip; fixed-height cards overflow |
| 360 | most common Android width | 2-column card grids get too narrow for their text |
| 390 | iPhone 12–16 | the "default mobile" reference render |
| 768 | iPad portrait | **sits just below the site's 50em (800px) breakpoint**, so it gets the phone layout stretched — the most fragile width on this site |
| 1024 | iPad landscape / small laptop | desktop grid at its tightest |
| 1440 | laptop | the reference desktop render |

The site's single breakpoint is `@media (min-width: 50em)` (800px), used in ~15 files
plus a `window.matchMedia('(min-width: 50em)')` call in `src/components/Nav.astro` that
drives the hamburger-vs-pill-nav toggle. The script checks both sides of the breakpoint
edge and reports which nav variant rendered at each width — if the CSS breakpoint and
the Nav script ever disagree, both or neither menu can appear in the gap.

## Reading the results

The script's diagnostics are trustworthy for:

- **Horizontal overflow** — any element whose right edge passes the viewport. Note the
  site sets `overflow-x: hidden` on html/body, so overflow never shows as a scrollbar
  on real devices; it shows as *silently clipped content*. Only the programmatic check
  catches it.
- **Container escape** — text or children extending past the bottom of a bordered/
  shadowed container (e.g. a fixed-height card whose copy grew a line). This is a
  heuristic; verify each hit in the matching screenshot before reporting it.

Things only your eyes catch — review the screenshots for:

- Awkward image crops or extreme aspect ratios (cards becoming panoramic strips near
  768px is this site's classic failure)
- Heading line-breaks that orphan a single word
- Sections that look empty or lopsided (the offset work grid degenerates when there are
  few projects)
- Dark theme: check contrast on cards and the footer, not just the hero
- Whether both nav states look right at the breakpoint edge widths

## Known pitfalls (learned the hard way)

1. **Lazy images**: portfolio images use `loading="lazy"`. The script scrolls each page
   before capturing; if you screenshot another way, do the same or cards render as
   empty gray boxes and you'll misreport a bug that doesn't exist.
2. **Do not use Playwright's `isMobile: true` for full-page captures.** Chrome's mobile
   emulation applies text autosizing during tall captures and produces a wider-than-
   viewport screenshot that looks exactly like a horizontal-overflow bug. It isn't one.
   Plain viewport emulation renders identically for layout purposes. If a screenshot
   looks overflowed, trust the `scrollWidth` diagnostic, not the image.
3. **A clean `df`-style pass isn't a pass.** `summary.json` saying "no overflow" only
   covers the programmatic checks; the visual review of screenshots is half the audit.

## When you're done

Report findings ordered by severity: real defects (overflow/clipping) first, then
composition issues, then nits — each with the width(s) and theme where it appears and
the screenshot path as evidence. Distinguish clearly between "verified programmatically"
and "visual judgment". If the audit was run to validate a change, compare against `main`
renders (check out main, rerun, diff the two output dirs) rather than trusting memory.
