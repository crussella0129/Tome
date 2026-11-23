# Plan Critique — Sprint 24

Second review, after the first returned `block` (`critique-round-1.md`). The
reviewer checked each of the seventeen first-round responses against the
revised plans, INT-0029 and the code, and found thirteen to hold as claimed.
Four left a residue, raised again below with eight findings from a fresh
screen. "Why it matters" is condensed from the reviewer's report; each
"Suggested response" ends with what was done.

## Concerns

### C-001: A rootless tome in a library of several has a dead title link in its own sidebar
- **Where:** `build-plan.md` T-070; `test-plan.md` `check_documents_bibliotheca`; `src/components/TocSidebar.tsx`
- **Quote:** "WHEN `tomePages()` is given one tome with a root chapter, or more than one tome, THEN its result SHALL be exactly what it returned before this sprint."
- **Failure mode:** missing-risk
- **Why it matters:** The sidebar's title links to `/<slug>`, and in a library of several no page exists there for a tome without a root chapter. The gate built exactly this case and checked only the Bibliotheca's link.
- **Suggested response:** fix-in-plan — applied: T-070 now adds the page at `/<slug>` too (new clause, `test_pages_rootless_in_library`), the gate checks that the sidebar title's page exists, and INT-0029 AC2 speaks of a tome's own address.

### C-002: A Markdown note's image that exists but cannot be read still stops the whole build
- **Where:** `build-plan.md` T-068; INT-0029 AC4
- **Quote:** "that is a regular file inside the root, THEN the returned text SHALL reference it at `__tome_parent_assets__/<its path from the root>`"
- **Failure mode:** missing-risk
- **Why it matters:** Any regular file a note named as an image was staged, but the build reads only some kinds and throws on the rest, so `![scan](scan.heic)` would pass the loader and fail the build for every tome.
- **Suggested response:** fix-in-plan — applied: T-068 stages PNG, JPEG, GIF, WebP, SVG and AVIF and marks and reports any other kind (`scan.heic` is in `test_prepare_markdown_missing_image`); AC4 says "or is of a kind the build cannot read"; a damaged file with a good name is a recorded consequence.

### C-003: What the Word reader drops without a message is still silent
- **Where:** `build-plan.md` T-066; INT-0029 AC4; `test-plan.md` "By eye"
- **Quote:** "WHEN the Word reader reports an element it did not recognise, other than an equation, THEN the list SHALL hold an entry of kind `other`"
- **Failure mode:** missing-risk
- **Why it matters:** A chart, a diagram or a drawn shape may yield nothing and no warning from the reader, and a chart carries meaning.
- **Suggested response:** fix-in-plan — applied: charts and diagrams are found in the same XML pass as equations, marked `[figure not shown]` and reported (new clause, `test_docx_figures_marked`, AC4); the same test records what the reader does with a plain shape, which INT-0029's consequences name as not carried over; the by-eye checklist gains "anything absent from the page with no mark".

### C-004: One Word document that cannot be opened refuses the whole library, and only the plan says so
- **Where:** `build-plan.md` T-069, T-071; INT-0029 AC1 and Alternatives
- **Quote:** "WHEN any entry cannot be resolved, or a Word document cannot be opened, THEN the loader SHALL exit nonzero"
- **Failure mode:** intent-drift
- **Why it matters:** The intent argues that one broken image should not stop the rest from being read, yet one unreadable document in a folder of fifty would.
- **Suggested response:** fix-in-plan — applied, with the same treatment as a broken image: inside a folder the document's chapter becomes a placeholder that says so, the load names it and exits 0 (T-068 `placeholderDocument`, T-069 clause 5, `test_loader_folder_unreadable_document`). An entry that names one document directly still fails, and `books:add` refuses it. Both are in INT-0029 AC4 and Alternatives.

### C-005: T-067 changes realized search behaviour for mdBooks in plan prose only, and leaves heading anchors out
- **Where:** `build-plan.md` T-067; INT-0029 Consequences; `src/lib/search-index.ts`
- **Quote:** "It also applies to an mdBook chapter that holds HTML, where tags are indexed as words today; that is a correction"
- **Failure mode:** intent-drift
- **Why it matters:** The change to an mdBook chapter's search text lived only in a task note. And a heading that holds a tag would get a search slug that is not the anchor the page gives it, so a result's link would point nowhere.
- **Suggested response:** fix-in-plan — applied: INT-0029's consequences state the search change; T-067 gains a clause for heading text and slug with a test, and the gate checks every heading slug of the Word chapter against the built page's ids (`check_documents_heading_ids`).

### C-006: T-071's test needs the loader, which T-071 does not depend on
- **Where:** `build-plan.md` T-071 "Depends on"; `test-plan.md` `books:add` integration
- **Quote:** "the output names the same title the loader writes to `book.meta.json` for that entry"
- **Failure mode:** hidden-dep
- **Why it matters:** The test runs the loader on a document, which works only after T-069.
- **Suggested response:** fix-in-plan — applied: T-071 depends on T-069 as well, and the integration heading lists T-066 and T-069.

### C-007: The marks as the clauses spell them are not what the Markdown writer emits
- **Where:** `build-plan.md` T-066, T-068; `test-plan.md` `test_docx_equations_marked`
- **Quote:** "the Markdown SHALL hold `[equation not shown]` in its place"
- **Failure mode:** EARS-vague
- **Why it matters:** The Markdown writer escapes `[`, so a literal string assertion fails; and a raw mark written in place of an image can become a link label.
- **Suggested response:** fix-in-plan — applied: a clause says a mark is literal text with its brackets escaped, so the chapter reads it exactly and it can never form a link; the clauses speak of what the chapter reads; the tests parse the Markdown and look at its text (`test_docx_marks_are_literal`, and the `(see below)` case for images).

### C-008: Two half-clauses have no check, and one promises more than the gate pattern does
- **Where:** `build-plan.md` T-073 clause 2, T-072 clause 2; `test-plan.md` Gate safety, Dev server
- **Quote:** "WHEN a build or a check fails, THEN it SHALL exit nonzero and still restore the default library"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** The gate pattern restores the tracked sample on failure; it does not rebuild the default library, and nothing tested a failing build or the absence of a watcher.
- **Suggested response:** fix-in-plan — applied: the clause now promises what the pattern gives (nonzero, tracked sample as it was, temporary folder removed) with `test_documents_gate_cleans_up_on_failure`; the dev-server check edits the document and looks for no `synced` line.

### C-009: AC3 says the rail lists Heading 1, 2 and 3 under a Title; the rail cannot list the third
- **Where:** INT-0029 AC3; `build-plan.md` T-066; `src/pages/[...slug].astro`
- **Quote:** "Heading 1, 2 and 3 become the sections below it, which the \"on this page\" rail lists"
- **Failure mode:** intent-drift
- **Why it matters:** Under a Title, Heading 3 becomes a fourth-level heading, and the rail keeps levels 2 and 3 only.
- **Suggested response:** fix-in-plan — applied: AC3 says Heading 1 and 2 are the sections the rail lists and Heading 3 sits below them; the E2E names the entries expected and the one not.

### C-010: The deferred real-Word check can pass on nothing, and comes after the build
- **Where:** `test-plan.md` "By eye (owner), with a checklist"; `build-plan.md` Boundaries
- **Quote:** "the test report records present-and-right, present-and-wrong, or not in the paper"
- **Failure mode:** missing-risk
- **Why it matters:** A paper with no footnote, table or image proves nothing about the hand-written fixture's blind spot, and a fault found at the Test phase leaves no room to fix the converter.
- **Suggested response:** defer-with-rationale, tightened — applied: the papers read must between them hold headings, a footnote, a table and an image, or another is asked for; and the conversion is run on a real paper as soon as T-066 passes if the owner has given one (`verify_real_paper_converts`). The fixture stays hand-written because a real paper is the owner's own writing and is not committed.

### C-011: Two gaps in what counts as which source
- **Where:** `build-plan.md` T-065 clauses 1, 3 and 4
- **Quote:** "or a subfolder that holds a `book.toml` or a `SUMMARY.md`"
- **Failure mode:** EARS-vague
- **Why it matters:** A nested mdBook whose spine is under `docs/` was not skipped by the walk, and a mistyped document path got the mdBook message.
- **Suggested response:** fix-in-plan — applied: the walk skips a subfolder by the same test that makes a folder a book (`proj/docs/SUMMARY.md` is in `test_source_folder_walk`), and a missing path that ends in `.md` or `.docx` gets a file-not-found message.

### C-012: Links from one note to another are not mentioned anywhere
- **Where:** INT-0029 Consequences; `build-plan.md` T-065, T-074
- **Quote:** "every other document SHALL be its path with each segment slugified and the extension `.md`"
- **Failure mode:** intent-drift
- **Why it matters:** Tome does not turn a link to a file into a link to its chapter, so notes that point at each other have dead links, and neither the intent nor the tutorial said so.
- **Suggested response:** defer-with-rationale — applied: INT-0029's consequences state it and leave it for the editor (INT-0026), where notes are written and linked; the tutorial clause covers it. No work this sprint.

## Confidence
proceed-with-caveats
