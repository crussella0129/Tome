Finalized - DO NOT EDIT

# Sprint 17 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0016](../../../intents/INT-0016-showcase-readme.md) | 1 — brand banner in the display font, GitHub-safe | T-040 / WHEN `make-banner` runs … THEN a baked-in PNG at `docs/assets/banner.png` | the PNG exists + is non-empty; rendered inline for the user's sign-off |
| [INT-0016](../../../intents/INT-0016-showcase-readme.md) | 2 — current feature screenshots | T-041 / WHEN `make-shots` runs … THEN six feature PNGs of the 2-tome default | the six PNGs exist + depict each feature; rendered for the user |
| [INT-0016](../../../intents/INT-0016-showcase-readme.md) | 3 — polished showcase, valid links | T-042 / WHEN README renders … THEN hero + gallery + guide; every image resolves | `test_readme_assets_resolve` (every `docs/assets/...` reference exists on disk); rendered for sign-off |
| [INT-0016](../../../intents/INT-0016-showcase-readme.md) | 4 — reproducible banner + screenshot generators; no committed font binaries | T-040/T-041 | generators rerun clean; `git check-ignore` confirms no `.woff2` tracked |

## Unit Tests
- **Intent:** [INT-0016](../../../intents/INT-0016-showcase-readme.md)
- No sprint-specific unit tests beyond the README asset guard (see Integration Tests).

## Integration Tests
### README asset integrity (T-042)
- **Intent:** [INT-0016](../../../intents/INT-0016-showcase-readme.md)
- `test_readme_assets_resolve`: parse `README.md` for image/link references under `docs/assets/` and assert each path exists on disk (no broken images). This is the objective gate for criterion 3; the visual "finished" quality is a separate user sign-off.

### No-regression (spot-check)
- The sprint touches only `README.md`, `docs/assets/`, and `scripts/`. `npx vitest run`,
  `astro check`, `npm run check:electron`, `npm run test:e2e`, and the four `check:*`
  gates stay green (the web app, Electron shell, and Tauri spike are untouched).

## End-to-End Tests
- **Status:** possible (the screenshots ARE E2E captures of the built app)
- The six screenshots are produced by driving the served `dist/` with Playwright
  (`make-shots.mjs`), which exercises the real reader (routes, search hydration,
  theme toggle, rail). Their existence + content is the E2E evidence for criterion 2.
- The banner (T-040) is verified by its artifact (a non-empty PNG), not by a browser E2E.
