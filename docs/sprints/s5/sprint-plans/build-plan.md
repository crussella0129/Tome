Finalized - DO NOT EDIT

# Sprint 5 Build Plan

## Intents
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — state: active; acceptance criteria covered: 3 (live reload of the active external book during `dev`). Criterion 2 (multi-book) remains, so INT-0003 stays `active` after this sprint.

## Schema Tree
- Sprint Goal: live-reload the active external book during `dev` (edit on disk → reader updates, no restart)
  - Watcher
    - T-017: shared source module + live-reload Astro integration
  - Proof & docs
    - T-018: end-to-end live-reload gate + README

## Execution Sequence

### T-017: Shared source module + live-reload integration
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- **Touches:** `scripts/book-source.mjs` (new), `scripts/load-book.mjs` (import the shared module), `astro.config.mjs` (add the `tomeLiveReload()` integration), `src/lib/__tests__/book-source.test.ts` (new)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0003 criterion 3 — editing a chapter of the active external book during `dev` reflects in the reader without a restart (this task provides the watcher + sync; the end-to-end proof is T-018).
- **Success criterion (EARS):**
  - **WHEN** `resolveBookSource(root)` runs, **THEN** it **SHALL** return the same `{ sourceDir, title }` as the loader's detection (declared `book.toml` src authoritative, else `src/` → `docs/` → root; title = `book.toml` title → root directory name), and `load-book.mjs`'s existing detection tests **SHALL** stay green (shared logic, not duplicated).
  - **WHEN** `syncPath(changedAbsPath, sourceDir, dest)` runs for a file under `sourceDir`, **THEN** it **SHALL** copy it to `dest/<relative>`; for a deleted path, it **SHALL** remove `dest/<relative>`.
- **Notes:** the `tomeLiveReload()` integration uses `astro:server:setup` (fires in `dev` only) guarded on `TOME_BOOK` being set: resolve `sourceDir`, `server.watcher.add(sourceDir)`, and on `change`/`add`/`unlink` under it call `syncPath` then `server.hot.send({ type: 'full-reload' })` and log. Reuses Vite's chokidar (`server.watcher`) — not raw `fs.watch`. Zero effect on `build`/prod (the hook never fires there). `load-book.mjs` is refactored to import `resolveBookSource` from the shared module with identical behaviour.

### T-018: End-to-end live-reload gate + docs
- **Intent:** [INT-0003](../../../intents/INT-0003-richer-external-book-support.md)
- **Touches:** `scripts/check-live-reload.mjs` (new), `package.json` (a `check:livereload` script), `README.md`
- **Depends on:** T-017
- **Acceptance criterion:** INT-0003 criterion 3 — the live edit-to-reader loop works end to end.
- **Success criterion (EARS):**
  - **WHEN** a chapter of the active external book is edited while `astro dev` runs (`TOME_BOOK` set), **THEN** the reader **SHALL** serve the updated content without a restart.
- **Notes:** the gate copies `fixtures/handbook` into a temp **mutable** book, starts `TOME_BOOK=<temp> astro dev`, GETs a chapter (asserts the original text), edits the temp source, polls the served page until it reflects the edit (bounded timeout → fail). **Per critique C-001**, a `finally` block always runs `astro dev stop`, restores `src/content/book/` to HEAD (`git checkout` + `git clean` — `predev` overwrote it with the temp book), and removes the temp book, on success/failure/timeout, so the tree and dev daemon are left clean. Kept **local** (a dev-server + timing check, out of the flaky CI path); the per-file `syncPath` is unit-tested in T-017. README gains a "Live reload" note.
