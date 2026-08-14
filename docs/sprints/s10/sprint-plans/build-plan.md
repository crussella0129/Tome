Finalized - DO NOT EDIT

# Sprint 10 Build Plan

## Intents
- [INT-0008](../../../intents/INT-0008-in-book-search.md) — state: planned; acceptance criteria covered: 1, 2, 3, 4 (the whole intent — build-time index, keyboard overlay, ranking, adaptive/zero-JS/accessible). On green, INT-0008 is eligible for `realized`.

## Schema Tree
- Sprint Goal: in-book search over the whole library (build-time index + sacred keyboard overlay, adaptive + zero-JS)
  - Index & ranking
    - T-023: build-time search index endpoint + pure scorer
  - Reader UI
    - T-024: search overlay island + wiring
  - Proof & docs
    - T-025: search build gate + README

## Execution Sequence

### T-023: Build-time search index + pure scorer
- **Intent:** [INT-0008](../../../intents/INT-0008-in-book-search.md)
- **Touches:** `src/lib/search-index.ts` (new), `src/pages/search-index.json.ts` (new), `src/lib/search.ts` (new), `package.json` (promote `github-slugger` to a direct dependency), `src/lib/__tests__/search-index.test.ts` (new), `src/lib/__tests__/search.test.ts` (new)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0008 criteria 1 (index covers the library, served as static JSON) and 3 (ranking/prefix/empty-state).
- **Success criterion (EARS):**
  - **WHEN** the index builder runs over `books()`, **THEN** it **SHALL** emit one record per non-draft chapter as `{ tomeSlug, tomeTitle, chapterTitle, url, headings:[{text,slug,depth}], text }`, where `url = chapterUrlIn(multi ? tomeSlug : '', href)` and each heading `slug` is the github-slugger slug of the heading text (a fresh slugger per chapter, matching Astro's per-page dedupe), with fenced code excluded from `text`.
  - **WHEN** `search(query, records)` runs, **THEN** it **SHALL** rank title/heading matches above body matches, support prefix and multi-term queries, attach each hit's best-matching heading anchor (or none when the match is only in the title/body), and return `[]` for an empty or whitespace-only query.
- **Notes:** `search-index.ts` is pure (given the library + a raw-Markdown map) so it unit-tests without Astro; parse Markdown with the existing `mdast-util-from-markdown` dep, collecting `heading` nodes and prose text (skip `code`). **Per critique C-001**, feed headings to one github-slugger instance **in document order, including the chapter H1**, so dedupe suffixes (`-1`, `-2`) match Astro's per-page ids. The `search-index.json.ts` endpoint is a thin wrapper: `import.meta.glob('../content/books/**/*.md', {query:'?raw', eager:true})` + `books()` → `GET` returns the JSON. `test_search_index_heading_slugs` asserts a computed slug equals the `id` Astro emits for the same heading (empirically `the-summary-is-the-spine`), **including a duplicate-heading case** that must produce the `-1` suffix.

### T-024: Search overlay island + wiring
- **Intent:** [INT-0008](../../../intents/INT-0008-in-book-search.md)
- **Touches:** `src/components/SearchOverlay.tsx` (new), `src/components/SearchOverlay.module.css` (new), `src/layouts/BookLayout.astro`, `src/components/Bibliotheca.astro`, `src/components/__tests__/SearchOverlay.test.tsx` (new), `e2e/search.spec.ts` (new)
- **Depends on:** T-023
- **Acceptance criterion:** INT-0008 criteria 2 (open/type/navigate/close) and 4 (adaptive, zero-JS, accessible).
- **Success criterion (EARS):**
  - **WHEN** a reader presses `/` outside a text field with no modifier keys, or activates the visible search control, **THEN** the overlay **SHALL** open, trap focus, and focus the query input; **WHEN** `Escape` is pressed, **THEN** the overlay **SHALL** close and restore focus to the trigger.
  - **WHEN** the reader types a query, **THEN** the results **SHALL** update reactively — each a keyboard-navigable link to the chapter's adaptive URL, suffixed with `#<heading-slug>` when the hit is within a section — and the empty-query state and the no-result state **SHALL** each render a designed panel, never a blank.
- **Notes:** one `client:idle` island mounted in `BookLayout` (chapters) and `Bibliotheca` (`/`); it renders both the trigger and the dialog. It fetches `import.meta.env.BASE_URL + 'search-index.json'` on first open (lazy; an injected `records` prop lets tests bypass fetch). Solid idioms only (signals as getters, `<For>`/`<Show>`, `onCleanup`), sacred tokens (no raw values), `role="dialog"` + listbox/option roles, `aria-activedescendant`, and `prefers-reduced-motion` honored. The global `/` listener guards on `event.target` tag, `event.isComposing`, and modifier keys.

### T-025: Search build gate + docs
- **Intent:** [INT-0008](../../../intents/INT-0008-in-book-search.md)
- **Touches:** `scripts/check-search.mjs` (new), `package.json` (`check:search`), `.github/workflows/ci.yml` (Search build gate step), `src/lib/__tests__/ci-workflow.test.ts`, `README.md`
- **Depends on:** T-023, T-024
- **Acceptance criterion:** INT-0008 criteria 1 and 4 — the index is emitted end to end and the result URLs are adaptive.
- **Success criterion (EARS):**
  - **WHEN** the site is built (default), **THEN** `dist/search-index.json` **SHALL** exist and cover every non-draft chapter (records with `text` + heading slugs); **WHEN** built with several tomes (`TOME_BOOKS=fixtures/handbook,fixtures/docs-book`), **THEN** every record `url` **SHALL** be namespaced under its tome, and a sample query run through `search.ts` **SHALL** resolve to the expected chapter URL; the gate **SHALL** restore `src/content/books/` to HEAD.
- **Notes:** models `scripts/check-multibook.mjs` (idempotent restore on success/failure). Wired into CI as a "Search build gate" step beside the multi-book gate; `test_ci_workflow_valid` asserts `check-search.mjs` is present. README documents the `/` shortcut, the index, and adaptive result links.
