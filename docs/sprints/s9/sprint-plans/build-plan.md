Finalized - DO NOT EDIT

# Sprint 9 Build Plan

## Intents

- [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md) — state: planned; acceptance criteria covered: 1–4.
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — state: realized; existing source-contained relative-image behavior is regression provenance only, with no lifecycle change.
- [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) — state: realized; authoritative declared-source behavior is regression provenance only, with no lifecycle change.

## Schema Tree

- Parent-relative external assets
  - T-206: Prepare and verify tome-private parent-relative image assets

## Execution Sequence

### T-206: Prepare and verify tome-private parent-relative image assets
- **Intent:** [INT-0007](../../../intents/INT-0007-parent-relative-external-assets.md)
- **Touches:** `package.json`, `package-lock.json`, `scripts/parent-assets.mjs` (new), `scripts/load-books.mjs`, `src/lib/__tests__/parent-assets.test.ts` (new), `src/lib/__tests__/load-books.test.ts`, `fixtures/handbook/src/first.md`, `fixtures/handbook/assets/parent-plate.svg` (new), `scripts/check-external-build.mjs`, `e2e/external-book.spec.ts`
- **Depends on:** existing `resolveBookSource()` root/source distinction, loader resolve-all-first contract, external handbook gate, isolated external Playwright mode, and `mdast-util-from-markdown@^2` positional CommonMark AST.
- **Acceptance criterion:** INT-0007 criteria 1–4: referenced-only private rehoming/rewrite, pre-mutation containment failure, unchanged in-source/non-local behavior with tome isolation, and generated-output plus Chromium proof.
- **Success criterion (EARS):**
  - **WHEN** a recognized local inline Markdown image resolves outside `sourceDir` but inside the external book's real root, **THEN** parent-asset preparation **SHALL** copy only that regular file below the staged tome's reserved private asset directory and replace only its concrete destination-token span with the correct forward-slash relative URL from either a root or nested chapter, preserving the remaining Markdown and chapter route.
  - **IF** a recognized parent-relative image is missing, targets a directory or reserved-directory collision, has malformed encoding, or lexically/physically escapes the external book root, **THEN** the loader **SHALL** identify the chapter and offending destination, fail before replacing the destination library, and remove staging already prepared for every earlier tome.
  - **WHEN** an image remains inside `sourceDir`, uses a non-local destination, appears only inside code, an authoritative declared source is outside/symlinked beyond the book root, or two tomes reference equal parent-asset names, **THEN** preparation **SHALL** leave non-target syntax and declared-source behavior unchanged, independently confine target assets to the book root, and keep prepared assets isolated beneath their owning tome.
  - **WHEN** the canonical handbook builds and opens in external Chromium mode, **THEN** the existing in-source plate and the new genuine `src/first.md → ../assets/parent-plate.svg` image **SHALL** both emit through optimized `/_astro/` URLs, while the new image is visible, decodes with positive natural width, and retains a positive sacred-prose border width.
  - **WHEN** the T-206 change set is verified, **THEN** the Animus Neutronium audit, Astro check, Vitest suite, ordinary bundled-reader Playwright suite, external-book gate, and multi-book gate **SHALL** pass without application, island, report, cleanup, or routing regression.
- **Notes:** Supply `mdast-util-from-markdown` a custom `exit.resourceDestinationString` handler that mirrors the built-in `resume()` plus current-node URL assignment and additionally records the token's exact start/end offsets only for inline `image` nodes. Apply replacements in descending offset order; do not treat whole-node positions as URL positions and do not serialize the tree. Direct tests cover angle-bracket destinations, escaped parentheses, titles, leading Unicode, and query/fragment semantics. Traverse staged Markdown recursively, reject a pre-existing reserved asset directory, and derive each generated URL with `path.relative()` from that staged chapter before normalizing separators to `/`; test both root and nested chapters. Containment helpers must reject `..`, absolute `path.relative()` results (Windows cross-drive), and physical `realpath` escapes while allowing INT-0004's authoritative source itself to be external. Build every configured tome and metadata below a unique same-filesystem sibling stage before removing/replacing `dest`; a `finally` removes that stage after any later-tome failure. Avoid copying whole book roots. Reference-style images, HTML `<img>`, CSS URLs, document links, and root-sibling live reload remain outside INT-0007.
