# Sprint 5 Research Report

## Intents Reviewed
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — selected; relevance: this sprint delivers criterion 3 (live reload of the active external book during `dev`); current state: `active` (criterion 1 done). Criterion 2 (multi-book) remains, so INT-0003 stays `active` after this sprint.

## 1. Sprint Goal

When `TOME_BOOK` points at an external book and Tome runs in `dev`, editing a
chapter of that book on disk should update the reader **without a manual
restart**. Today `load-book.mjs` copies the external book into
`src/content/book/` once at `predev`; on-disk edits to the source aren't
reflected. Add a **dev-only watcher** that re-syncs changed source files into
`src/content/book/`, which Astro's dev server then reflects.

## 2. Existing Code Survey

| File | Relevance | Notes |
|------|-----------|-------|
| `scripts/load-book.mjs` | high | Owns source detection (`resolveSource`) + the initial copy. The watcher needs the same detected source dir — extract detection into a shared module both import. |
| `astro.config.mjs` | high | Integrations/Vite plugins are configured here; the live-reload watcher is an Astro integration (`astro:server:setup`). |
| `src/pages/[...slug].astro` / `src/lib/book.ts` | med | Render from `src/content/book/**` via `import.meta.glob` + `?raw`; Astro dev invalidates these when the files change (confirmed by the spike). No change. |
| `package.json` | low | `predev` already does the initial copy; the integration handles subsequent live changes. |
| `src/lib/__tests__/load-book.test.ts` | med | Detection tests; a shared-module refactor must keep them green, plus a unit test for the per-file sync helper. |

## 3. External Sources

- [Astro — integration hooks (`astro:server:setup`)](https://docs.astro.build/en/reference/integrations-reference/) — fires "just after the Vite server is created in 'dev' mode, before `listen()`", and provides the mutable **`ViteDevServer`** (`server`) plus `logger`. This is where a dev-only watcher is wired; it does not run during `build`.
- [Vite — `ViteDevServer` API](https://vite.dev/guide/api-javascript.html#vitedevserver) — `server.watcher` is Vite's chokidar instance (`.add(path)`, `.on('change'|'add'|'unlink', …)`); `server.hot.send({ type: 'full-reload' })` forces a browser reload. The watcher reuses Vite's robust cross-platform watching rather than raw `fs.watch`.
- **Spike (this repo, internal):** with `TOME_BOOK=fixtures/handbook npm run dev` running, editing `src/content/book/first.md` (`# First Chapter` → `# EDITED LIVE`) changed the served `/first` page's `<h1>` from "First Chapter" to "EDITED LIVE" **without restart** — Astro dev re-renders on request and Vite invalidates on the file change. So *copying* a changed source file into `src/content/book/` is sufficient for the reader to reflect it.

## 4. Risks, Unknowns, Dependencies

- **Risk: watching outside the project root.** The external book is outside `cwd`. Mitigation: `server.watcher.add(sourceDir)` (chokidar) supports arbitrary paths; handle only events whose path is under the resolved source dir.
- **Risk: rapid edits / partial writes.** Mitigation: the copy is idempotent; a small debounce and copy-on-`change`/`add`, remove-on-`unlink` suffice. A `full-reload` after the copy makes the browser refresh even if `import.meta.glob` HMR is partial.
- **Risk: build-time leakage.** The watcher must be dev-only. Mitigation: `astro:server:setup` only fires in `dev`; guard on `TOME_BOOK` being set.
- **Risk: verification is dev-server-shaped (flaky-prone).** Mitigation: a scripted local gate (start dev → edit a temp book → poll the served page) rather than a CI/Playwright test; the per-file sync helper is unit-tested in isolation.
- **Dependency: none new** — Vite's watcher (chokidar) already ships with Astro.

## 5. Recommended Approach

Primary: (a) extract source detection from `load-book.mjs` into a shared
`scripts/book-source.mjs` (`resolveBookSource(root) → { sourceDir, title }`),
imported by both the loader and the integration (no behaviour change; existing
detection tests stay green). (b) Add an Astro integration `tomeLiveReload()` in
`astro.config.mjs` with `astro:server:setup`: when `TOME_BOOK` is set, resolve
the source dir, `server.watcher.add(sourceDir)`, and on `change`/`add`/`unlink`
under it copy the file to `src/content/book/<relative>` (or remove it) then
`server.hot.send({ type: 'full-reload' })` and log. A pure `syncPath(changed,
sourceDir, dest)` helper is unit-tested. (c) A scripted local gate
`scripts/check-live-reload.mjs` proves the end-to-end loop, and README documents
live reload.

Alternative considered: a separate watcher process run concurrently with `astro
dev`. Rejected — cross-platform concurrent process management (Astro's dev
daemonizes) is fragile; the integration lives inside the dev server's own
lifecycle.

Rationale: the spike proved the copy-into-`src/content/book` mechanism, so the
work is a small dev-only watcher over Vite's existing chokidar, with the source
detection shared (DRY) rather than duplicated.

## Artifacts
- Spike evidence (above): `/first` `<h1>` went `First Chapter` → `EDITED LIVE` live during `dev`.
- Reviewed intent: [INT-0003](../../../intents/INT-0003-richer-external-book-support.md); reuses the realized [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) detection (to be shared).
