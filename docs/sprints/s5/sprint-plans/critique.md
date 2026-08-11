# Plan Critique — Sprint 5

## Concerns

### C-001: `check-live-reload.mjs` runs `dev` (which overwrites `src/content/book/`) but the cleanup isn't specified
- **Where:** `build-plan.md` T-018 Notes / `test-plan.md` `check_live_reload`.
- **Quote:** "starts `TOME_BOOK=<temp> astro dev` … then stops `astro dev` and cleans up".
- **Failure mode:** hidden-dep
- **Why it matters:** starting `dev` with `TOME_BOOK` set runs `predev` (`load-book`), which **overwrites `src/content/book/`** with the temp book. If the gate doesn't restore it (and stop the daemonized dev server), it leaves the tree dirty / the dev daemon running — like the Sprint 3/4 gate hazard.
- **Suggested response:** fix-in-plan — `check-live-reload.mjs` must, in a `finally`, run `astro dev stop`, restore `src/content/book/` to HEAD (`git checkout` + `git clean`), and remove the temp book — on success, failure, and timeout. State this in T-018.

### C-002: The criterion-3 end-to-end proof runs locally only, not in CI
- **Where:** `test-plan.md` `check_live_reload` ("Not in CI").
- **Quote:** "a dev-server + timing check, deliberately out of the flaky CI path".
- **Failure mode:** e2e-cop-out
- **Why it matters:** criterion 3's only *end-to-end* verification is a local gate; CI proves the pieces (`syncPath`, `resolveBookSource`) but not the live loop.
- **Suggested response:** defer-with-rationale — a dev-server + file-timing test is genuinely flaky in CI; the spike already proved the underlying mechanism, `syncPath` + `resolveBookSource` run in CI, and the local gate + a documented manual check (CubiKan) cover the loop. CI-ifying it is possible follow-up but not worth the flake now.

## Confidence
proceed-with-caveats
