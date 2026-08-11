# Plan Critique — Sprint 3

## Concerns

### C-001: T-014 bundles CI hygiene that maps only loosely to an acceptance criterion
- **Where:** `build-plan.md` T-014 / `test-plan.md` criterion-1 rows.
- **Quote:** "CI actions/artifact hygiene (delivery)".
- **Failure mode:** intent-drift
- **Why it matters:** running `check-external-build` in CI genuinely verifies INT-0003 criterion 1 remotely, but the actions `@v5` bump and the artifact fix are generic workflow maintenance, not an acceptance-criterion capability — mapping them to "criterion 1" is a stretch.
- **Suggested response:** fix-in-plan (framing) — treat the hygiene as **delivery maintenance riding along with the single coherent `ci.yml` edit** that adds the gate (one file, one diff), explicitly not a new capability. It closes INT-0002 backlog T-203 without re-advancing that realized intent. Splitting a three-line workflow tidy into its own task would be worse granularity.

### C-002: The external gate restores `src/content/book/` via git — assumes a clean tree
- **Where:** `build-plan.md` T-013 (`scripts/check-external-build.mjs`).
- **Quote:** "restore `src/content/book/` (`git checkout` + `git clean`)".
- **Failure mode:** hidden-dep
- **Why it matters:** the gate overwrites the sample dir and restores it to HEAD; if a developer has **uncommitted** edits under `src/content/book/`, the restore would discard them.
- **Suggested response:** fix-in-plan — document that the gate restores `src/content/book/` to HEAD and is intended to run on a clean tree (CI always is; the same property held for the Sprint 2 ad-hoc gate). Note it in T-013 and in the script's header.

## Confidence
proceed-with-caveats
