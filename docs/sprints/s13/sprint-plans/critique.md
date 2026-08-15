# Plan Critique — Sprint 13

## Concerns

### C-001: Criterion 2 says footnotes are "styled", but the test only checks the link chain
- **Where:** `INT-0011` criterion 2 vs. `test-plan.md` `test_reader_footnote_links`.
- **Quote:** "styled in the sacred idiom (the footnotes section, the superscript refs, the back-references)".
- **Failure mode:** plan-test-mismatch (weak-assertion)
- **Why it matters:** the E2E asserts the ref → note → back-ref *links* resolve, but not
  that Tome's sacred styling actually applies — the criterion's "styled" clause would be
  unverified (a footnote could be unstyled and still pass).
- **Suggested response:** fix-in-plan — extend `test_reader_footnote_links` with a light
  computed-style assertion that the footnotes section is visibly set off (e.g. a
  non-zero top border from the sacred rule) and the ref renders superscript
  (`vertical-align: super` / a smaller font), mirroring the existing
  `test_chapter_prose_elements_styled` computed-style pattern.

### C-002: T-030 bundles footnotes and the print stylesheet (two concerns)
- **Where:** `build-plan.md` T-030 (footnote styling + rail filter + `print.css`).
- **Quote:** "Footnote styling + rail filter + print stylesheet".
- **Failure mode:** granularity
- **Why it matters:** footnotes and printing are arguably separate features.
- **Suggested response:** reject — both are small, additive **CSS-layer** changes (a few
  rules each) delivered as one styling-polish task with its own tests; splitting a
  ~20-line `@media print` block into its own task adds ceremony without independent
  shippable value. The rail filter sits with footnotes because it exists only to keep the
  GFM footnote label out of the rail.

### C-003: T-029 and T-030 both edit `prose.css`
- **Where:** `build-plan.md` T-029 (admonition styling) ∩ T-030 (footnote styling).
- **Quote:** "`src/styles/prose.css`" in both.
- **Failure mode:** hidden-dep
- **Why it matters:** two tasks touching one file can conflict.
- **Suggested response:** reject — the tasks are independent and execute sequentially,
  each **appending a distinct rule block** (admonitions vs. footnotes) to `prose.css`;
  there is no shared symbol or ordering dependency.

## Confidence
proceed-with-caveats
