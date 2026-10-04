# INT-0024 — Portable deployment: offline reading and sub-path hosting

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0024
- **State:** proposed
- **Work evidence:** none
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Let a built library travel beyond the laptop that built it. A tablet should keep
reading the chapters it has opened when the network drops, and a static build
should work when served from a sub-path such as `user.github.io/repo/`, not only
from a domain root. Non-goals: accounts, sync, or access control (hosting
privacy stays the host's job), and changes to the desktop shells, which are
already fully offline.

## Acceptance criteria

1. With an opt-in build setting, the static site registers a service worker that
   caches the app shell, fonts, search index, and every chapter it has served,
   so a tablet that has opened a chapter can reopen it offline. Rebuilds
   invalidate stale caches deterministically.
2. A configured base path produces a build whose every route, asset, search
   result, theme script, and Bibliotheca link resolves under that path; the
   default (root) build is unchanged.
3. The *Take It to the Table* chapter drops its offline and sub-path caveats in
   favour of tested instructions, and E2E tests cover offline reopen and a
   sub-path build.

## Rationale

Sprint 22's tutorial had to document both limits honestly. Tablets at a game
table lose Wi-Fi, and GitHub Pages project sites are the most common free host.
Both are deployment concerns that INT-0023 deliberately left out.

## Alternatives

- **Document the limits only.** This is the current state, and it is what this
  intent improves on.
- **Always-on service worker.** Rejected as a default: stale caches surprise
  readers during live GM edits. It should be opt-in.

## Consequences

- Root-absolute URL construction (`chapterUrlIn`, search results, the
  Bibliotheca, `serve-dist`, the Electron `app://` protocol) must route through
  one base-aware helper.
- The live-reload dev path stays service-worker-free.

## Transition history

- 2026-10-04: created as `proposed` during Sprint 22 Loop, carrying forward
  INT-0023's documented deployment limitations.
