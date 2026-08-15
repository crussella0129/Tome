# Sprint 14 — Unit Test Results

- **Tested head:** `da7af92de3ebadc65a31db47ecdccfc6bfc25da8`
- **Runner:** `npx vitest run` (canonical). **Result: 89 passed / 89 (17 files).**
- **Intent:** [INT-0012](../../intents/INT-0012-desktop-shell-electron.md)

## T-032 — `resolveDistPath` + `contentTypeFor` (`src/lib/__tests__/dist-resolve.test.ts`)

Proves the pure resolver that both `serve-dist.mjs` and the Electron `app://`
protocol handler use to map root-absolute request paths onto `dist/`.

| Test | EARS clause (build-plan T-032) | Arrangement → assertion | Result |
|------|-------------------------------|--------------------------|--------|
| `test_resolve_root_index` | WHEN root `"/"` … THEN `<distRoot>/index.html` | `'/'` and `''` → `join(DIST,'index.html')` | pass |
| `test_resolve_route_index` | WHEN extensionless route … THEN dir `index.html` | `/getting-started`, `/components/panels`, trailing-slash → each route's `index.html` | pass |
| `test_resolve_asset_passthrough` | WHEN extensioned asset … THEN file passthrough, query/hash ignored | `/_astro/app.js`, `/fonts/…woff2`, `/search-index.json?v=1`, `…#top` → the file path, query/hash stripped | pass |
| `test_resolve_escape_null` | WHEN path escapes `distRoot` … THEN `null` | `/../secret`, `/a/../../etc/passwd`, `/../../..`, malformed `/%ZZ` → `null` | pass |
| (encoded-space case) | criterion 1 — assets with spaces stay in dist | `/my%20image.png` → `join(DIST,'my image.png')` | pass |
| `contentTypeFor` cases | criterion 1 — correct content-types | `.html/.js/.json/.woff2` mapped; unknown → `application/octet-stream` | pass |

Covers INT-0012 **criterion 1** (route/asset mapping) and the protocol-scope half
of **criterion 3** (a path escaping `dist/` is refused before any filesystem read).
Pure function, fixed string `distRoot` — no filesystem, no stubs, deterministic.

## Regression

All prior unit/integration suites (summary, book, load-books, search, search-index,
paths, book-source, ci-workflow, parent-assets, remark-alerts, contrast, fonts,
TocSidebar) — **83 prior + 6 new = 89**, green. The recurring Windows-only
`load-books` temp-cleanup EPERM flake did not fire this run.
