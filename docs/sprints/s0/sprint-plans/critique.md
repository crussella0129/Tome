# Plan Critique — Sprint 0

## Concerns

### C-001: Integration test asserts draft-exclusion not named in any EARS clause
- **Where:** `test-plan.md` → Integration → `test_book_routes_generated`, and its traceability row (`1→2 | integration`).
- **Quote:** "assert `[...slug].astro`'s `getStaticPaths` yields exactly one route per **non-draft** chapter (draft entries produce no route)".
- **Failure mode:** plan-test-mismatch
- **Why it matters:** Every planned test must trace to a build clause. The "drafts produce no route" behavior is composed from T-003 clause 4 (draft → no href) and T-005 clause 1 (a requested chapter route renders), but no single clause states route-generation excludes drafts, so the test's mapping is implicit.
- **Suggested response:** fix-in-plan — annotate the integration test to name the two clauses it composes (T-003/E4 + T-005/E1); an integration test that composes tasks is legitimate per the test-plan schema.

### C-002: `src/styles/prose.css` is a touched path of two tasks
- **Where:** `build-plan.md` → T-002 Touches and T-005 Touches.
- **Quote:** T-002 lists "`src/styles/prose.css`" and T-005 also lists "`src/styles/prose.css`".
- **Failure mode:** hidden-dep
- **Why it matters:** The same file authored by two tasks creates an ordering/shared-state coupling the dependency edges don't make explicit; two diffs to one file can collide or reorder.
- **Suggested response:** fix-in-plan — assign `prose.css` ownership to T-002 (the style/token layer); T-005 only *consumes* it. Remove `prose.css` from T-005's Touches.

### C-003: Locked design decisions live only in the plan, not the stable intent
- **Where:** `build-plan.md` Context ("Locked design decisions") vs. `docs/intents/INT-0001-*.md`.
- **Quote:** "Ship two themes: `theme-ink-paper` (default light) and `theme-terminal-dark` (warm dark)" and "subtle-texture parchment … faint SVG paper grain + soft edge vignette".
- **Failure mode:** intent-drift
- **Why it matters:** Intent chapters are the semantic authority. The subtle-texture treatment and the dual paper+warm-dark theme commitment are consequences that shape acceptance yet exist only in sprint prose; a future sprint reading only the intent would miss them.
- **Suggested response:** fix-in-plan (amend intent first) — record the subtle-texture treatment and the two-theme decision in INT-0001's Intent/Consequences and append a Transition-history note.

## Confidence
proceed-with-caveats
