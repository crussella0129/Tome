# INT-0010 — In-page reader navigation

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0010
- **State:** planned
- **Work evidence:** [Sprint 12 build plan (T-026–T-028)](../sprints/s12/sprint-plans/build-plan.md)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Within a chapter, give the reader two navigation aids: an **"on this page"** rail
listing the chapter's section headings (H2/H3) as anchor links, scroll-synced to
highlight the section currently in view; and **keyboard shortcuts** to move
between chapters (previous / next). The rail is server-rendered so its links work
with no JavaScript; a single small island adds the scroll-sync, and the page stays
zero-JS-by-default otherwise.

## Acceptance criteria

1. A chapter that has section headings (H2/H3) renders an "on this page" rail
   listing them as links to their anchors (`#slug`, matching Astro's rendered
   heading `id`s), **server-rendered** so the links work without JS; a chapter with
   no such headings renders no rail.
2. As the reader scrolls, the rail marks the section currently in view as active
   (scroll-synced from the headings' live positions), honoring
   `prefers-reduced-motion`; this scroll-sync is the rail's only client JavaScript.
3. Keyboard shortcuts move between chapters — a next-chapter key and a
   previous-chapter key (arrow keys and `j`/`k`) — following the same prev/next as
   the pager and using the adaptive URL; they do **not** fire while the reader is
   typing in a field or while the search overlay (a modal dialog) is open.
4. Component and E2E tests prove the rail lists a chapter's headings and marks the
   in-view one active, and that the keyboard shortcuts navigate to the correct
   adjacent chapter.

## Rationale

Tome renders chapters and offers cross-library search (INT-0008), but within a
long chapter there is no way to see or jump to its sections, and moving between
chapters means reaching for the pager or sidebar. An in-page heading rail and
keyboard chapter navigation are baseline reader affordances (mdBook and most
documentation readers provide them).

## Alternatives

- A client-only rail that queries the DOM for headings. Rejected: server-rendering
  the rail keeps its links usable with no JS (progressive enhancement), and Astro's
  `getHeadings()` supplies the data at build time.
- Re-parse the chapter Markdown for headings. Rejected: the rendered Markdown module
  exposes `getHeadings()` with slugs identical to the rendered `id`s — no re-parse
  and no extra dependency.

## Consequences

- `BookLayout` gains an optional right-hand "on this page" column on wide viewports
  (hidden on narrow); a small island adds scroll-sync, and a keyboard-nav island
  receives the adjacent chapters' URLs.
- Heading slugs come from Astro's `getHeadings()` (github-slugger), matching the
  rendered `id`s used as anchor targets.
- Scope is H2/H3 section headings; deeper nesting (H4+) and cross-chapter navigation
  remain the sidebar's job. Keyboard nav is guarded against inputs and the open
  search dialog.
- Scroll-sync is driven by a passive, rAF-throttled `scroll` listener rather than an
  `IntersectionObserver`: measurement showed IO misses fast jump-scrolls that skip
  its thin trigger band. The active section is chosen by the pure `activeHeadingSlug`
  from the headings' live `getBoundingClientRect` positions.

## Transition history

- 2026-08-14: created as `proposed` during Sprint 12 research — the first in-chapter
  navigation aids, after INT-0008 delivered cross-library search.
- 2026-08-14: `proposed → planned` — Sprint 12 plans T-026 (server-rendered "on this
  page" rail + scroll-sync island), T-027 (guarded keyboard chapter nav island), and
  T-028 (E2E + README), covering all four criteria.
- 2026-08-14: `planned → active` — Sprint 12 Build Phase began implementing
  T-026–T-028 against the locked plans.
