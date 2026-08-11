# Plan Critique — Sprint 2

## Concerns

### C-001: Loader tests and the build gate mutate the live sample directory
- **Where:** `build-plan.md` T-010 / T-012 and `test-plan.md` Integration (`test_load_book_external`) + `gate_external_build`.
- **Quote:** "clear `src/content/book/`, copy that book's `<src>` tree into it".
- **Failure mode:** hidden-dep
- **Why it matters:** `load-book.mjs`'s destination is the committed sample dir. Running the loader integration tests (or the external-build gate) overwrites `src/content/book/`, so a failed/interrupted run leaves a dirty or corrupted working tree, and parallel Vitest workers touching the same dir can race.
- **Suggested response:** fix-in-plan — give `load-book.mjs` an overridable destination (e.g. a `--dest`/`TOME_BOOK_DEST`, default `src/content/book`) so `test_load_book_external` targets a **temp dir** and never touches the sample. The build gate must use the real dir (the build reads it) but SHALL snapshot and restore it (`git checkout -- src/content/book`) afterward. Note both in T-010/T-012.

### C-002: The config mechanism is a durable decision recorded only in the plan
- **Where:** `build-plan.md` Context / T-010 vs. `INT-0002` Consequences.
- **Quote:** "which book to load is a **build-time env var `TOME_BOOK`**".
- **Failure mode:** intent-drift
- **Why it matters:** INT-0002's Intent explicitly leaves the config mechanism open ("env var, config, or CLI arg"). Choosing `TOME_BOOK` at build time is a lasting interface decision a future sprint must respect; it belongs in the stable intent, not only sprint prose.
- **Suggested response:** fix-in-plan (amend intent) — record the `TOME_BOOK` build-time env-var decision (and that it is a no-op when unset) in INT-0002 Consequences.

## Confidence
proceed-with-caveats
