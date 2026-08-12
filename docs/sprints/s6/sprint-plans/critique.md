# Plan Critique — Sprint 6

## Concerns

### C-001: T-019 changes the read path but the loader's write path isn't updated until T-020 — external loading breaks between the tasks
- **Where:** `build-plan.md` T-019 (`book.ts` reads `src/content/books/*`) vs. T-020 (the loader that writes there).
- **Quote:** T-019 "migrate `src/content/book/**` → `src/content/books/tome/**`"; T-020 "each **SHALL** be copied into `src/content/books/<slug>/`".
- **Failure mode:** hidden-dep
- **Why it matters:** after T-019, `book.ts` reads `src/content/books/*`, but the existing `load-book.mjs` (run by `predev`/`prebuild`) still writes the OLD `src/content/book/`. So the committed sample (moved to `books/tome`) renders, but **external-book loading and the `check-external-build` gate (which T-019 touches) break** until T-020 — T-019 is not independently green.
- **Suggested response:** fix-in-plan — T-019 **also** repoints the single-book loader (`load-book.mjs`) dest to `src/content/books/<slug>/` (slug from the book) so external single-book loading + `check-external-build` stay green after T-019. T-020 then **generalizes** `load-book.mjs` → `load-books.mjs` (multiple tomes + `tome.config.toml` + env precedence). Each task is independently verifiable.

### C-002: The locked design decisions live only in the plan, not the stable intent
- **Where:** `build-plan.md` Decisions vs. `INT-0003` Consequences.
- **Quote:** "Config: `tome.config.toml` … Routes: adaptive … Name: Bibliotheca … Desktop app deferred".
- **Failure mode:** intent-drift
- **Why it matters:** these are durable, user-decided constraints (config mechanism, URL model, naming, and that a desktop shell is a *separate future intent*); a future sprint reading only INT-0003 would miss them.
- **Suggested response:** fix-in-plan (amend intent) — record in INT-0003 Consequences: the `tome.config.toml` + env-override config, the adaptive route model, the "Bibliotheca" name, and that the desktop shell is deferred to its own future (Electron-first) intent.

## Confidence
proceed-with-caveats
