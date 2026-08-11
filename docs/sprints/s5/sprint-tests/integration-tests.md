# Sprint 5 Integration Tests

- **Head SHA:** `2232715f0f768477920356e7be746b58253e83cb`

## Live-reload gate (`scripts/check-live-reload.mjs`, local)
- `check_live_reload` — **pass** (ran green twice): copied `fixtures/handbook` into a
  temp mutable book, ran `TOME_BOOK=<temp> astro dev`, confirmed `/first` served
  "First Chapter", edited the source file on disk to "LIVE RELOAD CONFIRMED", and
  the reader reflected it within the poll window — **no restart**. The `finally`
  stopped `astro dev`, restored `src/content/book/` to HEAD (tree clean), and
  removed the temp book. Covers T-018 EARS (INT-0003 criterion 3, end to end).
  Kept **local** (dev-server + timing), not CI.

## External build gate (`scripts/check-external-build.mjs`, regression)
- `check_external_build` — **pass** for both the standard `handbook` and the
  config-less `docs-book` (unchanged from Sprint 4), confirming the `load-book.mjs`
  refactor to the shared `book-source.mjs` did not regress detection or copy.

The shared-module unit tests (`resolveBookSource`, `syncPath`) run in CI via Vitest.
