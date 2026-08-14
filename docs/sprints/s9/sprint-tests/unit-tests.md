# Sprint 9 Unit and Static Tests

- **Tested head:** `777f6fe160bc7d111bbf8c99fca93e48004f9ee2`
- **Task commit:** `fc1b8f4` (`sprint-9: T-206 prepare and browser-verify parent-relative external assets`)

## Markdown destination and containment contract

The focused post-review run passed **30/30** tests across
`parent-assets.test.ts` and `load-books.test.ts`.

- `test_image_destination_token_offsets` passed for bare and angle-bracket
  inline-image destinations with escaped parentheses, titles, query/fragment
  suffixes, and leading multibyte text. The recorded source slices were exactly
  the concrete destination tokens; links, references, and inline/fenced code
  produced no rewritable span.
- `test_prepare_parent_asset_rewrites_root_and_nested` passed with one root and
  one nested chapter. Each destination received the correct forward-slash URL,
  all bytes outside the destination token remained unchanged, and only the
  referenced regular file was copied below `__tome_parent_assets__`; an
  unreferenced root-sibling decoy was explicitly absent.
- `test_prepare_parent_asset_preserves_non_targets` passed byte-for-byte for
  in-source root/nested images, HTTP/data/root URLs, links, references, a
  backslash-escaped image example, and inline/fenced code, with no private asset
  directory created.
- `test_parent_asset_cross_platform_paths` passed POSIX and Windows descendant,
  traversal, and cross-drive cases and proved generated Markdown uses `/`.
- `test_parent_asset_rejects_symlink_escape` executed on the local platform and
  rejected a physical link outside the configured book root.

## Real loader filesystem contract

- `test_load_books_parent_asset` passed: the loader privately copied and
  rewrote a root-sibling asset, left an unreferenced sibling decoy uncopied,
  wrote metadata, and left no staging residue.
- `test_load_books_parent_asset_isolation` passed with two tomes containing the
  same relative asset name but distinct bytes; each output stayed slug-private.
- `test_parent_asset_errors_are_atomic_across_tomes` passed **6/6** parameter
  cases: missing file, directory, ordinary reserved-directory collision,
  nested reserved-directory bypass attempt, malformed percent encoding, and
  lexical escape. Each later-tome failure named the chapter and URL, retained
  the existing destination sentinel, published no earlier tome, and removed
  sibling staging.
- `test_declared_source_outside_root` passed both successful and rejected-target
  branches; the platform-supported symlinked declared-source test also passed.
  Authoritative source placement therefore remains independent of target
  confinement.

These tests use real temporary files, directories, and links; no filesystem
mocks mirror the implementation.

## Canonical regression suite

`npx vitest run` → **64 passed / 0 failed / 64 total** across **10 files**,
locally and in hosted CI.

## Static and Animus Neutronium gates

- `npx astro check` → **0 errors / 0 warnings / 0 hints** across 38 files,
  locally and in hosted CI.
- `bash /tmp/Animus_Neutronium/scripts/audit.sh src/` → **passed**. Its two
  warnings are reviewed pre-existing `.map()` data transforms in
  `TocSidebar.tsx` and its test, not JSX rendering defects. T-206 changes no UI,
  island, hydration, or design contract.
