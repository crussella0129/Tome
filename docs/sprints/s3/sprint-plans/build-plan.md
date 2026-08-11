Finalized - DO NOT EDIT

# Sprint 3 Build Plan

## Intents
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — state: planned; acceptance criteria covered: 1 (relative-image fidelity) — delivered by T-013 and gated in CI by T-014. Criteria 2 (multi-book) and 3 (live reload) remain, so INT-0003 stays `active` after this sprint.
- (The `check-external-build` gate also protects the realized [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) external-loading behavior in CI, closing its Sprint 2 backlog item T-203, but INT-0002's state is unchanged — no realized intent is re-advanced.)

## Schema Tree
- Sprint Goal: prove relative-image fidelity and harden CI for external books
  - Fidelity
    - T-013: relative-image proof + scripted external-build gate
  - Delivery
    - T-014: CI hardening (external gate in CI + actions/artifact hygiene)

## Execution Sequence

### T-013: Prove relative-image fidelity + scripted external-build gate
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- **Touches:** `fixtures/handbook/src/img/plate.svg` (new), `fixtures/handbook/src/first.md` (reference the relative image), `scripts/check-external-build.mjs` (new), `package.json` (a `check:external` script)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0003 criterion 1 — a chapter referencing a relative image renders that image, sourced from the external book, styled by the sacred prose layer.
- **Success criterion (EARS):**
  - **WHEN** the app is built with `TOME_BOOK=fixtures/handbook`, **THEN** the fixture chapter's relative image (`./img/plate.svg`) **SHALL** render as an optimized `/_astro/…` asset (not a raw/relative `src`).
  - **WHEN** `scripts/check-external-build.mjs` runs, **THEN** it **SHALL** build with the fixture, assert the fixture routes replace the sample **and** the relative image resolves to an `/_astro/` asset, restore `src/content/book/` (`git checkout` + `git clean`), and exit non-zero on any failed assertion.
- **Notes:** formalizes the Sprint 2 ad-hoc `gate_external_build` as a reusable script. No production render code — Astro's image service already optimizes relative images in the copied chapters (spike-verified). **Per critique C-002**, the gate restores `src/content/book/` to HEAD (`git checkout` + `git clean`) and is intended to run on a clean tree (CI always is); the script's header documents this so uncommitted sample edits aren't silently discarded.

### T-014: CI hardening — external gate in CI + actions/artifact hygiene
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- **Touches:** `.github/workflows/ci.yml`, `playwright.config.ts`, `src/lib/__tests__/ci-workflow.test.ts`
- **Depends on:** T-013
- **Acceptance criterion:** INT-0003 criterion 1 — the relative-image (and external-loading) rendering delivered by T-013 is verified **remotely in CI**, not only locally; the workflow is also brought to a warning-free state (closing INT-0002 backlog T-203).
- **Success criterion (EARS):**
  - **WHEN** CI runs on a pull request to `main`, **THEN** it **SHALL** execute `scripts/check-external-build.mjs` (after the sample E2E step) so external + relative-image rendering is gated remotely.
  - **WHEN** CI runs, **THEN** its actions **SHALL** be non-deprecated majors (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact` at `@v5`) and the uploaded `playwright-report/` **SHALL** exist (a Playwright `html` reporter is added).
- **Notes:** the external gate runs **after** Playwright so it never disturbs the sample E2E build. `test_ci_workflow_valid` is extended to assert the new step and the `@v5` versions; the observed CI run on the checkpoint confirms the Node-20 and empty-artifact warnings are gone. **Per critique C-001**, the actions `@v5`/artifact hygiene rides along as delivery maintenance within the single coherent `ci.yml` edit that adds the gate (not a separate capability); it closes INT-0002 backlog T-203 without re-advancing that realized intent.
