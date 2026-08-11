# Sprint 3 Research Report

## Intents Reviewed
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — selected; relevance: this sprint delivers criterion 1 (relative-image fidelity) and hardens delivery; current state: `proposed` (→ `planned` in Plan). No criteria change. Criteria 2 (multi-book) and 3 (live reload) remain for later sprints, so INT-0003 stays `active` after this sprint.
- [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) — selected (realized); this sprint hardens its CI verification (backlog T-203: run the external-build gate in CI + actions hygiene). Its acceptance criteria are unchanged and already met; no state change.

## 1. Sprint Goal

Two bounded pieces. (a) **Relative-image fidelity** (INT-0003 criterion 1): prove
and lock that an external chapter's relative image (`![](./img/plate.svg)`)
renders. A spike shows this **already works** — Astro's image service optimizes
relative images in the copied chapters — so the work is a committed fixture image
plus a scripted build gate, not new rendering code. (b) **CI hardening** (INT-0002
backlog T-203): run the external-build gate in CI, bump the GitHub Actions off the
deprecated Node-20 runtime, and fix the empty Playwright-report artifact.

## 2. Existing Code Survey

| File | Relevance | Notes |
|------|-----------|-------|
| `scripts/load-book.mjs` | high | Copies the external book's `<src>` tree (incl. images) into `src/content/book/`. Because images land under `src/`, Astro optimizes relative refs automatically — no change expected. |
| `src/pages/[...slug].astro` | med | Renders chapters via `import.meta.glob(...).Content`; the spike confirms relative images inside these compile to optimized `/_astro/…` assets. |
| `fixtures/handbook/**` | high | The Sprint 2 fixture; gains a relative image + a chapter that references it. |
| `.github/workflows/ci.yml` | high | Uses `actions/checkout@v4`, `setup-node@v4`, `upload-artifact@v4` (Node-20 deprecation warnings); uploads `playwright-report/` which the `list` reporter never creates. Gains the external-build gate step + version bumps. |
| `playwright.config.ts` | med | `reporter: 'list'` — add an `html` reporter so the artifact exists (or drop the upload). |
| `src/lib/__tests__/ci-workflow.test.ts` | med | Extend to assert the new gate step + non-deprecated action versions. |

## 3. External Sources

- **Spike (this sprint, internal):** built a throwaway external book with `![a plate](./img/plate.svg)` under `TOME_BOOK`. Result: the page rendered `<img src="/_astro/plate.<hash>.svg" … width=120 height=60 loading=lazy>` and the asset was emitted to `dist/_astro/`. Relative external images render **as optimized assets with no extra code**.
- [Astro — Images in Markdown](https://docs.astro.build/en/guides/images/) — confirms: relative images in `src/` Markdown are processed/optimized and content-hashed at build; images in `public/` are served as-is (why the sample's absolute `/images/…` path also works, unoptimized). This is exactly the copy-into-`src` path `load-book.mjs` uses.
- [GitHub Actions — Node 20 deprecation](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/) — `actions/*@v4` target Node 20 and are force-run on Node 24 with a warning; the `@v5` majors target Node 24. Motivates the actions bump (the exact warning observed on CI runs 31500420717 / 31505932930).

## 4. Risks, Unknowns, Dependencies

- **Risk (low): relative-image edge cases.** Parent-relative (`../assets/x.png`) or deeply nested images. Mitigation: the fixture exercises a nested `./img/` case (the common one); document parent-relative as a follow-up if it misbehaves.
- **Risk: CI external gate vs. the sample E2E in one job.** The external build overwrites `src/content/book/`. Mitigation: run the gate **after** the Playwright (sample) step, and have the gate restore `src/content/book` (`git checkout` + `git clean`) so order-independence holds locally; in CI the runner is ephemeral.
- **Risk: actions `@v5` behavior drift.** Bumping majors could change defaults. Mitigation: `checkout`/`setup-node`/`upload-artifact` v5 are drop-in for our usage; the CI run itself verifies green.
- **Dependency:** `git` available in CI for the gate's restore (it is, via `actions/checkout`).

## 5. Recommended Approach

Primary: (a) Add `fixtures/handbook/src/img/plate.svg` and reference it from a
fixture chapter; formalize the Sprint 2 ad-hoc `gate_external_build` as
`scripts/check-external-build.mjs` — build with `TOME_BOOK=fixtures/handbook`,
assert the fixture routes replace the sample **and** the relative image renders as
an `/_astro/…` asset, then restore `src/content/book`. (b) Wire that script as a
CI step; bump `actions/*@v4 → @v5`; add an `html` Playwright reporter so the
uploaded artifact exists; extend `test_ci_workflow_valid`.

Alternative considered: a rehype plugin to rewrite relative image `src`. Rejected
— the spike proves Astro already resolves and optimizes them; a plugin would be
redundant and bypass the optimizer.

Rationale: turns a proven-by-spike behavior into committed regression coverage
with essentially no production code, and closes the two CI gaps flagged in the
Sprint 2 report — small, low-risk, high-confidence.

## Artifacts
- Spike evidence (above): the emitted `<img src="/_astro/plate.<hash>.svg">` and `dist/_astro/plate.*.svg`.
- Reviewed intents: [INT-0003](../../../intents/INT-0003-richer-external-book-support.md), [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md).
