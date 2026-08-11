Finalized - DO NOT EDIT

# Sprint 0 Build Plan

## Intents
- [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) — state: planned; acceptance criteria covered: 1, 2, 3, 4 (fully) and 5, 6, 7 (begun this sprint).

## Schema Tree
- Sprint Goal: stand up the Tome skeleton so a reader opens one route and reads an mdBook chapter in the ink-on-old-paper sacred aesthetic
  - Project & tooling
    - T-001: scaffold Astro + SolidJS + TypeScript + Tailwind v4 (Vite pin)
  - Design token layer
    - T-002: ink-on-paper + warm-dark `--theme-*` token layer (subtle texture)
  - mdBook data model
    - T-003: `parseSummary` SUMMARY.md parser
  - Reader shell
    - T-004: BookLayout + TocSidebar island (nav, collapse, theme toggle)
  - Content rendering
    - T-005: bundled sample book + chapter rendering with sacred prose styling

## Execution Sequence

### T-001: Scaffold Astro + SolidJS + TypeScript + Tailwind v4 with the Vite pin
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Touches:** `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/env.d.ts`, `vitest.config.ts`, `playwright.config.ts`
- **Depends on:** (none)
- **Acceptance criterion:** Enabling task for INT-0001 — provides the mandated Astro+SolidJS+TypeScript+Tailwind stack every other criterion is built on; directly serves criterion 7 (`astro check` passes; gates green).
- **Success criterion (EARS):**
  - **WHEN** `astro check` is run against the scaffolded project, **THEN** the toolchain **SHALL** complete with zero type errors.
  - **WHEN** `npm run build` is run, **THEN** Astro **SHALL** emit a static build with no duplicate-Vite plugin error.
- **Notes:** pin `overrides.vite` to Astro's Vite version (skill's duplicate-Vite footgun); add a `.transition-token` utility because Tailwind v4 emits no utility from `--duration-*`.

### T-002: Ink-on-paper + warm-dark token/theme layer (subtle texture)
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Touches:** `src/styles/tokens.css`, `src/styles/theme.ts`, `src/styles/fonts.css`, `src/styles/paper.css`, `src/styles/prose.css`
- **Depends on:** T-001
- **Acceptance criterion:** criterion 3 (ink-on-old-paper surface with body text meeting WCAG AA) and criterion 4 (every color/size/radius/motion flows through the `--theme-*` token layer; no raw hex/arbitrary values in components).
- **Success criterion (EARS):**
  - **WHEN** ink text (`--theme-text`) sits on the paper ground (`--theme-background`) in **each** shipped theme, **THEN** their contrast ratio **SHALL** be ≥ 4.5:1.
  - **WHEN** the neutronium audit scans `src/`, **THEN** it **SHALL** report zero raw-hex / arbitrary-value violations in components.
  - **WHEN** `<body>` carries the `theme-ink-paper` class, **THEN** the computed `--theme-background` **SHALL** resolve to the parchment token (not sacred's white).
  - **WHEN** `<body>` carries the `theme-terminal-dark` class, **THEN** the computed `--theme-background` **SHALL** resolve to the warm-dark token.
- **Notes:** port sacred `--color-*`/`--theme-*` structure; map tokens into Tailwind `@theme`. `paper.css` grain+vignette use only token vars + an inline SVG data-URI (no external asset). `--font-family-mono` keeps a `monospace` fallback so a blocked Mekzantine CDN never breaks the reader (self-hosting the woff2 is deferred).

### T-003: `parseSummary` mdBook SUMMARY.md parser (pure)
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Touches:** `src/lib/summary.ts`, `src/lib/summary.types.ts`
- **Depends on:** T-001
- **Acceptance criterion:** criterion 1 — parse `SUMMARY.md` into a nested nav model preserving part titles, prefix/suffix chapters, numbered nesting, draft entries, and separators.
- **Success criterion (EARS):**
  - **WHEN** `parseSummary` receives nested numbered chapters, **THEN** it **SHALL** return a tree preserving parent/child nesting depth.
  - **WHEN** `parseSummary` receives a part-title line (`# Title`), **THEN** it **SHALL** emit a part-title node.
  - **WHEN** `parseSummary` receives a prefix or suffix chapter (a top-level link outside the numbered list), **THEN** it **SHALL** mark it `prefix` or `suffix` respectively.
  - **WHEN** `parseSummary` receives a draft entry (`- [Name]()` with an empty link), **THEN** it **SHALL** mark the node `draft` with no href.
  - **WHEN** `parseSummary` receives a separator (`---`), **THEN** it **SHALL** emit a separator node.
- **Notes:** pure function, no DOM; grammar per mdBook SUMMARY.md format.

### T-004: BookLayout shell + TocSidebar island (nav, collapse, theme toggle)
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Touches:** `src/layouts/BookLayout.astro`, `src/components/TocSidebar.tsx`, `src/components/TocSidebar.module.css`, `src/components/init-theme.astro`
- **Depends on:** T-002, T-003
- **Acceptance criterion:** criterion 2 (persistent sidebar TOC, select a chapter, read it) and criterion 6 (reader interactions have designed hover/focus-visible/active states; theme switchable in code; honor `prefers-reduced-motion`).
- **Success criterion (EARS):**
  - **WHEN** TocSidebar renders with a parsed toc, **THEN** it **SHALL** render every linkable chapter as an anchor to its href.
  - **WHEN** a toc entry matches the active chapter slug, **THEN** that anchor **SHALL** carry `aria-current="page"`.
  - **WHEN** the collapse toggle is activated, **THEN** the sidebar open-state **SHALL** flip (open ↔ collapsed).
  - **WHEN** a sidebar anchor receives keyboard focus, **THEN** a visible focus-visible indicator **SHALL** be present.
- **Notes:** Solid island hydrated `client:idle`; nav links are SSR'd so they work with JS disabled (progressive enhancement). Theme toggle flips the body theme class and persists to `localStorage`; `init-theme.astro` restores the saved theme pre-paint (no FOUC). Written in Solid idioms per neutronium — signals are getters, `class` not `className`, `<For>`/`<Show>`, `onCleanup` — audited by `scripts/audit.sh`.

### T-005: Bundled sample mdBook + chapter rendering with sacred prose styling
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Touches:** `src/content/book/**` (sample `SUMMARY.md` + chapters), `src/pages/index.astro`, `src/pages/[...slug].astro`, `src/components/Pager.astro` (consumes `src/styles/prose.css`, which T-002 owns)
- **Depends on:** T-004
- **Acceptance criterion:** criterion 2 (read a chapter's Markdown; prev/next movement) and criterion 5 (Markdown rendering covers headings, paragraphs, lists, fenced code, inline code, blockquotes, tables, links, images — styled through sacred primitives).
- **Success criterion (EARS):**
  - **WHEN** a chapter route for a sample-book chapter is requested, **THEN** the page **SHALL** render that chapter's Markdown as HTML inside BookLayout with the sidebar present.
  - **WHEN** a rendered chapter contains a fenced code block, **THEN** it **SHALL** render inside sacred code styling (monospace, bordered panel).
  - **WHEN** a rendered chapter contains headings, lists, and a blockquote, **THEN** each **SHALL** carry the sacred prose token styling.
  - **WHEN** the reader is on a chapter that has an adjacent chapter, **THEN** a prev/next link to that adjacent chapter **SHALL** be present.
- **Notes:** the sample book doubles as Tome's own demo (chapters exercising headings/lists/code/blockquote/table/links). Markdown via Astro's build-time pipeline; `[...slug].astro` generates one route per non-draft chapter from the parsed toc (`parseSummary` from T-003).
