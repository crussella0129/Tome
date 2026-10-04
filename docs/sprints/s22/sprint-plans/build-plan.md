# Sprint 22 Build Plan

Approved by the user on 2026-10-04 (Plan Mode approval of the Sprint 22 plan).

## Intents
- [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) — state: planned; acceptance criteria covered: 1–6.
- [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) — state: planned; acceptance criteria covered: 1–6.
- [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md) — realized compatibility boundary; T-058 records a consequence note (fixtures publish into the generated library; the tracked sample stays guarded). No state change.

## Schema Tree
- Sprint Goal: Sanguine Atonement + find/load/deploy your own books
  - Hidden theme (INT-0022)
    - T-055: theme plumbing, three-option selector, riddle dialog
    - T-056: Sanguine Atonement visual system
    - T-057: blood-wash transformation and persistence
  - Explorer path (INT-0023)
    - T-058: personal library out of the source tree
    - T-059: `books:find` / `books:add`
    - T-060: find-and-deploy tutorial

## Execution Sequence

### T-055: Add the Light · Dark · Other selector with the riddle dialog and a hidden Sanguine theme entry
- **Intent:** [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md)
- **Touches:** `src/lib/riddle.ts` (new), `src/lib/theme-state.ts` (new), `src/styles/theme.ts`, `src/components/init-theme.astro`, `src/components/ThemePicker.tsx` + `ThemePicker.module.css` (new), `src/components/TocSidebar.tsx` + `.module.css`, `src/components/Bibliotheca.astro`, `src/layouts/BookLayout.astro`, unit/component tests, `e2e/reader.spec.ts`, new `e2e/theme.spec.ts`, `playwright.config.ts` (match the new spec)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0022 AC1 (selector + dialog, keyboard/touch, focus return), AC2 (tolerant matching, refusal, Silence), AC6 (44px targets, no auto-capitalize/correct, browser chrome colour).
- **Success criterion (EARS):**
  - **WHEN** `matchRiddle()` receives "Sanguine", "Sanguine, my Brother", "sanguine my brother", "Sanguine, my Sister", "SANGUINE!", "Sanguíne", or a one-edit typo ("sanguin", "sangiune"), **THEN** it **SHALL** return `accepted`.
  - **WHEN** `matchRiddle()` receives an unrelated answer ("red", "blood", "sanguine is a colour") **THEN** it **SHALL** return `refused`; **WHEN** it receives "Silence, my brother" **THEN** it **SHALL** return `silence`; **WHEN** it receives whitespace/punctuation only **THEN** it **SHALL** return `empty`.
  - **WHEN** Light or Dark is chosen in the selector, **THEN** the body **SHALL** carry exactly that theme class, `localStorage['tome-theme']` **SHALL** equal it, and `meta[name=theme-color]` **SHALL** equal that theme's background.
  - **WHEN** Other is chosen, **THEN** a `role="dialog"` with `aria-modal="true"` labelled "What is the color of Night?" **SHALL** open, styled by the active theme's tokens, and focus **SHALL** move to an answer field with `autocapitalize="off"`, `autocorrect="off"`, and `spellcheck="false"`.
  - **WHEN** an accepted answer is submitted, **THEN** the dialog **SHALL** show "Welcome home." and the Sanguine Atonement class **SHALL** be applied and persisted.
  - **WHEN** a refused or Silence answer is submitted, **THEN** the dialog **SHALL** show "The door does not open." or its Silence acknowledgement respectively, and the theme **SHALL** be unchanged.
  - **WHEN** the dialog is left by Escape or the Leave control, **THEN** it **SHALL** close without a theme change and focus **SHALL** return to the Other option; Tab **SHALL** stay within the open dialog.
  - **WHEN** the selector renders on the reader sidebar or the Bibliotheca, **THEN** each option and dialog control **SHALL** be at least 44×44 CSS px at an 820×1180 viewport.
  - **WHEN** a page loads with a stored theme, **THEN** the pre-paint script **SHALL** accept exactly the classes in `THEMES` (including Sanguine) and fall back to the default otherwise.
- **Notes:** Follow SearchOverlay's modal pattern (role="dialog", focus trap, Escape) and render through `solid-js/web` `Portal` so the mobile drawer cannot clip it. Reuse `THEMES`/`DEFAULT_THEME`. Sanguine colours may be placeholders until T-056 supplies the palette.

### T-056: Build the Sanguine Atonement visual system on a contrast-safe blood palette
- **Intent:** [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md)
- **Touches:** `src/styles/tokens.css`, `src/styles/sanguine.css` (new), `src/styles/theme.ts`, `src/components/TocSidebar.module.css`, `src/components/Bibliotheca.astro`, `src/styles/__tests__/contrast.test.ts`, `e2e/theme.spec.ts`
- **Depends on:** T-055
- **Acceptance criterion:** INT-0022 AC4 (role contrast on every surface), AC5 (obsidian + blood channels + flourishes; motion stops under reduced motion; none in print).
- **Success criterion (EARS):**
  - **WHEN** Sanguine Atonement is defined, **THEN** its body text **SHALL** be ≥ 5.0:1 and its subdued and link text **SHALL** be ≥ 4.5:1 against each of the page, panel, and input surfaces and the brightest sheen tone the obsidian texture can produce, and the darkest heading-gradient stop **SHALL** be ≥ 3.0:1 against the page surface.
  - **WHEN** Sanguine is active in the browser, **THEN** computed `body` background and text colours **SHALL** equal the palette tokens, the textured layer **SHALL** sit behind content (`z-index` < content), and chapter `h1`/`h2` **SHALL** render with the blood-channel gradient.
  - **WHEN** Sanguine is active and a SUMMARY entry is unlinked, **THEN** the sidebar **SHALL** label it "(sealed)"; **WHEN** another theme is active **THEN** it **SHALL** still read "(draft)".
  - **WHEN** `prefers-reduced-motion: reduce` is set, **THEN** no Sanguine element **SHALL** report a running animation of non-negligible duration.
  - **WHEN** a Sanguine page is printed, **THEN** the body **SHALL** be ink on white, the texture layers **SHALL** be hidden, and headings **SHALL** have a solid, non-transparent fill.
  - **WHEN** Light or Dark is active, **THEN** their existing computed background colours and the existing theme E2E assertions **SHALL** be unchanged.
- **Notes:** Asset-free SVG data URIs as in `paper.css` (feTurbulence + feSpecularLighting + mahogany streak layer); animate only opacity/transform/background-position; scope every rule under `body.theme-sanguine-atonement`.

### T-057: Play the blood-wash transformation and persist Sanguine from first paint
- **Intent:** [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md)
- **Touches:** `src/components/ThemePicker.tsx`, `src/lib/theme-state.ts`, `src/styles/sanguine.css`, `e2e/theme.spec.ts`, component tests
- **Depends on:** T-055, T-056
- **Acceptance criterion:** INT-0022 AC3.
- **Success criterion (EARS):**
  - **WHEN** an accepted answer is submitted without reduced motion, **THEN** a wash overlay **SHALL** appear, the Sanguine class **SHALL** be applied while the overlay covers the page, and the overlay **SHALL** be removed within 3 seconds.
  - **WHEN** an accepted answer is submitted under `prefers-reduced-motion: reduce`, **THEN** Sanguine **SHALL** apply and no wash overlay **SHALL** be created.
  - **WHEN** a page is reloaded or another page (chapter or Bibliotheca) is opened after acceptance, **THEN** `body` **SHALL** carry the Sanguine class before any island hydrates (observed at `DOMContentLoaded`).
  - **WHEN** Light or Dark is chosen while Sanguine is active, **THEN** that theme **SHALL** apply immediately with no dialog and no wash.
- **Notes:** Transform/opacity-only animation; overlay mounted on `document.body`; listens for `animationend` with a timeout fallback so a missed event cannot strand it.

### T-058: Generate the library outside the tracked tree with a personal manifest and clean copies
- **Intent:** [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md)
- **Touches:** `scripts/load-books.mjs`, `scripts/library-config.mjs`, `scripts/fixture-gate.mjs`, `astro.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `src/lib/book.ts`, `src/pages/[...slug].astro`, `src/pages/search-index.json.ts`, `tome.config.toml` (comments only), loader/gate tests, `docs/intents/INT-0021-safe-consistent-fixture-verification.md` (consequence note)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0023 AC2 (precedence), AC3 (clean checkout), AC4 (copy exclusions), AC5 (existing guarantees).
- **Success criterion (EARS):**
  - **WHEN** the loader runs with a configured book, **THEN** it **SHALL** publish into the generated library and the committed sample and `git status` of tracked files **SHALL** be unchanged.
  - **WHEN** no book is configured, **THEN** the loader **SHALL** publish a byte-equal copy of the committed sample into the generated library, and the default build **SHALL** render the same routes as before.
  - **WHEN** a root-layout book contains `.git/`, `.hg/`, `.svn/`, `node_modules/` (at any depth), a root `book/` build directory (or its `book.toml` `[build] build-dir`), or a root `target/`, **THEN** none of them **SHALL** appear in the library, while every chapter and referenced asset **SHALL** still be copied.
  - **WHEN** `tome.local.toml` and `tome.config.toml` both list books, **THEN** the local manifest **SHALL** win; **WHEN** `TOME_CONFIG` is explicit **THEN** it **SHALL** win over both; **WHEN** `TOME_BOOK(S)` is set **THEN** it **SHALL** win over every manifest; and the owner lookup **SHALL** follow the same manifest.
  - **WHEN** Vitest runs, **THEN** `books()` **SHALL** read the committed sample regardless of any personal library; **WHEN** the default Playwright build runs, **THEN** it **SHALL** build the sample even when a personal manifest exists.
  - **WHEN** a fixture gate runs, **THEN** fixtures **SHALL** publish into the generated library, the tracked-sample guard and strict restoration **SHALL** still apply, and all four gates **SHALL** pass.
- **Notes:** Read the library through one `@library` Vite alias (verified with aliased `import.meta.glob` on Vite 8.2.1); parse glob keys in one helper accepting `content/library/` and `content/books/` roots. Keep `src/content/books/` tracked as the sample/test corpus.

### T-059: Add `books:find` discovery with `--json` and `books:add` into the personal manifest
- **Intent:** [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md)
- **Touches:** `scripts/find-books.mjs` (new), `scripts/library-config.mjs`, `package.json`, `src/lib/__tests__/find-books.test.ts` (new)
- **Depends on:** T-058
- **Acceptance criterion:** INT-0023 AC1 (discovery), AC2 (add, dedupe, never edit tracked files).
- **Success criterion (EARS):**
  - **WHEN** `books:find` scans a tree holding a `book.toml`+`src/` book, a `docs/` book, a root-layout book, two nested `book.toml` editions, a Sprint Book, and decoy `SUMMARY.md` files under `node_modules/`, `.git/`, and a dot-directory, **THEN** it **SHALL** list exactly the real books, once each, never listing a book's own `src/`/`docs/` directory separately.
  - **WHEN** a candidate's `book.toml` declares a missing `src`, **THEN** the scan **SHALL** skip it (reported under `skipped` in JSON) and still exit 0.
  - **WHEN** `--json` is passed, **THEN** stdout **SHALL** be one JSON document `{version: 1, roots, books: [{path, sourceDir, title, chapters, layout, sprintBook}], skipped: [{path, reason}]}` with `chapters` equal to the linked non-draft chapter count.
  - **WHEN** the scan meets a symlinked directory or exceeds `--depth`, **THEN** it **SHALL** not descend.
  - **WHEN** `books:add <path>` names a valid book, **THEN** it **SHALL** append a `[[book]]` entry to `tome.local.toml` (creating it with a header) and print the next command; **WHEN** the same real path is added again **THEN** it **SHALL** not duplicate it; **WHEN** the path is not a book **THEN** it **SHALL** exit nonzero; and in every case `tome.config.toml` **SHALL** stay byte-identical.
- **Notes:** Reuse `resolveBookSource` (scripts/book-source.mjs) and `parseSummary`/`flattenChapters` (src/lib/summary.ts, imported via Node 24 type stripping as `check-search.mjs` already does). Default root: the home directory, depth 5; prune VCS/dependency/build/OS-cache/cloud-sync names; explicit roots are always scanned.

### T-060: Write the find-and-deploy tutorial into the bundled Tome guide and README
- **Intent:** [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md)
- **Touches:** `src/content/books/tome/SUMMARY.md`, three new chapters under `src/content/books/tome/`, `README.md`, `src/lib/__tests__/book.test.ts`, `src/lib/__tests__/tutorial.test.ts` (new), E2E expectations that enumerate sample chapters
- **Depends on:** T-055, T-058, T-059
- **Acceptance criterion:** INT-0023 AC6.
- **Success criterion (EARS):**
  - **WHEN** the default library builds, **THEN** the Tome guide **SHALL** contain a "Your Library" part with "Find your books", "Take it to the table", and "A campaign of tablets" chapters in reading order, reachable and searchable.
  - **WHEN** the tutorial documents an `npm run <script>` command, **THEN** that script **SHALL** exist in `package.json`.
  - **WHEN** the tutorial is read, **THEN** it **SHALL** cover discovery (CLI and manual PowerShell/bash search), the agent recipe using `--json`, adding to `tome.local.toml`, desktop use, same-network tablet serving, live GM edits, static hosting with root-path/privacy/offline caveats, and the sealed-tablet campaign recipe; and the README **SHALL** link it and no longer claim that loading books overwrites the committed sample.
  - **WHEN** a draft SUMMARY entry is linked while `TOME_BOOK=… npm run dev` is running, **THEN** the tutorial's description of whether the new chapter appears without restart **SHALL** match observed behavior.
- **Notes:** Hint the riddle (the Black Door of Cheydinhal) without printing the answer.

## Boundaries

- **Local workspace cleanup (user-approved, never committed) runs at the start
  of Build, not after T-060.** T-060 edits tracked sample files that the
  personal library currently shows as deleted, and the theme tasks' browser
  tests need the sample build. Steps: copy the personal `[[book]]` entry into
  `tome.local.toml`; restore the tracked sample and `tome.config.toml`; delete
  the stale `src/content/books/bible/` copy only after re-verifying it equals
  its source apart from `book.meta.json`. Until T-058 lands, the loader ignores
  `tome.local.toml` and the sample builds, which is what T-055–T-057 need.
- No dependency changes, no font binaries, no committed personal content.
- Push only `dev`; the checkpoint PR is left for human merge.
