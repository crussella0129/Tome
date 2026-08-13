# Sprint 9 Research Report

## Intents Reviewed

- [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) —
  created and selected in `proposed` state for T-206. It defines safe,
  tome-private support for local inline Markdown images outside the detected
  source directory but inside the external book root.
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) —
  reviewed and retained as `realized`. Its ordinary `./diagram.png` outcome is
  not reopened; Sprint 9 preserves that regression as provenance.
- [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) —
  reviewed and retained as `realized`. Authoritative declared sources remain
  supported even when their lexical or physical path is outside the book root;
  parent-asset targets are independently confined to the book root.

## 1. Sprint Goal

Deliver T-206, the first feasible backlog item: make a chapter such as
`src/first.md` safely render `../assets/plate.svg` when the asset is a sibling of
the declared `src/` directory. Prove preparation before mutation, per-tome
isolation, Astro optimization, browser decode, and continued support for the
existing source-contained `./img/plate.svg` case. Do not broaden this sprint to
HTML/CSS URLs, reference-style Markdown images, arbitrary files outside the
book root, or live reload of root-sibling assets.

## 2. Existing Code Survey

Fifteen relevant project files were inspected, within the 20-file budget:

| File | Finding |
|------|---------|
| `docs/work/tasks.md` | T-206 precedes T-208 and is feasible; it is selected by backlog order. |
| `docs/intents/INT-0003-richer-external-book-support.md` | Realized criterion 1 covers an in-source `./diagram.png`, not a book-root sibling. |
| `docs/intents/INT-0004-flexible-book-source-detection.md` | A declared source is authoritative and may not be assumed to reside inside the book root. |
| `scripts/load-books.mjs` | Resolves every book before mutation but copies only `sourceDir`, dropping `bookRoot/assets`. |
| `scripts/book-source.mjs` | Already returns both `root` and `sourceDir`; its containment vocabulary can be reused. |
| `src/lib/__tests__/load-books.test.ts` | Has hermetic temp-book helpers and resolve-all-first failure coverage suitable for focused loader tests. |
| `fixtures/handbook/book.toml` | Declares `src = "src"`, making a sibling `assets/` fixture a genuine parent-relative case. |
| `fixtures/handbook/src/first.md` | Existing `./img/plate.svg` is the necessary source-contained regression. |
| `fixtures/handbook/src/section/nested.md` | Shows why `section/../img` would remain inside `sourceDir` and would not reproduce the defect. |
| `scripts/check-external-build.mjs` | Already serializes fixture builds/browser proof and strictly restores the committed library. |
| `e2e/external-book.spec.ts` | Existing semantic image/decode assertions can be extended with a unique parent-asset alt name. |
| `src/pages/[...slug].astro` | Astro imports copied Markdown from each tome; a rewritten in-tome relative URL stays on its normal optimizer path. |
| `playwright.config.ts` | External mode is isolated, prebuilt, one-worker, and needs no configuration change. |
| `.github/workflows/ci.yml` | The existing external gate already owns Chromium and requires no step-order change. |
| `package.json` | No direct Markdown AST parser is declared; add the maintained `mdast-util-from-markdown@^2` runtime dependency rather than inventing a global regex parser. |

Root cause: `load-books.mjs` copies `<book>/src` directly to
`src/content/books/<slug>`. For `<book>/src/first.md`, the untouched
`../assets/x.png` then resolves outside `<slug>`, while `<book>/assets/x.png`
was never copied. A nested chapter whose `../` remains under `<book>/src`
already works and would be a false-positive fixture.

## 3. External Sources

- [mdast-util-from-markdown — official syntax-tree repository](https://github.com/syntax-tree/mdast-util-from-markdown) — the maintained `^2` ESM API parses CommonMark into mdast with source positions and is intended for manual syntax-tree handling. This supports changing only recognized inline-image destination spans instead of regex-rewriting arbitrary Markdown.
- [micromark — official parser repository](https://github.com/micromark/micromark) — the underlying parser emits concrete tokens in which every byte has positional information. `mdast-util-from-markdown` exposes token exit hooks, allowing an image destination token's exact offsets to be recorded while preserving the normal parsed URL.

## 4. Risks, Unknowns, Dependencies

- **Markdown parsing:** a global regex could rewrite examples inside code or
  mishandle titles/escapes. Use Markdown-aware positions or a deliberately
  bounded inline-image scanner with direct syntax tests; do not rewrite prose
  wholesale.
- **Containment:** lexical `..` checks alone miss symlink escapes. Resolve the
  book root and target physically, reject files outside the real root, and
  require a regular file. Do not assume `sourceDir` itself is contained by the
  root: INT-0004 makes an explicit declared source authoritative.
- **Destructive replace:** all transformed books and parent assets must be
  staged before `rm(dest)`, preserving the current resolve-all-first guarantee.
- **Isolation:** never place assets in a shared `books/assets` directory. Rehome
  each referenced asset below its own staged tome so equal names cannot collide.
- **Shared test state:** external builds mutate `src/content/books/` and `dist/`.
  Retain the existing pristine preflight, serial cases, strict restoration, and
  final default rebuild.
- **Dependency:** the current external CI gate already installs Chromium and
  runs after ordinary E2E; no workflow or Playwright-mode change is needed.

## 5. Recommended Approach

Add `mdast-util-from-markdown@^2` and a referenced-only preparation layer used
by `load-books.mjs`. Override only the parser's
`resourceDestinationString` exit hook: mirror its normal `resume()`/URL
assignment and record exact token offsets when the current node is an inline
image. Patch those token spans without serializing the document. For each
configured tome, copy its detected source into a sibling temporary staging
directory, scan copied Markdown, and leave in-source or non-local destinations
unchanged. Resolve targets from the lexical chapter/source path; independently
require any target outside `sourceDir` to be lexically and physically contained
by the real book root, even when an authoritative source itself is external or
symlinked. Copy valid regular files under a reserved tome-private asset
directory and generate the correct forward-slash relative URL from each staged
chapter, including nested chapters. Prepare every tome and its metadata before
replacing the destination library, then rename the same-filesystem stage into
place. Always clean temporary staging.

Extend hermetic loader tests for success, unchanged in-source/non-local URLs,
missing/escape failure without destination mutation, and cross-tome isolation.
Add a real `fixtures/handbook/assets/` image while retaining the current
`src/img/` image. Extend the external generated-output gate to require both
optimized assets and extend Chromium E2E to decode/style the uniquely named
parent-relative image. Run the Animus Neutronium mechanical audit plus Astro,
Vitest, ordinary Playwright, external, and multi-book gates; this work changes
no visible design or island behavior.

## Artifacts

- [INT-0007 — Parent-relative external assets](../../../intents/INT-0007-parent-relative-external-assets.md)
- [INT-0003 — Richer external-book support](../../../intents/INT-0003-richer-external-book-support.md)
- [T-206 backlog](../../../work/tasks.md)
- Read-only T-206 feasibility review and independent test-architecture review
  summarized in sections 2–5; no separate durable artifact was created.
