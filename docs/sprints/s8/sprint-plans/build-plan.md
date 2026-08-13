Finalized - DO NOT EDIT

# Sprint 8 Build Plan

## Intents

- [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) — state: planned; acceptance criteria covered: 1–3.
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — state: realized; provenance only, with no acceptance or lifecycle change.

## Schema Tree

- Browser-verified external books
  - T-205: Join the external fixture build gate to an isolated Chromium verification mode

## Execution Sequence

### T-205: Join the external fixture build gate to an isolated Chromium verification mode
- **Intent:** [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md)
- **Touches:** `e2e/external-book.spec.ts`, `playwright.config.ts`, `scripts/check-external-build.mjs`
- **Depends on:** existing handbook fixture, `scripts/serve-dist.mjs`, and Chromium installed by the current CI workflow; no new package or CI step.
- **Acceptance criterion:** INT-0006 criteria 1–3: prove fixture-specific external reader content and image delivery in Chromium, isolate that mode from the bundled-reader suite/report, and execute it through the restoring external build gate in CI.
- **Success criterion (EARS):**
  - **WHEN** isolated external-book mode serves the prebuilt handbook and opens `/first`, **THEN** Chromium **SHALL** show the fixture's `First Chapter` content and active navigation while exposing no bundled-sample `Getting Started` navigation.
  - **WHEN** Chromium renders the handbook's chapter-relative sacred plate, **THEN** the image **SHALL** be visible, decoded (`complete` with positive `naturalWidth`), and styled with a positive prose border width.
  - **WHEN** Playwright is invoked normally or in external-book mode, **THEN** configuration **SHALL** select only the matching spec, use distinct serving state, avoid rebuilding the prebuilt external `dist/`, and prevent the external invocation from replacing the ordinary HTML report.
  - **WHEN** the handbook case reaches browser verification or that verification fails, **THEN** `check-external-build.mjs` **SHALL** run it serially before restoration, propagate failure, and restore the committed sample content; the existing hosted `External book build gate` **SHALL** complete successfully when all assertions pass.
  - **WHEN** the T-205 change set is verified locally, **THEN** the canonical Vitest suite and Astro check **SHALL** pass without unrelated application or workflow-contract regression.
- **Notes:** Use an environment flag passed through Node's child-process `env`, not POSIX-only inline assignment. Reuse the existing foreground static server. Keep the default Playwright command, port, HTML reporter, and ordinary reader behavior unchanged. Do not modify application source, fixtures, packages, action pins, or CI gate ordering.
