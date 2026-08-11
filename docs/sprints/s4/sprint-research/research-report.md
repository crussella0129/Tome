# Sprint 4 Research Report

## Intents Reviewed
- [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md) — created; relevance: this sprint delivers all five criteria (auto-detect the source dir + title fallback so books without `book.toml` load directly); current state: `proposed` (→ `planned` in Plan).

## 1. Sprint Goal

Make `TOME_BOOK=/path/to/any/book` work for books that don't fit the strict
`book.toml` + `src/SUMMARY.md` shape. Concretely: when there is no `book.toml` (or
the declared/default source has no `SUMMARY.md`), auto-detect the source directory
by locating `SUMMARY.md` in `src/`, then `docs/`, then the root; honor an explicit
`book.toml` `src` when present; fall back to the root directory name for the title
when `book.toml` has no title; and fail with a clear, enumerated error when no
`SUMMARY.md` is found. No regression for standard mdBooks or the bundled sample.

## 2. Existing Code Survey

| File | Relevance | Notes |
|------|-----------|-------|
| `scripts/load-book.mjs` | high | Today: reads `book.toml` for `title`/`src` (default `src`), then requires `<root>/<src>/SUMMARY.md` or errors. The detection order and title fallback are added here — the only production change. |
| `src/lib/book.ts` | med | `resolveTitle(metaTitle, summaryTitle)` already falls back to the SUMMARY heading; the loader now supplies a directory-name title so `book.meta.json` is rarely null. No change expected. |
| `src/lib/__tests__/load-book.test.ts` | high | Subprocess integration tests; gains cases for a `docs/`-layout book, a no-`book.toml` book, a title-from-dirname assertion, and the enumerated error. |
| `fixtures/handbook/**` | med | The standard fixture (book.toml + src/) — the backward-compat / regression case. A new `docs`-layout fixture mirrors CubiKan. |
| `scripts/check-external-build.mjs` | med | The external build gate; may gain a second book (docs-layout) to prove end-to-end detection. |
| `README.md` | low | Document that `book.toml` is optional and the `src`→`docs`→root detection order. |

## 3. External Sources

- [mdBook — `book.toml` configuration](https://rust-lang.github.io/mdBook/format/configuration/general.html) — `[book].src` defaults to `src`; `book.toml` and its fields are optional. Confirms `src/` as the primary candidate and that a missing `book.toml` is a legitimate (config-less) book.
- **CubiKan observation (this repo's Sprint 4 demo, internal):** `C:/Users/charl/CubiKan` has **no `book.toml`**, a `docs/` source with `docs/SUMMARY.md`, 132 markdown chapters, and 0 images. It loaded in Tome only after a hand-built wrapper (`book.toml` with `src = "docs"`). This is the concrete case criterion 1/3 target: `TOME_BOOK=…/CubiKan` should detect `docs/` and title it "CubiKan" from the directory name.

## 4. Risks, Unknowns, Dependencies

- **Risk: ambiguous roots.** A root with both `src/SUMMARY.md` and `docs/SUMMARY.md`. Mitigation: a fixed, documented order (`book.toml src` → `src` → `docs` → root); first match wins, deterministic.
- **Risk: title-from-dirname surprises.** A trailing slash or odd path could yield an empty/ugly basename. Mitigation: normalize the path, strip trailing separators; if the basename is empty, fall back to the SUMMARY heading (existing `resolveTitle`).
- **Risk: root-as-source over-copy.** Detecting `SUMMARY.md` at the *root* would copy the entire root (could include large sibling dirs). Mitigation: root is the **last** candidate and only chosen when `src/`/`docs/` lack a SUMMARY; document it and keep copying scoped to the detected source dir only.
- **Unknown: none material** — this is self-contained loader logic; the render pipeline is unchanged.
- **Dependency: none new.**

## 5. Recommended Approach

Primary: extend `load-book.mjs` with a `resolveSource(root, tomlSrc)` step that
returns the first candidate directory containing `SUMMARY.md`, checked in order:
the `book.toml` `src` (if declared), `src/`, `docs/`, then the root. Title becomes
`book.toml.title || basename(root)` (written to `book.meta.json`; `book.ts` still
falls back to the SUMMARY heading if both are empty). On no match, error listing
each candidate path tried. Add a `docs`-layout fixture (no `book.toml`, mirroring
CubiKan) and extend the integration tests + external build gate; document that
`book.toml` is optional.

Alternative considered: only support an explicit `book.toml src`. Rejected — it is
exactly the wrapper friction this intent removes.

Rationale: a handful of lines of ordered detection in one script turns "wrap it
first" into "point at it", validated directly against the CubiKan-shaped case,
with zero change to rendering and full backward compatibility.

## Artifacts
- Reviewed intent: [INT-0004](../../../intents/INT-0004-flexible-book-source-detection.md).
- Prior realized foundation: [INT-0002](../../../intents/INT-0002-load-external-mdbooks.md) (the loader this extends), reused unchanged for render/route/style.
