Finalized - DO NOT EDIT

# Sprint 4 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) | 1 — auto-detect `docs/` source | T-015 / WHEN no book.toml + SUMMARY in docs/ THEN detect docs/ | `test_source_detect_docs` |
| [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) | 2 — honor `book.toml` src | T-015 / WHEN book.toml declares src THEN use it | `test_source_honor_book_toml_src` |
| [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) | 3 — title from directory name | T-015 / WHEN no book.toml title THEN meta title = root basename | `test_title_from_dirname` |
| [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) | 4 — enumerated error | T-015 / WHEN no SUMMARY anywhere THEN non-zero + list candidates | `test_source_none_errors` |
| [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) | 1/5 — docs-layout renders + regression | T-016 / WHEN built with TOME_BOOK=fixtures/docs-book THEN it renders (detecting docs/) | `check_external_build` |

## Integration Tests (`src/lib/__tests__/load-book.test.ts`, extended — run in CI via Vitest)
- **Intent:** [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md)
- `test_source_detect_docs`: a temp book root with **no** `book.toml` and `docs/SUMMARY.md` (+ a chapter) → `load-book.mjs --dest <tmp>` populates the dest from `docs/`. (T-015 clause 1)
- `test_source_honor_book_toml_src`: a temp root with `book.toml` `src = "guide"` and `guide/SUMMARY.md` → the loader uses `guide/` (not `src`/`docs`). (T-015 clause 2)
- `test_title_from_dirname`: a temp root named `MyBook` with no `book.toml` title → `book.meta.json.title === "MyBook"`. (T-015 clause 3)
- `test_source_none_errors`: a temp root with no `SUMMARY.md` in `src/`, `docs/`, or root → non-zero exit and stderr lists the candidate locations. (T-015 clause 4)
- (Retained) `test_load_book_external` / `_noop_when_unset` — the standard `fixtures/handbook` (book.toml + src) still loads, and the unset no-op holds (criterion 2/5 backward-compat).

## Gates / End-to-End
- `check_external_build` (extended): builds `TOME_BOOK=fixtures/handbook` (regression — standard layout) **and** `TOME_BOOK=fixtures/docs-book` (detection — no book.toml, docs/), asserting each renders a fixture route and restoring `src/content/book/` between/after. Covers T-016 EARS + criterion 5. Runs locally and in CI.
- `gate_astro_check`: `npx astro check` → 0 errors.
- `gate_neutronium_audit`: `bash <neutronium>/scripts/audit.sh src/` → no violations.
- Regression: full `npx vitest run` + `npx playwright test` (sample, 8/8) green; observed CI green on the PR.
