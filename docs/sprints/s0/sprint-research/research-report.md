# Sprint 0 Research Report

## Intents Reviewed
- [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) — created; relevance: this sprint scaffolds the viewer and establishes the ink-on-paper token theme that the whole intent depends on; current state: `proposed`.

## 1. Sprint Goal

Stand up the Tome application skeleton so a reader can open one route and read
an mdBook chapter rendered in the ink-on-old-paper sacred aesthetic. Concretely,
Sprint 0 scaffolds the mandated **Astro + SolidJS + TypeScript + Tailwind v4**
project, ports sacred's `--theme-*` token system into an ink-on-paper theme
(parchment ground, sepia ink, Mekzantine mono) as the token layer, parses a
sample mdBook `SUMMARY.md` into a navigation model, and renders at least one
chapter's Markdown as sacred-styled HTML inside a sidebar+content layout. This is
the first bounded slice of INT-0001 — it advances acceptance criteria 1–4 and
begins 5; full Markdown coverage and interaction polish (6) come in later sprints.

## 2. Existing Code Survey

| File | Relevance | Notes |
|------|-----------|-------|
| `README.md` | high | Fixes the concept: "an mdBook viewer that uses the sacred computer library components to display mdBook data." Source of truth for project purpose. |
| `docs/intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md` | high | The intent created this sprint; defines boundaries, non-goals, acceptance criteria. |
| `docs/work/remote-profile.md` | med | github / base `main` / work `dev` / human-approve — one PR per sprint checkpoint. |
| `.claude/settings.local.json` | low | Only sprint-loop helper permissions; no app config yet. |
| `LICENSE` | low | Repo license; sacred is MIT (compatible for porting). |

The repository is otherwise greenfield (LICENSE + README only), so there is no
existing application code to survey — the survey below is dominated by the
external sacred-computer sources that define the components and tokens to port.

## 3. External Sources

- [www-sacred repo](https://github.com/internet-development/www-sacred) — MIT React/Next + SCSS/CSS-Modules component library ("build web/desktop/static apps with terminal aesthetics"). Provides the component catalog and token system Tome ports.
- [www-sacred styling layer — `global.css`](https://raw.githubusercontent.com/internet-development/www-sacred/main/global.css) — the authoritative token layer: `--theme-*` semantic tokens driven by body classes `theme-light`/`theme-dark`/`tint-*`, an ANSI-anchored `--color-*` palette, `--font-family-mono` (default `MekzantineMono-Regular`), z-index and line-height tokens. **The ink-on-paper theme is a token override of this file** — components read `var(--theme-*)` and never hardcode color. Its companion [`global-fonts.css`](https://raw.githubusercontent.com/internet-development/www-sacred/main/global-fonts.css) defines the `@font-face` set incl. `Mekzantine-Regular`/`MekzantineMono-Regular` (the mek.gallery designer's typeface) and `ServerMono`, loaded from S3/jsDelivr and toggled via `body.font-use-*` classes.
- [www-sacred `components/` catalog](https://github.com/internet-development/www-sacred/tree/main/components) — ~70 primitives. Directly relevant to a book viewer: `SidebarLayout`, `Navigation`, `TreeView`, `BreadCrumbs`, `Accordion`, `Text`, `CodeBlock`, `Divider`, `Table`/`SimpleTable`, `Card`, `Block`, `Row`, `ListItem`, `ContentFluid`, `Window`.
- [Sacred porting skill: "…to-react-using-same-conventions"](https://raw.githubusercontent.com/internet-development/www-sacred/main/skills/port-sacred-terminal-ui-to-react-using-same-conventions/SKILL.md) — the user-cited "skill files." Core rules we adopt: reuse existing primitives; keep box-drawing borders inside the component's CSS Module; components inherit theming **only** through `--theme-*` custom properties (never import `colors.json`); keep layouts width-fluid. `components/AGENTS.md` is the canonical per-component prop/token catalog to consult when porting each one.
- [mek.gallery](https://www.mek.gallery/) (inspiration, per user) — austere, archival, bracketed-nav `[LIKE THIS]`, `####` headers, monospace, high-contrast ink-on-light structural-honesty aesthetic. Informs Tome's typographic restraint and paper feel, not its content.

## 4. Risks, Unknowns, Dependencies

- **Risk: React→Solid idiom drift.** Sacred components are React; neutronium forbids React idioms in Solid (props are reactive getters, `class` not `className`, `<For>`/`<Show>`, signals are getters). Every ported `.tsx` must be re-expressed in Solid patterns, not copy-pasted. Mitigation: port only the minimal subset this sprint needs; keep static pieces in `.astro` (zero JS).
- **Risk: token re-skin vs. contrast.** Parchment+ink must still pass WCAG AA for body text (criterion 3). Mitigation: choose ink dark enough (≈ near-black sepia) on parchment and verify contrast during build.
- **Risk: fonts are remote (S3/jsDelivr).** Mekzantine loads cross-origin; offline/CSP could break it. Mitigation: keep a monospace fallback stack in the token; optionally self-host the woff2 later.
- **Unknown: Markdown pipeline choice.** Astro-native content collections/Markdown vs. a runtime remark/rehype parse of arbitrary book source. For Sprint 0 a bundled sample book rendered via Astro's build-time Markdown is simplest; general "point at any book dir" is a later concern.
- **Unknown: exact `SUMMARY.md` edge cases** (draft chapters, nested parts, separators) — grammar is known but parser needs unit tests.
- **Dependency: Tailwind v4 + Astro Vite pin.** neutronium warns `@tailwindcss/vite` can pull a second Vite and break `astro check`; pin `overrides.vite` to Astro's Vite. `--duration-*` generates no utility — use a `.transition-token` utility class.
- **Dependency: Node/npm toolchain** must be available for `astro check`/dev.

## 5. Recommended Approach

Primary: Build a conventional Astro islands app. (a) Scaffold Astro + `@astrojs/solid-js` + TypeScript + Tailwind v4 with the Vite pin. (b) Port sacred `global.css`/`global-fonts.css` into a token layer (`src/styles/tokens.css`) and add an **ink-on-paper theme**: override `--theme-background` to parchment, `--theme-text` to sepia ink, keep `--font-family-mono: Mekzantine`, map tokens into `@theme` so Tailwind utilities stay token-driven. (c) Write a `SUMMARY.md` parser (`.ts`, pure, unit-tested) producing a nested nav model. (d) Port a minimal component set: `SidebarLayout`/`ContentFluid` (`.astro`, static), `TreeView`/`Navigation` for the TOC (Solid island only if it needs collapse interactivity, else `.astro`), and content primitives (`Text`, `CodeBlock`, `Divider`) as styling for rendered Markdown. (e) Ship a sample bundled mdBook and one route that renders a chapter end to end.

Alternative considered: iframe/proxy mdBook's compiled HTML with an ink-on-paper CSS overlay — rejected in the intent (fights mdBook's theme, forfeits sacred structure, breaks the token re-skin).

Rationale: keeps the chapter body static/zero-JS (Astro's strength for a reader), makes the aesthetic a pure token override (sacred's design and neutronium both demand token-first), and honors Mekzantine as the native default rather than a bolt-on. Porting a *small* subset controls the React→Solid risk while proving the whole pipeline (parse → nav → render → theme) in one PR.

## Artifacts
- `docs/intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md` — the durable project intent created this sprint.
- Captured upstream references (not committed): sacred `global.css` token map, `global-fonts.css` (Mekzantine), the `components/` catalog listing, and the "same-conventions" porting skill — all cited above with URLs for the Plan phase to pull exact prop/token details from `components/AGENTS.md`.
