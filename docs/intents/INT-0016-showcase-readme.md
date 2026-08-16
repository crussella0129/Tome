# INT-0016 — Showcase README with the Mekzantine brand

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0016
- **State:** realized
- **Work evidence:** [Sprint 17 build plan (T-040–T-043)](../sprints/s17/sprint-plans/build-plan.md)
- **Completion evidence:** [T-040 completion (Sprint 17)](../work/completed-tasks.md#t-040-sprint-17), [T-041 completion (Sprint 17)](../work/completed-tasks.md#t-041-sprint-17), [T-042 completion (Sprint 17)](../work/completed-tasks.md#t-042-sprint-17), [T-043 completion (Sprint 17)](../work/completed-tasks.md#t-043-sprint-17)
- **Code evidence:** [banner generator](../../scripts/make-banner.mjs), [screenshot generator](../../scripts/make-shots.mjs), [terminal-font converter](../../scripts/make-terminal-font.py)
- **Test evidence:** [Sprint 17 test report](../sprints/s17/sprint-tests/test-report.md)
- **Documentation evidence:** [the showcase README](../../README.md)

## Intent

Turn the README from a functional reference into a **beautified showcase** that
sells Tome at a glance: a brand **title banner set in the reader's own display
font** (Mekzantine), a **gallery of feature screenshots** captured from the built
app, and a polished structure. Because GitHub Markdown cannot use web fonts, the
brand mark ships as a committed, GitHub-safe **image** rendered from the real
woff2 (outlined/rasterized, no font dependency) — consistent with the app icon
already in the repo. As a companion, provide a reproducible way to install the
monospace **MekzantineMono** as a local terminal font.

## Acceptance criteria

1. The README opens with a **brand banner** rendered in the Mekzantine display
   font, committed as a GitHub-safe image (renders with no external font), on the
   ink-on-parchment palette.
2. The README embeds **current screenshots** of Tome's key features — the
   Bibliotheca, the reader (sidebar + tome switcher + a chapter), search, richer
   content (admonitions + footnotes), the dark theme, and the on-this-page rail —
   each captioned, captured from the built site so they reflect the shipping
   2-tome default and aesthetic.
3. The README is restructured into a coherent **showcase**: a hero (banner +
   tagline), a feature gallery, then the practical guide (quickstart, view-a-book,
   desktop app) — finished and scannable, with all existing accurate information
   preserved or improved.
4. The banner and screenshots are produced by a **committed, reproducible
   generator** (so they regenerate from the font + the built app); the font
   **binaries stay git-ignored** (Mekzantine has no published licence — only
   rendered images are committed). A committed script also converts the mono
   woff2 into an **installable monospace TTF** (distinct family name, monospace
   flags set) for terminal use; the TTF itself is **not committed** and is
   installed locally out-of-band.

## Rationale

Tome's whole identity is its ink-on-old-paper, sacred-terminal aesthetic — a plain
text README undersells it. Leading with the brand font and real screenshots makes
the README show what the product *is*. Reusing the committed-image approach (as
with the app icon) keeps it GitHub-safe and respects the font's unclear licence
(no binaries committed).

## Alternatives

- Use the font via HTML/CSS in the README. Rejected: GitHub sanitises Markdown and
  cannot load web fonts; only an image reliably renders the brand type.
- Hand-crafted/AI banner art. Rejected: the point is to use Tome's *own* font.
- Commit a TTF for the banner/terminal. Rejected: the font has no published
  licence and the project deliberately git-ignores the binaries; commit only
  rendered images, and keep the terminal TTF local.

## Consequences

- Committed image assets (a banner + ~6 screenshots) live under a docs/assets
  location; a generator script (Playwright render of the font for the banner;
  Playwright against the served `dist/` for the screenshots) makes them
  reproducible. Repo size grows by a few hundred KB of PNGs.
- The terminal-font converter (woff2 → monospace TTF via fontTools) is committed;
  the produced TTF is installed for the current user (per-user, reversible) and is
  git-ignored. MekzantineMono is confirmed monospace (uniform advance width).

## Transition history

- 2026-08-16: created as `proposed` during Sprint 17 research — a pause between the
  Tauri spike (INT-0015) and the full Tauri port to make the README a finished
  showcase using Tome's own brand font; MekzantineMono confirmed monospace and
  fontTools+brotli available for the terminal-font conversion.
- 2026-08-16: `proposed → planned` — Sprint 17 plans T-040 (Mekzantine banner),
  T-041 (feature screenshots), T-042 (README showcase rewrite), and T-043
  (MekzantineMono terminal font), covering all four criteria.
- 2026-08-16: `planned → active` — Sprint 17 Build Phase began with T-040.
- 2026-08-16: `active → realized` — the README is a showcase: a Mekzantine brand
  banner (T-040), a hero reader shot + a 2×2 feature gallery captured from the built
  app (T-041), and a polished structure with every embedded image guarded by
  `test_readme_assets_resolve` (T-042); plus a committed converter that makes the
  monospace MekzantineMono installable as a terminal font, installed per-user with
  the binary git-ignored (T-043). Reproducible via `npm run assets:banner` /
  `assets:shots`. Isolation green (vitest 97, astro 0, check:electron 6, browser 21).
  Font binaries stay uncommitted (unpublished licence).
