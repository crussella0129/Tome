# Test Critique — Sprint 11

## Concerns

### C-001: `check_live_reload` remains a dev-server + timing gate (local, not CI)
- **Where:** `integration-tests.md` `check_live_reload`.
- **Quote:** "polls until … the reader reflects the edit … and the served page references the tome-private … asset".
- **Failure mode:** flake-risk
- **Why it matters:** dev-server + file-watch + HMR + polling gates can be timing-sensitive, and this one is not run in CI, so a regression could slip past the PR's automated checks.
- **Suggested response:** defer-with-rationale — the gate has been local by design since Sprint 5 (a dev-server timing check is genuinely flaky in CI); its **failure mode was deterministic** (an un-rewritten `../assets/…` always 500s) and is now deterministically fixed (the page renders); it uses generous poll windows (60s up, 25s for the edit) with a `finally` that restores state, and it passed green on repeated runs this sprint. The unit tests (`prepareChapterParentAssets`) run in CI and cover the rewrite/containment contract the gate exercises end to end.

### C-002: No explicit build-vs-live rewrite *parity* assertion
- **Where:** `unit-tests.md` — `test_prepare_chapter_rewrites_parent_asset` vs. the build test `test_prepare_parent_asset_rewrites_root_and_nested`.
- **Quote:** "rewrites the URL to `./__tome_parent_assets__/assets/plate.svg` … matching the build path's rewrite".
- **Failure mode:** weak-assertion
- **Why it matters:** criterion 1 says the live rewrite is "byte-identical to the build path"; the two tests assert against separate expected strings rather than asserting the two paths agree on one input.
- **Suggested response:** reject — the two paths call the **same** internal `rewriteChapterAssets`, so the rewrite is identical by construction (the refactor is extract-only, and the build path's own tests are unchanged and green). The `check_live_reload` gate independently proves the live rewrite yields a URL Astro resolves to the same tome-private asset the build path emits. A dedicated cross-path parity test would duplicate the shared implementation without adding coverage.

## Confidence
proceed-with-caveats
