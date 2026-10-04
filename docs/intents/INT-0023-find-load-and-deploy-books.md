# INT-0023 — Find, load, and deploy your own books

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0023
- **State:** realized
- **Work evidence:** [Sprint 22 build plan](../sprints/s22/sprint-plans/build-plan.md)
- **Completion evidence:** [T-058 completion](../work/completed-tasks.md#t-058-sprint-22), [T-059 completion](../work/completed-tasks.md#t-059-sprint-22), [T-060 completion](../work/completed-tasks.md#t-060-sprint-22)
- **Code evidence:** [loader](../../scripts/load-books.mjs), [manifest resolver](../../scripts/library-config.mjs), [discovery CLI](../../scripts/find-books.mjs)
- **Test evidence:** [Sprint 22 test report](../sprints/s22/sprint-tests/test-report.md)
- **Documentation evidence:** [Find Your Books](../../src/content/books/tome/find-your-books.md), [Take It to the Table](../../src/content/books/tome/take-it-to-the-table.md), [README](../../README.md)

## Intent

Make Tome usable with a person's own mdBooks, from discovery through to the
device they read on. A human or a coding agent should be able to:

1. **find** candidate books already on the machine;
2. **add** chosen books to a personal library without editing or dirtying
   tracked repository files;
3. **build** that library without copying version-control metadata,
   dependency trees, or rendered mdBook output into it; and
4. **deploy** the result to where it will be read, whether a laptop, a desktop
   app, or a tablet on the same network or a static host.

A detailed, tested tutorial covers this path for humans, with an
agent-oriented recipe that uses machine-readable discovery output.

This intent refactors the existing build-time "explorer" path (manifest,
loader, generated library). It is not the native in-app folder picker. That
remains [INT-0020](INT-0020-native-library-folder-management.md), which this
work makes easier by separating personal library state from the source
checkout.

## Acceptance criteria

1. A discovery command scans one or more directories (default: the user's
   home, bounded depth, pruning VCS, dependency, build, and OS-cache
   directories) and lists every directory Tome's existing book-source rules
   accept. Each entry includes its title, chapter count, detected layout,
   and absolute path. The command offers a stable `--json` form for agents.
   Detected `src/`/`docs/` source directories are not double-listed as
   separate books, and invalid candidates are skipped, not fatal.
2. An add command validates a chosen path with the same rules and records it
   in a git-ignored personal manifest (`tome.local.toml`). It deduplicates by
   resolved path, never edits tracked `tome.config.toml`, and reports the next
   command to run. Manifest precedence is: book env vars → explicit
   `TOME_CONFIG` → `tome.local.toml` → `tome.config.toml` → the bundled sample.
3. Building a personal library leaves the source checkout clean. Generated
   books live in a git-ignored library directory, and the committed sample is
   never deleted or overwritten. With no personal books configured, the build
   presents the committed sample unchanged.
4. When a book's sources sit at its root, loading it excludes `.git` (and
   other VCS directories), `node_modules`, `target`, and the mdBook build
   directory, while all chapters and referenced assets still render.
5. Existing guarantees still hold: external, multi-book, search, and
   live-reload gates pass; fixture gates never mutate the tracked sample; and
   unit tests run against the committed sample regardless of a developer's
   personal library.
6. A tutorial, readable both in the bundled Tome guide and from the README,
   walks a human through find → add → build → read on desktop → serve to a
   tablet on the local network → static hosting (with the root-path and
   privacy caveats). It includes a copy-pasteable agent recipe based on the
   `--json` output, a recipe for a campaign book whose undiscovered entries
   are unlinked SUMMARY drafts. Every Tome command it documents
   (`npm run …` scripts) exists and is exercised by automated tests;
   third-party hosting steps are reviewed documentation.

## Rationale

The user's first real personal library (a large sibling mdBook checkout)
exposed the gaps. Adding it meant editing the tracked manifest. Building it deleted the
committed sample from the working tree, which also made every fixture gate
refuse to run in the active checkout. Because that book's sources sit at its
root, the loader also copied its whole `.git` directory (≈ 35 MB) into the
content library. Finding books meant knowing their paths: a home-directory
scan finds roughly fifty mdBook or Sprint Book roots on this machine. None of
this is visible from the README, and none of it can be fixed by documentation
alone.

## Alternatives

- **Tutorial only.** Rejected: documenting "don't commit the deleted sample"
  and a 35 MB `.git` copy would leave users carrying the cost.
- **Ignore and untrack the whole `src/content/books/`.** Rejected: the
  committed sample doubles as the unit-test corpus and the fixture-gate
  restoration target, so it must stay tracked and stable. A separate generated
  directory keeps that contract.
- **Native folder picker now (INT-0020).** Deferred: it needs a runtime build
  service in both desktop shells. A discovery CLI and a personal manifest are
  the prerequisites it would reuse.
- **Base-path (`/repo/`) hosting support.** Deferred: Tome emits
  root-absolute routes. The tutorial names hosts that serve at a domain root
  and records the limitation.

## Consequences

- Astro reads the generated library through one alias. Vitest maps that alias
  to the committed sample, so tests stay deterministic on a developer machine
  with personal books.
- The loader always publishes a library, copying the sample when nothing is
  configured, instead of treating "unconfigured" as a no-op.
- [INT-0021](INT-0021-safe-consistent-fixture-verification.md)'s guard keeps
  protecting the tracked sample. Fixtures now publish into the generated
  library rather than over the sample, and its "default no-op" loader
  observation becomes "default publishes the sample".
- Personal manifests and generated libraries are machine state: ignored, never
  committed, and described in the repository only as instructions.

## Transition history

- 2026-10-04: created as `proposed` during Sprint 22 research from the user's
  request to review the explorer path and write a find-and-deploy tutorial.
- 2026-10-04: `proposed → planned` — the user approved the Sprint 22 plan
  (T-058 generated library, T-059 discovery CLI, T-060 tutorial). AC6 clarified
  at planning: automated checks cover Tome's own documented commands; third-party
  hosting steps are reviewed documentation.
- 2026-10-04: `planned → active` — Sprint 22 Build reached T-058 (generated
  library, personal manifest, clean copies) after the theme tasks landed.
- 2026-10-04: `active → realized` — T-058 moves the library into a generated,
  git-ignored directory with a personal `tome.local.toml` and clean copies;
  T-059 adds `books:find` / `books:add`; T-060 writes the tutorial into the
  bundled guide. All six criteria are proven (CI 37219722218 green at
  `b222c56`), including on the user's real library (35 → 21 MB, no `.git`,
  clean checkout) and with the fixture gates passing in the active workspace.
  Offline reading and sub-path hosting remain documented limitations, carried
  to [INT-0024](INT-0024-portable-deployment.md).
