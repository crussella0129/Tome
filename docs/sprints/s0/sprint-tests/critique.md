# Test Critique — Sprint 0

## Concerns

### C-001: Criterion 5's element set was only partially asserted
- **Where:** `INT-0001` Acceptance criterion 5 vs. `e2e-tests.md` / `test-plan.md` criterion-5 row.
- **Quote:** criterion 5 requires rendering that covers "headings, paragraphs, ordered/unordered lists, fenced code blocks, inline code, blockquotes, tables, links, and images".
- **Failure mode:** intent-coverage
- **Why it matters:** the initial E2E asserted only fenced code, `h2`, ordered list, and inline code — leaving blockquotes, tables, links, and images unproved even though the sample book renders most of them and `prose.css` styles them.
- **Suggested response:** add-test — done: `test_chapter_prose_elements_styled` now also asserts a link and a bordered `table th` on `/components` and an accent-ruled `blockquote` on `/components/panels`. **Images remain unasserted** because the bundled sample ships no image; their `prose.css` styling exists but is unexercised. That single element is deferred to a later sprint that adds an image-bearing chapter — the reason this verdict is `proceed-with-caveats`, not `clean`.

### C-002: No CI; provenance is local-only
- **Where:** `unit-tests.md` / `e2e-tests.md` head SHA vs. a CI conclusion.
- **Quote:** "CI not configured — local confirmations only".
- **Failure mode:** evidence-drift
- **Why it matters:** the pass rests on local runner output rather than a reproducible CI conclusion; a reader cannot re-verify from a run URL.
- **Suggested response:** defer-with-rationale — Sprint 0 is greenfield; the remote profile (github/dev) exists but no workflow is wired yet. Result artifacts pin the tested head SHA (`3e950be`) and exact commands so the runs reproduce locally. Wiring CI is reasonable follow-on work, not a blocker for this sprint's verification.

## Confidence
proceed-with-caveats
