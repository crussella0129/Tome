# INT-0020 — Native library folder management

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0020
- **State:** proposed
- **Work evidence:** [T-052 native library management backlog](../work/tasks.md)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Let a reader add and remove local mdBook/Tome folders from the Bibliotheca through
the desktop app, without editing repository configuration or running a command.
Selection uses a native directory picker; accepted libraries persist across app
restarts, become navigable and searchable through the normal Tome experience, and
never expose a general-purpose filesystem or process API to web content.

The outcome covers the supported desktop shells. A browser build must hide the
native-only action rather than present a control that cannot complete the import.
Folder selection alone is not realization: the selected tome must actually appear
in the active Bibliotheca and reader.

## Acceptance criteria

1. A desktop-only “Add Tome…” action in the Bibliotheca opens a native directory
   picker from a direct user gesture. Cancel is a no-op; browser builds and any
   shell without the complete capability do not show a misleading action.
2. A selected folder is validated through Tome's existing book-source rules before
   publication. Invalid folders produce an actionable in-app error, and renderer
   code receives only narrow library-management operations—not arbitrary paths,
   filesystem primitives, IPC channels, or process execution.
3. Accepted library roots are stored in per-user application data rather than the
   repository's `tome.config.toml`. They survive restart, can be removed from the
   managed library, and duplicate/colliding selections are handled deterministically.
4. Adding or removing a tome stages all routes, transformed assets, and the search
   index, then switches the active library and reloads only after a successful
   build. Failure leaves the previously active library intact and removes staging
   residue; success makes the tome visible, openable, and searchable in the app.
5. Automated tests cover picker cancellation, validation failure, persistence,
   successful add/remove, build failure rollback, renderer API confinement, and
   an end-to-end native-shell import of a fixture book.

## Rationale

Tome can already load arbitrary mdBooks, but it does so before Astro builds. Book
discovery, page routes, transformed assets, and the search index are compile-time
outputs, while both desktop shells currently serve one fixed embedded/built
`dist/`. A browser directory handle or a native picker by itself therefore cannot
update the running Bibliotheca. The native action must be paired with persisted
library state and a staged runtime build/switch mechanism.

## Alternatives

- Use `window.showDirectoryPicker()` in every build. Rejected: it has limited
  browser availability, returns handles rather than a dependable native absolute
  path, and still cannot update Tome's already-compiled route/search graph.
- Write selections into the repository's `tome.config.toml`. Rejected: installed
  apps need per-user state, and product interaction should not mutate a source
  checkout.
- Publish the selected directory immediately and rebuild in place. Rejected: a
  validation or build failure could destroy the reader's last working library or
  expose a partially generated route graph.

## Consequences

- The desktop boundary gains a deliberately narrow library-management adapter and
  per-user manifest. Electron can host the first runtime builder; Tauri requires a
  bundled sidecar or equivalent native build service before advertising parity.
- Runtime builds need versioned staging, progress/error states, and an atomic
  active-library switch. This is a cross-cutting feature and should be planned as
  one or more dedicated sprints rather than folded into responsive CSS work.
- The existing CLI/config loader remains supported and supplies reusable validation
  and preparation logic, but it is no longer the only path for desktop readers.

## Transition history

- 2026-08-20: created as `proposed` during Sprint 20 research; native picker APIs
  are available, but the current static route/search architecture requires a
  persisted, staged runtime-build design before an in-app selection can become a
  real Bibliotheca entry.
