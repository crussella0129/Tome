# Completed Tasks Log (Append-Only)

## T-001 (sprint 0)
- **Description:** Scaffold Astro + SolidJS + TypeScript + Tailwind v4 with the Vite pin
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T03:44:24Z
- **Files modified:** package.json, package-lock.json, astro.config.mjs, tsconfig.json, src/env.d.ts, src/pages/index.astro, vitest.config.ts, vitest.setup.ts, playwright.config.ts, .gitignore
- **EARS verified:** `astro check` → 0 errors; `astro build` → static build, no duplicate-Vite plugin error.
- **Commit:** `1f6ff8fd6b5b83514588667193de7b7f6b11342b`

## T-002 (sprint 0)
- **Description:** Ink-on-paper + warm-dark token/theme layer (subtle texture)
- **Intent:** [INT-0001](../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- **Completed:** 2026-08-11T03:51:09Z
- **Files modified:** src/styles/tokens.css, src/styles/theme.ts, src/styles/fonts.css, src/styles/paper.css, src/styles/prose.css, src/styles/__tests__/contrast.test.ts
- **EARS verified:** clause 1 (contrast ≥ AA both themes) — `test_ink_on_paper_contrast_aa` green (5/5); clause 2 (no raw-value violations) — neutronium `audit.sh` passed. Clauses 3–4 (theme-active) verified via E2E in the Test Phase. Tailwind compile of `@theme` confirmed (parchment token emitted).
- **Commit:** `db253fefebe4019cd745dd1b1a3b7b6bfb391820`
