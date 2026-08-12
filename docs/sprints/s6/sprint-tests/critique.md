# Test Critique — Sprint 6

## Concerns

### C-001: The multi-tome view is gated at build level, not in a real browser
- **Where:** `integration-tests.md` `check_multibook` (asserts generated HTML) vs.
  INT-0003 criterion 2 (a reader *switches* between books).
- **Quote:** "The multi-tome shape has no automated E2E."
- **Failure mode:** e2e-cop-out
- **Why it matters:** `check_multibook` proves the routes, the Bibliotheca listing,
  and the switcher markup exist in the built HTML, but not that a user can click
  through them in a browser; the click-through was verified manually.
- **Suggested response:** defer-with-rationale — the build gate covers the load →
  route → render → switcher-markup chain (the parts that could regress), runs in
  CI, and the interaction was reviewed manually in both themes. A headless
  multi-tome click-through is a natural extension of the already-planned
  external-book browser E2E (backlog **T-205**); folding multi-tome navigation in
  there is the right home, not a new bespoke gate now.

### C-002: A residual E2E hydration flake ships unfixed
- **Where:** `e2e-tests.md` note; `test_dark_theme_active` / `test_paper_theme_active`.
- **Quote:** "intermittently flake under the 8-worker parallel run".
- **Failure mode:** flaky-gate
- **Why it matters:** a `client:idle` race (click before the sidebar island
  hydrates) can redden CI intermittently, unrelated to the change under test.
- **Suggested response:** defer-with-rationale — the flake predates this sprint
  and is orthogonal to multi-book; it cleared on isolated + full re-run. Filed as
  **T-208** (await hydration before the toggle click) to fix at the source rather
  than paper over with a retry.

### C-003: CI runtime confirmation is at the checkpoint, not the test phase
- **Where:** the standard CI-observed-at-PR pattern.
- **Failure mode:** evidence-drift
- **Why it matters:** the PR's CI run is the reproducible conclusion; it is
  observed after the sprint closes.
- **Suggested response:** defer-with-rationale — inherent to CI; recorded at the
  checkpoint. Every CI-run gate (including the new multi-book gate) is green
  locally at the tip of `dev`.

## Confidence
proceed-with-caveats
