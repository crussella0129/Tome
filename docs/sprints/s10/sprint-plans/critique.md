# Plan Critique — Sprint 10

## Concerns

### C-001: Heading-slug parity must slug in document order including the H1, or deep links drift
- **Where:** `build-plan.md` T-023 notes; `test-plan.md` `test_search_index_heading_slugs`.
- **Quote:** "a fresh slugger per chapter, matching Astro's per-page dedupe".
- **Failure mode:** hidden-dep
- **Why it matters:** Astro runs github-slugger over **every** heading on the page in render order — starting with the chapter's H1 title — and dedupes by appending `-1`, `-2`. If the index sluggers only the H2/H3s, or in a different order, a chapter with two identically-named headings (or a heading matching the title) produces an anchor that does not exist in the built page, and the result link 404s to a missing fragment.
- **Suggested response:** fix-in-plan — state in T-023 that the builder feeds headings to one slugger **in document order, including the H1**, and that the parity test includes a duplicate-heading case asserting `-1` suffixing matches the built `id`.

### C-002: Escape's "restore focus to the trigger" promise has no named test
- **Where:** `build-plan.md` T-024 EARS clause 1 vs. `test-plan.md` T-024 tests.
- **Quote:** "**WHEN** `Escape` is pressed, **THEN** the overlay **SHALL** close and restore focus to the trigger."
- **Failure mode:** plan-test-mismatch
- **Why it matters:** focus restoration is an accessibility promise in the EARS clause (criterion 4), but `test_search_overlay_escape_closes` as written only asserts the dialog closes — the clause would be unverified.
- **Suggested response:** fix-in-plan — extend `test_search_overlay_escape_closes` to assert focus returns to the trigger after `Escape`.

### C-003: T-023 bundles the index builder and the scorer in one task
- **Where:** `build-plan.md` T-023 (`search-index.ts` + `search.ts`).
- **Quote:** "Build-time search index + pure scorer".
- **Failure mode:** granularity
- **Why it matters:** indexing (produce records) and searching (rank a query) are arguably separable concerns.
- **Suggested response:** reject — they form one coherent, dependency-free "search core": they share the `SearchRecord` type, T-024 needs both, and each is verified by its own distinct named tests (`search-index.*` vs `search.*`). Splitting would add a task boundary with no independently shippable value. (Consistent with prior sprints bundling a model + its routing.)

### C-004: "Zero-JS-by-default" has no explicit verification
- **Where:** `build-plan.md` T-024 (one `client:idle` island) vs. the test plan.
- **Quote:** "one `client:idle` island … fetches … on first open (lazy)".
- **Failure mode:** missing-risk
- **Why it matters:** the intent (criterion 4) promises the page ships no search JS until the island hydrates and the index loads on demand; no test asserts the index is not inlined into page HTML.
- **Suggested response:** defer-with-rationale — the mechanism (a single `client:idle` island + an on-open `fetch`) is the guarantee, the neutronium audit enforces island idioms, and `check_search` asserts the index is a **separate** `dist/search-index.json` artifact (i.e. not inlined). A bundle-weight assertion is disproportionate for this cut.

## Confidence
proceed-with-caveats
