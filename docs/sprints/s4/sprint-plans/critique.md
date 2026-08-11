# Plan Critique — Sprint 4

## Concerns

### C-001: "honored `book.toml` src" vs. the fall-through detection order is ambiguous
- **Where:** `build-plan.md` T-015 Notes ("`tomlSrc?` → `src` → `docs` → `.`") vs. criterion 2 ("that `src` is honored").
- **Quote:** "the first candidate directory containing `SUMMARY.md`, checked in order `tomlSrc?` → `src` → `docs` → `.`".
- **Failure mode:** intent-drift
- **Why it matters:** if a `book.toml` **declares** `src = "foo"` but `foo/SUMMARY.md` is missing, the fall-through order would silently pick `src/`, `docs/`, or the root instead — contradicting "the declared `src` is honored" and hiding a misconfigured book.
- **Suggested response:** fix-in-plan — make a **declared** `book.toml` `src` authoritative: when `book.toml` declares `src`, use exactly `<root>/<src>` and **error if its `SUMMARY.md` is missing** (naming that path). The `src → docs → root` auto-detection applies **only** when `book.toml` is absent or declares no `src`. Record this in T-015's note and the intent Consequences.

### C-002: The gate now mutates the sample dir twice; restore hygiene must hold per book
- **Where:** `build-plan.md` T-016 / `test-plan.md` `check_external_build` (builds two books).
- **Quote:** "build **both** `fixtures/handbook` … **and** `fixtures/docs-book` … restoring `src/content/book/` between and after".
- **Failure mode:** hidden-dep
- **Why it matters:** each book build overwrites `src/content/book/`; a failure between the two, or a missing restore, could leave the tree dirty or the wrong book loaded for the next step.
- **Suggested response:** fix-in-plan — restore to HEAD (`git checkout` + `git clean`) **after each** book in the loop, and on any assertion failure (`fail()` already restores before exiting). Document that the gate is idempotent and leaves `src/content/book/` at HEAD regardless of outcome.

## Confidence
proceed-with-caveats
