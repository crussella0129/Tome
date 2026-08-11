# Test Critique — Sprint 2

## Concerns

### C-001: The full external build is proven locally, not in CI; no external browser E2E
- **Where:** `integration-tests.md` `gate_external_build` and `e2e-tests.md` status vs. INT-0002 criteria 1–2.
- **Quote:** "this full external build runs **locally**".
- **Failure mode:** e2e-cop-out
- **Why it matters:** CI runs the sample build + the loader/path unit+integration tests, but not the full `TOME_BOOK` build, and no browser test loads an external book — so the external end-to-end render is not exercised in CI or in a headless browser.
- **Suggested response:** defer-with-rationale — the render pipeline for an external book is **identical** to the sample's (the only difference is which files sit under `src/content/book/`, which the CI-run `test_load_book_external` + `gate_external_build` verify), and the sample has full browser E2E. Adding `gate_external_build` as a CI step (built to a separate dir so it doesn't disturb the sample E2E) is reasonable follow-up, recorded as debt.

### C-002: Relative-image fidelity in external chapters is unverified
- **Where:** INT-0002 non-goal/consequence vs. the fixture (which has no relative image).
- **Quote:** the fixture exercises headings/lists/code/nesting but no `![](./img.png)`.
- **Failure mode:** negative-path
- **Why it matters:** external mdBooks commonly use chapter-relative images; the loader copies assets, but Astro's relative-image handling for copied files is untested.
- **Suggested response:** defer-with-rationale — explicitly out of this slice's scope (INT-0002 lists relative-image fidelity as a possible follow-up); assets are copied so absolute-path images work, and this is recorded as debt for the next external-book sprint.

## Confidence
proceed-with-caveats
