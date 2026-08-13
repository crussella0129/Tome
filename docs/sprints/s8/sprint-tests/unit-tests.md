# Sprint 8 Unit and Static Tests

- **Tested head:** `38ed51208d14aa3e3421542672054f092671de1d`
- **Task commit:** `4cb83b7` (`sprint-8: T-205 add external-book Chromium verification`)

## `test_playwright_mode_selection`

- Default `npx playwright test --list` → **8 tests in 1 file**, all from
  `reader.spec.ts`; `external-book.spec.ts` was absent.
- With `TOME_EXTERNAL_BOOK_E2E=1`, the same list command → **2 tests in 1
  file**, exactly `test_external_book_renders_in_browser` and
  `test_external_relative_image_loads` from `external-book.spec.ts`.
- Successful execution confirmed external mode served the prebuilt `dist/` on
  its dedicated port while the ordinary mode retained its build-first path.
  The report-isolation gate below proves the list-only external reporter did
  not replace the ordinary HTML report.

## Canonical unit regression gate

`npx vitest run` → **49 passed / 0 failed / 49 total** across **9 files**.
This includes the CI workflow contract that keeps the existing external build
gate in the hosted `verify` job.

## Static diagnostics

`npx astro check` → **0 errors / 0 warnings / 0 hints** across 36 files.
