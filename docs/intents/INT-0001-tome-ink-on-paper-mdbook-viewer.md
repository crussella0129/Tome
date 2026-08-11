# INT-0001 — Tome: an ink-on-paper mdBook viewer on sacred-computer components

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0001
- **State:** active
- **Work evidence:** [Sprint 0 build plan (T-001–T-005)](../sprints/s0/sprint-plans/build-plan.md), [Sprint 0 test plan](../sprints/s0/sprint-plans/test-plan.md), [Sprint 1 build plan (T-006–T-009)](../sprints/s1/sprint-plans/build-plan.md)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** [Sprint 0 test report](../sprints/s0/sprint-tests/test-report.md)
- **Documentation evidence:** none

## Intent

Tome is a web viewer that renders an [mdBook](https://github.com/rust-lang/mdBook)
source tree (its `book.toml`, `src/SUMMARY.md`, and chapter Markdown) using the
component vocabulary and terminal typographic sensibility of the **sacred
computer** library ([www-sacred](https://github.com/internet-development/www-sacred),
MIT), but re-skinned into an **"ink on old paper"** aesthetic: a warm parchment
ground with dark sepia-ink text, sacred's box-drawing panels and monospace
precision preserved, rendered in Mekzantine — the sacred-computer typeface whose
designer publishes at [mek.gallery](https://www.mek.gallery/).

The reader-facing outcome is a book that feels like a printed tome viewed through
a sacred terminal: a persistent sidebar table of contents parsed from
`SUMMARY.md`, a readable chapter column with a comfortable measure, sacred
treatment of headings/code/tables/quotes/lists, and prev/next chapter movement.

The paper treatment is **subtly textured**, not flat and not heavily
illustrative: a warm cream ground with sepia-black ink, overlaid with a faint
paper grain and a soft edge vignette (rendered from an inline SVG data-URI and
token variables, no external asset). Tome ships **two themes**, both expressed
purely as `--theme-*` overrides: `theme-ink-paper` (the default light, ink-on-old-
paper look) and `theme-terminal-dark` (a warm-dark companion terminal theme). The
active theme is a body class; a reader-facing toggle is a permitted enhancement.

**Boundaries.** Tome renders mdBook *source data*; it does not re-host mdBook's
own compiled HTML theme. It is built on the stack the front-end skill mandates —
**Astro + SolidJS + TypeScript + Tailwind v4** — shipping zero JS by default and
hydrating only islands that need interactivity. Sacred components are *ported*
(to `.astro` where static, to Solid `.tsx` islands where interactive), never
imported wholesale from a React/Next tree.

**Non-goals (for now).** Editing or authoring books; running `mdbook build`;
full-text search; multi-book libraries; live reload of a running mdBook process;
100% CommonMark/GFM extension parity. These may become follow-on intents.

## Acceptance criteria

1. Given an mdBook source directory, Tome parses `src/SUMMARY.md` into a nested
   navigation model preserving part titles, prefix/suffix chapters, numbered
   nesting, draft (unlinked) entries, and separators.
2. A reader can open the site, see the parsed table of contents in a persistent
   sidebar, select any chapter, and read its Markdown rendered as HTML.
3. The visual surface is the ink-on-old-paper theme: parchment background, sepia
   ink text, Mekzantine/mono type, sacred box-drawing panels — with **body text
   meeting WCAG AA contrast** against the paper ground.
4. Every color, size, radius, and motion value flows through the design-token
   layer (`--theme-*` custom properties adapted from sacred `global.css`); no
   raw hex or arbitrary pixel values live in components.
5. Markdown rendering covers headings, paragraphs, ordered/unordered lists,
   fenced code blocks, inline code, blockquotes, tables, links, and images, each
   styled through sacred components/primitives.
6. Reader interactions (chapter navigation, sidebar collapse/expand, theme is
   at minimum switchable in code) have designed hover/focus-visible/active
   states and honor `prefers-reduced-motion`.
7. `astro check` passes; the neutronium mechanical audit (`scripts/audit.sh`)
   reports no violations; any wired test gates are green.

## Rationale

The project README already fixes the concept ("an mdBook viewer that uses the
sacred computer library components to display mdBook data"). Sacred's
`global.css` drives *everything* off `--theme-*` custom properties, so a new
aesthetic is a **token-layer re-skin**, not a component fork — which is exactly
the "tokens before components" discipline the front-end skill demands. Astro's
islands model fits a document reader: the chapter body is static server-rendered
HTML (fast, zero-JS), and only navigation/toggles become hydrated islands.
Mekzantine is already sacred's default `--font-family-mono`, so honoring the
designer the user cited is the native path, not a deviation.

## Alternatives

- **Fork sacred's Next.js app and restyle it.** Rejected: violates the
  front-end skill's Astro+Solid stack and drags in React/Next; sacred's own
  porting skills explicitly describe re-expressing primitives in the target
  stack rather than importing the React tree.
- **Wrap mdBook's compiled HTML output in an iframe/proxy and overlay CSS.**
  Rejected: fights mdBook's theme, forfeits sacred component structure, and
  makes the token-driven re-skin (criterion 4) effectively impossible.
- **Render Markdown with a generic prose stylesheet.** Rejected: abandons the
  sacred-computer component vocabulary that is the whole point of the project.

## Consequences

- Tome maintains a *small ported subset* of sacred components; each port carries
  a maintenance cost and must track sacred's token contract.
- Markdown→HTML needs a build-time pipeline (e.g. an Astro-native Markdown/MDX
  path or a remark/rehype chain) whose output must be re-styled to sacred, not
  left with default HTML styling.
- Committing to the token layer up front constrains every later component but
  guarantees light/dark/tint and the ink-on-paper theme stay consistent for free.
- Shipping two themes (`theme-ink-paper` + `theme-terminal-dark`) doubles the
  token surface to keep contrast-correct, but preserves sacred's dual-theme design
  and gives readers a low-light option at no per-component cost.
- The subtle paper texture (grain + vignette) must stay behind text and never
  degrade body-text contrast (criterion 3); it is kept token-driven and
  asset-free so it cannot break under CSP or offline conditions.
- Mekzantine has **no published licence**, so Tome does not redistribute the
  binary. It is **fetched at build time** into a git-ignored `public/fonts/` and
  served from Tome's own origin (dropping the runtime CDN dependency); the fetch
  is non-fatal and the `monospace` fallback covers any failure. Committing the
  woff2 would require confirmed redistribution rights.
- SUMMARY.md parsing is bespoke; its grammar (mdBook's) must be tracked if
  upstream evolves.

## Transition history
- 2026-08-11: created as `proposed` during Sprint 0 research (INT-0001).
- 2026-08-11: `proposed → planned` — Sprint 0 build/test plans (T-001–T-005) accepted into executable work; Work evidence attached.
- 2026-08-11: recorded design decisions (subtle-texture parchment; two themes `theme-ink-paper` + `theme-terminal-dark`) into Intent/Consequences per plan-critique C-003; no state change.
- 2026-08-11: `planned → active` — Sprint 0 Build Phase began implementing T-001–T-005.
