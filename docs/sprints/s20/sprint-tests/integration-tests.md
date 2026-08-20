# Sprint 20 — Integration Test Results

- **Tested implementation head:** `3830b71eb2c3cab0ce3aa3f4f25aa456cbfe8d9a`
- **Intent:** [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md)
- **Environment:** Windows 11, Node 24.12.0, Astro 7.2.0, Playwright 1.62.1

## Astro and component integration

| Gate | Result |
|---|---|
| `npm run check` | **pass** — 67 files, 0 errors, 0 warnings, 0 hints |
| `npm test` | **pass** — 20 files, 97/97 tests |
| `npm run check:electron` | **pass** — production build plus Electron 6/6 |

Astro parsed the new `BookLayout` wrapper and shared-search CSS without a
diagnostic. The build still emitted the existing upstream markdown-plugin
deprecation log, which is not an Astro diagnostic and is unrelated to this
intent. Electron loaded the same built responsive surface offline and retained
its search index, security, theme icon, zoom lock, and external-link contracts.

## Build and fixture integration

All content-mutating gates ran serially and left `src/content/books` identical to
HEAD afterward.

| Gate | Result |
|---|---|
| `npm run check:external` | **pass on retry** — handbook Chromium 3/3, docs-layout book built, default rebuilt |
| `npm run check:multibook` | **pass** — two-tome Bibliotheca, namespaced routes, switcher, default rebuild |
| `npm run check:search` | **pass** — single-/two-tome indexes and queries, default rebuild |

The first exact-head external-gate attempt completed the handbook build and its
3/3 browser checks, then Windows returned a transient `EPERM` while replacing
the library for the docs-layout fixture. Its failure path restored the committed
library and left no server; the immediate whole-gate retry passed. No product or
fixture edit was needed.

## Local-only harness observation

`npm run check:livereload` was attempted as an extra regression gate even though
it is absent from Sprint 20's locked plan and hosted CI. The pre-existing harness
calls the never-returning `npm run dev` through synchronous `execSync`, so the
driver cannot reach its own HTTP polling assertions. The run was terminated,
the exact orphaned Node listener was stopped, and the temporary `book` fixture
was removed before any subsequent test. This is test-harness debt, not evidence
against INT-0019's static responsive geometry; no live-reload code changed in
Sprint 20.
