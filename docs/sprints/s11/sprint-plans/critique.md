# Plan Critique — Sprint 11

## Concerns

### C-001: The gate's "an `/_astro/` asset is present" assertion doesn't isolate the *parent* image
- **Where:** `build-plan.md` T-209 Notes; `test-plan.md` `check_live_reload`.
- **Quote:** "additionally asserts the served `/first` includes an optimized `/_astro/` asset (parent image resolved)".
- **Failure mode:** plan-test-mismatch (weak assertion)
- **Why it matters:** the handbook `first.md` also has an **in-source** image (`plate.svg`) that already emits an `/_astro/` asset, so "any `/_astro/` present" could pass even if the parent image were broken. (In practice `ImageNotFound` 500s the whole page so the marker check would also fail — but the assertion should still target the parent image to prove criterion 4 directly.)
- **Suggested response:** fix-in-plan — the gate asserts the served page references a **parent-plate-derived** `/_astro/` asset (the same `parent-plate.<hash>` shape `check_external_build` asserts at build), not merely any `/_astro/` asset.

### C-002: T-208 attaches to a realized intent (INT-0001)
- **Where:** `build-plan.md` T-208 (`state: realized (regression provenance)`).
- **Quote:** "INT-0001 … state: realized (regression provenance only)".
- **Failure mode:** intent-drift
- **Why it matters:** a build task normally advances a `planned`/`active` intent; linking a realized one could look like reopening it.
- **Suggested response:** reject — this is the established regression-provenance pattern (Sprints 7–9 listed realized intents as unchanged provenance). T-208 hardens an existing E2E's determinism; it does not change INT-0001's acceptance criteria, so the intent correctly stays `realized` with no state churn. The primary sprint intent (INT-0009) is the one advancing.

### C-003: `check_live_reload` is timing-based (flake surface)
- **Where:** `test-plan.md` `check_live_reload` (dev server + HMR + polling).
- **Quote:** "polls until the reader reflects the edit".
- **Failure mode:** flake-risk
- **Why it matters:** dev-server + file-watch + HMR gates can be timing-sensitive.
- **Suggested response:** defer-with-rationale — this is the very gate being repaired; the fix makes the synced chapter render (removing the deterministic *failure*), and the gate already uses generous poll windows (60s up, 25s for the edit) with a `finally` that restores state. It stays a **local** gate (not CI), as designed since Sprint 5.

## Confidence
proceed-with-caveats
