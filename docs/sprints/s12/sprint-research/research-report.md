# Sprint 12 Research Report

## Intents Reviewed

- [INT-0010 — In-page reader navigation](../../intents/INT-0010-in-page-reader-navigation.md)
  — **created** this sprint (`proposed`). The first in-chapter navigation aids (an
  "on this page" rail + keyboard chapter nav); a distinct reader outcome, so a new
  chapter.

## 1. Sprint Goal

Add two in-chapter navigation aids: an **"on this page"** rail (the active chapter's
H2/H3 headings as anchor links, scroll-synced to the section in view) and
**keyboard chapter navigation** (arrows / `j`·`k` → prev/next chapter). The rail is
server-rendered (links work with no JS) with one small island for scroll-sync; a
tiny keyboard-nav island mirrors the pager. Adaptive URLs; zero-JS-by-default;
`prefers-reduced-motion` honored; guarded against inputs and the open search modal.

## 2. Existing Code Survey

| File | Relevance |
|------|-----------|
| src/pages/[...slug].astro | Renders the chapter (`const mod = await entry[1]()`). `mod.getHeadings()` returns `{depth,slug,text}[]` with slugs identical to the rendered `id`s — the rail data, free, no re-parse. Also has `page.route.prev/next` (ChapterNode) for the keyboard-nav URLs. Will pass `headings` + prev/next URLs to `BookLayout`. |
| src/layouts/BookLayout.astro | The 2-col grid (sidebar \| content). Add an optional right "on this page" column on wide viewports (hidden narrow); mount the scroll-sync + keyboard-nav islands. |
| src/components/Pager.astro | The existing prev/next chapter links (`chapterUrl(node.href)`). Keyboard nav mirrors these; on multi-tome the URL must be namespaced (`chapterUrlIn`). |
| src/lib/paths.ts | `chapterUrlIn(bookSlug, href)` — the adaptive URL for the prev/next targets (root vs `/<tome>/…`). |
| src/components/SearchOverlay.tsx | Island pattern (signals, `onMount`/`onCleanup`, `/` global key with input/`isComposing`/modifier guards). Keyboard nav must **also** stand down while this dialog is open — it renders `[role="dialog"]` when open, a queryable signal. |
| src/components/TocSidebar.tsx | Island idioms + `body.js-nav` hydration signal (reused for deterministic E2E waits). |
| src/styles/tokens.css / prose.css | Sacred tokens for the rail styling (uppercase labels, accent, subdued text, motion). |
| dist/**/index.html (built) | Confirms Astro emits github-slug heading `id`s (`the-summary-is-the-spine`, `panels--tables`) — the rail's `#slug` targets match `getHeadings()`. |

## 3. External Sources

- [Astro — `MarkdownInstance.getHeadings()` (`{depth,slug,text}`)](https://docs.astro.build/en/guides/markdown-content/#exported-properties)
- [MDN — IntersectionObserver (scroll-spy for the active heading)](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [WAI-ARIA APG — navigation landmark & `aria-current`](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
- [Playwright — keyboard navigation testing](https://playwright.dev/docs/api/class-keyboard)

## 4. Risks, Unknowns, Dependencies

- **Slug parity.** The rail's `#slug` anchors must equal the rendered heading `id`s.
  Mitigation: use `getHeadings()` (Astro's own slugs) — identical by construction;
  a component test + E2E click assert the anchor lands.
- **Scroll-sync correctness.** Choosing the "active" heading as the reader scrolls
  needs a sensible `rootMargin`/threshold so the current section (not the next) is
  marked. Mitigation: observe headings with a top-biased `rootMargin`; pick the
  last heading above the viewport top; component-test the pure "active index"
  selection where possible, E2E-verify the visual mark.
- **Keyboard-nav guards.** Must not fire in inputs/`contenteditable`, with modifiers,
  or while the search dialog is open. Mitigation: guard on `event.target` tag,
  `isComposing`, modifier keys, and the presence of an open `[role="dialog"]`.
- **Zero-JS discipline.** The rail links are server-rendered; only scroll-sync +
  keyboard nav are islands. Mitigation: two small `client:idle`/`client:visible`
  islands, no eager work.
- **Layout on narrow screens.** A third column must not crowd the reading measure.
  Mitigation: the rail shows only ≥ a wide breakpoint; hidden below it (the sidebar
  TOC already covers navigation there).

## 5. Recommended Approach

- **[...slug].astro:** compute `headings = mod.getHeadings().filter(h => h.depth >= 2 && h.depth <= 3)`; pass `headings` and `prevUrl`/`nextUrl` (via `chapterUrlIn(multi?bookSlug:'' , node.href)`) into `BookLayout`.
- **BookLayout.astro:** on wide viewports add a right "on this page" column; render `<OnThisPage headings={headings} client:idle />` (SSR gives the links; hydration adds scroll-sync) and `<ReaderKeys prevUrl nextUrl client:idle />` (behavior-only). Grid becomes `sidebar | content | rail` ≥ breakpoint; the rail is `display:none` below it.
- **OnThisPage.tsx** (new island + module.css): renders `<nav aria-label="On this page"><For>…<a href={#slug}>text</a></For></nav>`; `onMount` sets an `IntersectionObserver` over the article's `#slug` headings and marks the active link (`aria-current`); `onCleanup` disconnects. Sacred tokens; reduced-motion respected.
- **ReaderKeys.tsx** (new, behavior-only island): a document `keydown` listener — `ArrowRight`/`j` → `nextUrl`, `ArrowLeft`/`k` → `prevUrl` (via `location.assign`), guarded on input/`contenteditable` target, `isComposing`, modifiers, and no open `[role="dialog"]`.
- **Tests:** `OnThisPage.test.tsx` (renders a heading list with correct `#slug` hrefs; empty headings → no rail); a pure `activeHeadingIndex` helper unit-tested if extracted; `e2e/reader.spec.ts` additions — the rail lists a chapter's sections and an arrow key navigates to the adjacent chapter (waiting on `body.js-nav`).
- **Tasks:** (T-026) "on this page" rail island + wiring + scroll-sync; (T-027) keyboard chapter nav island + guards; (T-028) E2E + README. Or fold nav into T-026's wiring — decided at plan time.

## Artifacts

- [INT-0010 — In-page reader navigation](../../intents/INT-0010-in-page-reader-navigation.md) (created)
- This report; empirical: `mod.getHeadings()` is Astro's documented per-file export; built heading `id`s already confirmed (Sprint 10) to be github-slugs.
