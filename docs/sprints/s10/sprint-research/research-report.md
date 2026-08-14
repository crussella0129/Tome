# Sprint 10 Research Report

## Intents Reviewed

- [INT-0008 — In-book search](../../intents/INT-0008-in-book-search.md) —
  **created** this sprint (`proposed`). The first reader-discovery outcome after
  INT-0001–INT-0007 delivered viewing, external loading, the multi-tome
  Bibliotheca, and asset fidelity. No existing intent covers finding content
  across chapters, so a new chapter is correct rather than reopening a realized one.

## 1. Sprint Goal

Deliver full-text **in-book search** over the whole library: a build-time JSON
index of every tome's chapters (title, headings, body), served on demand; a
keyboard-first sacred **search overlay** (a control + the `/` shortcut) that ranks
results and links into the chapter's adaptive URL, deep-linking to the matching
heading (`#slug`). Zero-JS-by-default (the overlay is one island), accessible, and
proven by a build gate. This satisfies INT-0008's four acceptance criteria.

## 2. Existing Code Survey

| File | Relevance to search |
|------|---------------------|
| src/lib/book.ts | `books()` yields the library (each tome's `slug`, `title`, `chapters` with within-tome `slug` + `ChapterNode`); the index iterates this. `pageSlug`/`chapterUrlIn` already compute the adaptive result URL. |
| src/lib/paths.ts | `chapterUrlIn(bookSlug, href)` = the exact reader URL (root vs. namespaced); reuse verbatim for result links. |
| src/lib/summary.ts + summary.types.ts | `parseSummary`/`flattenChapters` give chapter titles + order; the index needs titles from here, body text from the Markdown. |
| src/pages/[...slug].astro | Shows the content pattern: `import.meta.glob('../content/books/**/*.md', {query:'?raw'})` will give each chapter's raw Markdown for indexing; `isContentKeyFor` maps a tome+href to its glob key. |
| src/layouts/BookLayout.astro | Hosts the sidebar island (`client:idle`); the search trigger + overlay island mount here so every chapter page gets search. |
| src/components/TocSidebar.tsx | Reference Solid island (signals, `<For>`/`<Show>`, `onMount`, `onCleanup`, module.css) — the overlay mirrors its idioms. |
| src/components/Bibliotheca.astro | The `/` library index (multi-tome) also deserves the search trigger; shares the token styling the overlay will use. |
| src/styles/tokens.css | Sacred tokens (`--theme-*`, `--shadow-panel`, `--radius-*`, motion) the overlay styles against — no raw values. |
| package.json | `mdast-util-from-markdown` is **already a dependency** (Sprint 9); reuse it to parse chapter Markdown → text + headings. No new runtime dep required for indexing. |
| dist/*/index.html (built) | Confirms Astro emits github-slugger heading `id`s (`<h2 id="the-summary-is-the-spine">`), so `#heading` deep links work and the index can compute matching slugs. |
| scripts/check-multibook.mjs | Template for the new build-level search gate (build → assert emitted artifact + query path; restore tree). |
| e2e/external-book.spec.ts | Playwright pattern (Sprint 8) for an optional browser proof of the overlay opening and navigating. |

## 3. External Sources

- [Astro — Markdown heading IDs (auto-generated, github-slug)](https://docs.astro.build/en/guides/markdown-content/#heading-ids)
- [github-slugger (the slug algorithm Astro uses)](https://github.com/Flet/github-slugger)
- [mdast-util-from-markdown (already a dep) — Markdown → mdast](https://github.com/syntax-tree/mdast-util-from-markdown)
- [Pagefind — the static-search alternative considered and deferred](https://pagefind.app/)
- [WAI-ARIA APG — combobox/listbox & dialog focus patterns](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

## 4. Risks, Unknowns, Dependencies

- **Heading-slug parity.** Deep links must match Astro's heading `id`s. Mitigation:
  compute slugs with `github-slugger`, one instance per chapter (matching Astro's
  per-page dedupe); a test asserts index slugs equal the built HTML's `id`s.
- **Index size / scaling.** A large external book (e.g. CubiKan, ~132 chapters)
  yields a large JSON. Mitigation: store trimmed, normalized text; fetch the index
  lazily on first open (not in page JS); note bigger-corpus chunking as future work.
- **Markdown → text fidelity.** Stripping must drop code fences, HTML, and link
  syntax while keeping prose + heading text. Mitigation: walk the mdast tree
  (`from-markdown`), collect `text`/`inlineCode` under non-code contexts, and
  record `heading` nodes separately.
- **`/` shortcut hygiene.** Must not fire while typing in an input/textarea or with
  modifiers. Mitigation: guard on `event.target` tag + `isComposing` + modifier keys.
- **Zero-JS discipline.** The trigger/overlay is the only new island; the rest of
  the page stays static. Mitigation: single `client:idle` island; index fetched on
  demand.
- **Dependency.** Indexing reuses the existing `mdast-util-from-markdown`; slugging
  needs `github-slugger` promoted to a **direct** dependency (currently transitive
  via Astro) for stability. No search-runtime library is required (dependency-free
  scorer in the island).

## 5. Recommended Approach

- **Index (build time).** A static endpoint `src/pages/search-index.json.ts`
  iterates `books()`; for each non-draft chapter it reads the raw Markdown (via the
  `**/*.md?raw` glob + `isContentKeyFor`), parses with `mdast-util-from-markdown`,
  and emits a record `{ tomeSlug, tomeTitle, chapterTitle, url, headings:[{text,
  slug,depth}], text }` where `url = chapterUrlIn(multi?tomeSlug:'' , href)` and
  slugs come from a per-chapter `github-slugger`. Output one JSON document
  (`/search-index.json`).
- **Scoring (pure, tested).** A dependency-free `src/lib/search.ts`: tokenize +
  normalize; score each record with field weights (title > heading > body) and
  prefix/multi-term matching; return ranked hits, each resolving to the best
  heading anchor when the hit is in a section. Unit-tested in isolation (no DOM).
- **Overlay (one island).** `src/components/SearchOverlay.tsx` (Solid, `client:idle`
  in `BookLayout` + `Bibliotheca`): a trigger button and a `/`-key listener open a
  focus-trapped dialog; on first open it fetches `/search-index.json`, then queries
  `search.ts` reactively; results are a keyboard-navigable listbox linking to the
  adaptive URL (+`#heading`). Designed empty and no-result states; sacred tokens;
  `prefers-reduced-motion` respected.
- **Adaptive + gates.** Single tome → `/<chapter>` links; several → `/<tome>/…`.
  A `scripts/check-search.mjs` build gate asserts `/search-index.json` exists,
  covers known chapters/headings, and that a query resolves to the right URL;
  wired into CI beside the multibook gate. `search.ts` + slug-parity covered by
  Vitest; an optional Playwright spec opens the overlay and navigates.
- **Task shape (for planning):** (T-023) index endpoint + `search.ts` + slug
  parity; (T-024) `SearchOverlay` island + wiring in `BookLayout`/`Bibliotheca`;
  (T-025) `check-search` gate + README. Keeps read-path (index) and UI separable.

## Artifacts

- [INT-0008 — In-book search](../../intents/INT-0008-in-book-search.md) (created)
- This report: `docs/sprints/s10/sprint-research/research-report.md`
- Empirical: built `dist/**/index.html` confirms github-slugger heading `id`s;
  `package.json` confirms `mdast-util-from-markdown` present and `github-slugger`
  resolvable at `node_modules/github-slugger` (v2.0.0).
