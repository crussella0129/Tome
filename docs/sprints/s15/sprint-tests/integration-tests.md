# Sprint 15 — Integration Test Results

- **Tested head:** `cd869bf9863d4b6fc1e03151558638de832f338d`
- **Intents:** [INT-0013](../../intents/INT-0013-resilient-scaling-zoom.md), [INT-0014](../../intents/INT-0014-discoverable-library.md)

## Build-shape gates (full pipeline against the new 2-tome default)

| Gate | Command | Result |
|------|---------|--------|
| External single-tome build | `npm run check:external` | **exit 0** — single external tome builds, root routes; then rebuilds the 2-tome default (9 pages) |
| Two-tome Bibliotheca build | `npm run check:multibook` | **OK** — two-tome Bibliotheca + namespaced routes + switcher |
| Search index + query | `npm run check:search` | **OK** — single-tome (fixture) root URLs + two-tome namespaced URLs both resolve; tree restored |
| Live-reload parent assets | `npm run check:livereload` | **OK** — live edit appeared + parent image resolved, no restart |

These prove the shipped **default is a valid 2-tome library** and that the
single-tome and multi-tome modes still build and search correctly. `check-search`
was updated this sprint (its single-tome case now builds an explicit fixture,
because the shipped default is no longer single-tome) — INT-0014's single-tome
coverage (root routes) is carried by `check:external`.

## `astro check` + audit
- `npm run check` (astro check): **0 errors / 0 warnings / 0 hints** (56+ files incl. the migrated + new specs).
- neutronium `audit.sh src/`: **passed** (only pre-existing benign `.map`/test-file warnings).
