Finalized - DO NOT EDIT

# Sprint 1 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 3 — Mekzantine served from Tome's own origin (no runtime CDN) | T-006 / WHEN `fonts.css` is inspected THEN every Mekzantine `src` SHALL be same-origin `/fonts/…` with no external host | `test_fonts_self_hosted` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 3 — font asset produced by the build | T-006 / WHEN `fetch-fonts.mjs` runs THEN it SHALL write the woff2 into `public/fonts/` | `gate_font_fetch` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 3 — graceful fallback | T-006 / WHEN the font asset is absent THEN `--font-family-mono` SHALL fall back to `monospace` | `test_font_fallback_present` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 5 — images render, sacred-styled | T-007 / WHEN a chapter with an image renders THEN it SHALL appear as a bordered `.tome-prose img` | `test_chapter_image_styled` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 6 — honour prefers-reduced-motion | T-008 / WHEN reduce is emulated THEN computed `transition-duration` SHALL be ≤ 1ms | `test_reduced_motion_honored` |
| [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) | 7 — gates enforced in CI | T-009 / WHEN a PR targets `main` (or push to `dev`) THEN CI SHALL run astro check + vitest + playwright and fail on red | `test_ci_workflow_valid` + observed PR run |

## Unit Tests

### T-006 unit tests (`src/styles/__tests__/fonts.test.ts`)
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- `test_fonts_self_hosted`: read `src/styles/fonts.css` → every `src: url(...)` points at `/fonts/` and no `@font-face` line contains `http://` or `https://`. (T-006 clause 1)
- `test_font_fallback_present`: read `src/styles/tokens.css` → `--font-family-mono` declaration includes `monospace`. (T-006 clause 3)

### T-009 unit tests (`src/lib/__tests__/ci-workflow.test.ts`)
- **Intent:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- `test_ci_workflow_valid`: read `.github/workflows/ci.yml` → it triggers on `pull_request` to `main` (and push to `dev`), and its steps include `astro check`, `vitest run`, and `playwright test`. (T-009 clause 1)

## Integration Tests
### Build-produced font asset
- **Intents:** [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md)
- `gate_font_fetch`: run `node scripts/fetch-fonts.mjs`, then assert the expected woff2 exists under `public/fonts/` and `npm run build` emits CSS whose Mekzantine `src` resolves to `/fonts/…`. Composes T-006 clauses 1–2 (script → build → shipped CSS).

## End-to-End Tests
- **Status:** possible (existing Playwright harness against the build).
- `test_chapter_image_styled`: navigate to the chapter with the image → the `.tome-prose img` is visible and its computed border width is > 0. (T-007 clause 1 · criterion 5)
- `test_reduced_motion_honored`: `emulateMedia({ reducedMotion: 'reduce' })`, load the reader → a token-transitioned interactive element (e.g. a sidebar link / theme button) reports computed `transition-duration` ≤ 1ms. (T-008 clause 1 · criterion 6)

### Gates
- `gate_astro_check`: `npx astro check` → 0 errors.
- `gate_neutronium_audit`: `bash <neutronium>/scripts/audit.sh src/` → no violations.
- `gate_font_fetch`: see Integration.
- Observed CI: the Sprint 1 `dev → main` PR runs `ci.yml`; its conclusion is recorded in the test report (T-009 clause 1 remote enforcement).
