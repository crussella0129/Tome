Finalized - DO NOT EDIT

# Sprint 2 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 1 — resolve external SUMMARY + render | T-010 / WHEN TOME_BOOK valid THEN populate book/ + meta title | `test_load_book_external` |
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 4 — sample fallback when unconfigured | T-010 / WHEN TOME_BOOK unset THEN no changes | `test_load_book_noop_when_unset` |
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 3 — clear error on invalid book | T-010 / WHEN path lacks src/SUMMARY.md THEN clear error + non-zero exit | `test_load_book_errors_on_invalid` |
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 1 — real book title | T-011 / WHEN meta title present THEN bookToc().title is it | `test_book_title_from_meta` |
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 2 — nested / README links resolve | T-011 / WHEN href nested or folder README THEN slug maps correctly | `test_paths_nested_and_readme` |
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 2 — no route escapes the book | T-011 / WHEN href escapes root THEN slug not `..`-prefixed | `test_paths_reject_traversal` |
| [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) | 1/2/4 — external book renders end to end | T-012 / WHEN built with TOME_BOOK=fixture THEN fixture routes present, sample absent | `gate_external_build` |

## Unit Tests

### T-011 unit tests
- **Intent:** [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md)
- `test_book_title_from_meta` (`src/lib/__tests__/book.test.ts`): with a `book.meta.json` title, `bookToc().title` equals it; when meta title is empty/absent, it falls back to the SUMMARY first heading. (T-011 clause 1)
- `test_paths_nested_and_readme` (`src/lib/__tests__/paths.test.ts`): `hrefToSlug('a/b.md') === 'a/b'`; `hrefToSlug('a/README.md') === 'a'`; `hrefToSlug('README.md') === ''`. (T-011 clause 2)
- `test_paths_reject_traversal` (`src/lib/__tests__/paths.test.ts`): `hrefToSlug('../secret.md')` yields a slug that does not begin with `..` (escape neutralized). (T-011 clause 3)

## Integration Tests

### Loader behaviour (`src/lib/__tests__/load-book.test.ts`)
- **Intents:** [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md)
- `test_load_book_external`: run `load-book.mjs` (child process) with `TOME_BOOK=fixtures/handbook` against a temp copy of `src/content/book/` → the fixture's `SUMMARY.md`/chapters land in `book/` and `book.meta.json.title` equals the fixture's `book.toml` title. Restores the sample afterwards. (T-010 clause 1)
- `test_load_book_noop_when_unset`: run with `TOME_BOOK` unset → `book/` is byte-for-byte unchanged. (T-010 clause 2)
- `test_load_book_errors_on_invalid`: run with `TOME_BOOK` = a path with no `src/SUMMARY.md` → non-zero exit and a stderr message naming the path. (T-010 clause 3)

## End-to-End Tests
- **Status:** possible — the existing Playwright suite runs against the **default sample** build and must stay green (criterion 4, no regression). A browser E2E of an external book requires build-time env plumbing and is **deferred** to a follow-up; the external render is covered at build level by `gate_external_build`.

### Gates
- `gate_external_build`: `TOME_BOOK=fixtures/handbook npm run build` → assert `dist/` contains a fixture-only chapter route and NOT a sample-only route (`/getting-started`), then restore the sample and rebuild default. (T-012 clause 1)
- `gate_astro_check`: `npx astro check` → 0 errors (default content).
- `gate_neutronium_audit`: `bash <neutronium>/scripts/audit.sh src/` → no violations.
- Regression: full `npx vitest run` and `npx playwright test` green on the default sample; CI green on the PR.
