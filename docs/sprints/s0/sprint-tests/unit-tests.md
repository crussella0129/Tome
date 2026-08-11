# Sprint 0 Unit Tests

- **Runner:** Vitest 4.1.10 (jsdom, `vite-plugin-solid` with `hot:false`)
- **Command:** `npx vitest run`
- **Head SHA:** `3e950befa8e9047cf9eca77ae765bc5787e8a324`
- **Result:** 21 passed / 0 failed / 21 total (4 files) — includes the integration tests below.

## T-002 — token/theme layer (`src/styles/__tests__/contrast.test.ts`)
- `test_ink_on_paper_contrast_aa` [theme-ink-paper] — ink #2b2018 on paper #f3e9d2 ≥ 4.5:1 — **pass** (EARS clause 1)
- `test_ink_on_paper_contrast_aa` [theme-terminal-dark] — ink #e8dcc2 on #16130e ≥ 4.5:1 — **pass** (EARS clause 1)
- supporting: hex parse, luminance ordering, black-on-white ≈ 21:1 — **pass**

## T-003 — SUMMARY parser (`src/lib/__tests__/summary.test.ts`)
- `test_summary_nested_chapters` — 2- and 3-level nesting preserves depth — **pass** (clause 1)
- `test_summary_part_title` — `# Part One` → part-title node — **pass** (clause 2)
- `test_summary_prefix_and_suffix` — prefix before / suffix after numbered — **pass** (clause 3)
- `test_summary_draft_entry` — `- [x]()` → draft, no href — **pass** (clause 4)
- `test_summary_separator` — `---` → separator node in order — **pass** (clause 5)
- supporting: stray-prose ignore, tab indent, `flattenChapters` ordering — **pass**

## T-004 — sidebar island (`src/components/__tests__/TocSidebar.test.tsx`)
- `test_sidebar_lists_chapter_links` — every linkable chapter → an anchor to its URL; draft is not a link — **pass** (clause 1)
- `test_sidebar_marks_current` — active slug → `aria-current="page"`; others none — **pass** (clause 2)
- `test_sidebar_toggle_collapses` — toggle flips `data-open`/`aria-expanded` both ways — **pass** (clause 3)

## T-005 — pager data (`src/lib/__tests__/book.test.ts`)
- `test_pager_prev_next` — neighbours linked; first has no prev, last has no next — **pass** (clause 4)
