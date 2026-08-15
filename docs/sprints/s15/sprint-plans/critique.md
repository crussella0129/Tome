# Plan Critique — Sprint 15

## Concerns

### C-001: the zoom-lock E2E (T-034) can break once T-036 flips the default to multi-tome
- **Where:** `build-plan.md` T-034 / `test-plan.md` `test_electron_zoom_locked`
- **Quote:** original — "the layout stays desktop (side-by-side)"
- **Failure mode:** hidden-dep
- **Why it matters:** T-034 lands before T-036. A layout-mode assertion on `/` is valid while `/` is a chapter, but T-036 makes `/` the Bibliotheca (a centered shelf with no sidebar), so the same assertion would later fail — an order-dependent trap.
- **Suggested response:** fix-in-plan — **addressed.** T-034 now asserts `getZoomFactor()` stays 1 **page-agnostically**, and any non-collapse layout check runs on a **chapter** page reached by navigation (which has the sidebar layout in both single- and multi-tome modes).

### C-002: T-036 bundles content + book.meta + migration of three E2E specs
- **Where:** `build-plan.md` T-036
- **Quote:** "Migrate the affected E2E in this same task so no commit boundary is left red"
- **Failure mode:** granularity
- **Why it matters:** one task touches new content, a meta file, and reader/search/electron specs.
- **Suggested response:** defer-with-rationale — the E2E migration is **inseparable** from the content change: adding the second tome flips `/` to the Bibliotheca, which immediately invalidates the specs that open `/` expecting a chapter. Splitting them would leave a red commit boundary (a Build-Phase violation). The task is one coherent outcome — "the default is a navigable 2-tome library, proven" — so it stays whole.

### C-003: a standalone single-tome spec duplicates the existing `check:external` gate
- **Where:** `test-plan.md` (was) `test_reader_single_tome_root`
- **Quote:** original — "a `TOME_BOOK=<fixture>` build keeps `/` as the tome's entry chapter"
- **Failure mode:** plan-test-mismatch (redundant coverage / extra build harness)
- **Why it matters:** a new single-tome spec needs its own build mode (a second webServer/config), and `check-external-build.mjs` **already** builds one external tome and asserts root routes + absence of the Bibliotheca.
- **Suggested response:** fix-in-plan — **addressed.** Single-tome coverage (INT-0014 #2) is delegated to the existing `check:external` gate; T-036 confirms it still passes rather than adding a redundant spec.

## Confidence
proceed-with-caveats
