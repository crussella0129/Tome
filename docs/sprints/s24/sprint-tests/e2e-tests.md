# Sprint 24 End-to-End Verification

- **Tested head:** `36b5db1`. Four gates were run in sequence on this machine
  at that head and each exited 0: `check:documents`, `check:external`,
  `check:multibook`, `check:search`. The same four passed at `ef6d924` (the
  build's last task), `28e3490`, `f2ac541` and `19bbfc5`.
- **`check:livereload` is intermittent, and was before the sprint.** It
  passed its single run at `ef6d924` and at `28e3490`, failed 2 of 4 runs at
  `f2ac541`, and failed 1 of 4 at `19bbfc5`, each time with "the edit did not
  appear in the reader within the timeout". It was not run again at
  `36b5db1`, whose changes touch only the Word converter and search text. This departs from the test plan,
  which counted on that gate passing as part of the proof that an mdBook's
  live reload is unchanged. See "Live reload" below for what that proof rests
  on now.
- `npx playwright test` (Chromium, the sample build with the new guide
  section in it): **39 passed**, as before the sprint.

## `npm run check:documents` (T-073)

The gate copies `fixtures/papers/` to a temporary folder, adds two Word
papers zipped from `fixtures/word/paper/` (the second with a title and a
closing sentence of its own, in `letters/`), builds with `TOME_BOOK`, checks
the built `dist/`, runs `e2e/documents.spec.ts` in Chromium, builds again
beside an mdBook, builds a third time on one Word document alone, and rebuilds
the default library.

| Test | Clause | What it saw | Result |
|---|---|---|---|
| `test_documents_root_and_sidebar` | 4 | `/` shows "First Note" with no front matter; sidebar links, in order, `First Note`, `On the Weight of Obsidian`, `A Letter`, `A Second Paper` at `/1-first-note`, `/3-paper`, `/letters/2-letter`, `/letters/paper`; the part `letters`; the first marked current | pass |
| `test_documents_word_chapter` | 5 | one `h1`, the Title; rail `The Quarry`, `Tools`, `Washing in H2O`, `The Measure`, and `Links` only as an `h4`; `strong`, `em` and `del` hold the bold, slanted and struck words; a bulleted and a numbered list of two items each; the footnote reference's address becomes the page's, its note "The quarry lies north of the river." is in view, the note's back-link names the reference's `id` and following it makes that the page's address; two notes; `th` cells `Tablet`, `Weight`; the image decoded; `sup` holding `2`; `[equation not shown]` twice, once directly before `(see the table)` | pass |
| `test_documents_nested_word_image` | 6 | "A Second Paper" in `letters/`; its image loaded | pass |
| `test_documents_no_unsafe_links` | 7 | no `javascript:` or `file:` link on the page; "the trapdoor", "the cellar" and "the quarry section" visible and inside no link; the web and mail links intact | pass |
| `test_documents_search` | 8 | `Zyzzyva` offers one result, `/3-paper`, and opens it | pass |
| `test_documents_markdown_images` | 9 | the note's one image loaded; `[image not shown]` visible | pass |
| `check_documents_search_index_unique` | 8 | `search-index.json` URLs are exactly the four chapters; none for the page at `/` | pass |
| `check_documents_heading_ids` | 8 | every heading slug in the Word chapter's record, `washing-in-h2o` among them, is an `id` in `dist/3-paper/index.html` | pass |
| `check_documents_bibliotheca` | 10 | with `TOME_BOOKS` = handbook + the folder: `/` names both tomes; the folder's link is `/papers/1-first-note` and exists; `/papers` exists and shows the first note's `h1`; a chapter page of that tome links its sidebar title to `/papers` | pass |
| `check_documents_single_word` | 1, AC1 | with `TOME_BOOK` naming one `.docx`: `/` shows the paper under its Title, its image is in the build, the equation mark is there, and `search-index.json` holds one record, at `/` | pass |
| gate run as a whole | 1 | temporary copy, all three builds, browser run, default rebuild; exit 0 | pass |
| `test_fixture_commands_refuse_dirty_content` with `check-documents.mjs` (Vitest) | 2 | on dirty content: nonzero, "refusing destructive fixture sync", no build run | pass |
| `test_documents_gate_cleans_up_on_failure` (Vitest) | 2 | a failing build: nonzero, the sample as it was, the temporary folder gone | pass |
| `test_ci_workflow_valid` (Vitest) | 3 | the workflow runs `check-documents.mjs` | pass |

## Existing gates, unchanged scripts

| Gate | Result |
|---|---|
| `check:external` — handbook and docs-book, 3 browser tests | pass |
| `check:multibook` — two-tome Bibliotheca, namespaced routes, switcher | pass |
| `check:search` — single-tome and two-tome index | pass |
| `check:livereload` — an mdBook's live edit appeared, parent image resolved, no restart | intermittent, as before the sprint: 2 of 4 runs passed at `f2ac541`, 3 of 4 at `19bbfc5` (see below) |

## Live reload: an intermittent fault older than the sprint

`check:livereload` is a local gate, not in CI. At `f2ac541` it failed two runs
in four. The same scenario was then repeated with a script that also reads the
dev server's log (start the server on a copy of the handbook, wait for the
chapter, edit its source, wait up to 25 seconds). The script is kept as
`evidence/live-reload-repeat.mjs`; its output was read at the time and is
tabled here, not stored:

| Code | Where | Edit seen | Edit not seen in 25 s |
|---|---|---|---|
| `f2ac541` (this sprint) | the checkout | 4 | 2 |
| `f2ac541` (this sprint) | a clean clone | 7 | 1 |
| `06cdbcd` (before the sprint) | a clean clone | 9 | 7 |

In every failing run the watcher did its part: the log holds `live reload
watching` and one `synced … → reloading` line. The dev server then went on
serving the old page for the full 25 seconds. When the edit is seen, it is
seen within about 70 ms.

So the fault is in live reload as it was before this sprint
([INT-0009](../../../intents/INT-0009-live-reload-parent-assets.md), which now
carries a note of it). These samples show it no more frequent with this
sprint's code than without it; they are too small to say it is rarer.

What criterion 7 rests on for live reload, then, is not this gate passing but
three things: the fault is present before the sprint at least as often; the
sprint's only change to the hook runs before the watcher is added, and in
every failing run the watcher had already logged the sync; and in the runs
where the edit is seen, an mdBook's live reload behaves as it did. The sprint's own
change to that path is the notice for documents, which the table in
`integration-tests.md` shows working, with an mdBook's live reload working in
the same run. It is queued as T-075 in the backlog and is not fixed here.

## What the built pages look like

Captured from the same build the gate makes, at 1440 × 900:

- `evidence/word-chapter-light-full.png` — the whole Word chapter: Title,
  sections, lists, links as text or links, the table with its header, both
  equation marks, the footnotes.
- `evidence/word-chapter-dark.png`, `evidence/word-chapter-sanguine.png` —
  the same chapter in the other two themes.
- `evidence/markdown-note-light.png` — the note, its image, and the mark for
  the missing one.

The fixture's picture is one pixel square, so it is there but not seen in the
captures; the tests check that it loaded.

## By eye: real Word files, at the owner's direction

The test plan asked for a paper of the owner's, holding between them headings,
a footnote, a table and an image. On 23 November 2026 the owner asked instead
for an example found online ("find an example with headings online for a .docx
to make sure this works properly"). Twelve documents saved by Word itself, from
the pandoc project's tests, were converted, built as a tome and read in the
browser; the table of what each showed is in `integration-tests.md`. Between
them they hold everything the checklist names but an equation and a chart:

| Checklist item | Seen in | Result |
|---|---|---|
| the title as the page's heading | `headers.docx` | present and right |
| sections in the rail | `headers.docx` (Second Level, Third level) | present and right |
| a list | `lists.docx` (nested) | present and right |
| a table with its header | `table_one_header_row.docx`, `table_with_list_cell.docx` | present; **wrong before the fix** when a cell held a list, right after |
| a footnote there and back | `notes.docx` (a footnote and an endnote) | present and right |
| an image | `image.docx` (a JPEG, shown 485 px wide) | present and right |
| superscript or subscript | `inline_formatting.docx` | present and right |
| a web link | `links.docx` | present and right |
| a cross-reference shown as text | `links.docx`, `nested_anchors_in_header.docx` | present and right |
| an equation's mark and the load's count | none of the twelve holds one | not in the papers; proved on the committed fixture only |
| a chart's mark | none of the twelve holds one | not in the papers; proved on fixture variants only |
| anything the load reported as not recognised | `headers.docx` reported an undefined style | **wrong before the fix** (nothing had been left out), silent after |
| anything absent from the page with no mark | `block_quotes.docx`: the quotations had become ordinary paragraphs | **wrong before the fix**, block quotations after |

Four of the pages were captured and shown to the owner (six heading levels,
block quotations, the table with lists in its cells, the JPEG). Those captures
are not committed, since the documents are not the project's.

What this reading does not cover: a document of the owner's own, a Google Docs
download, an equation or a chart in a file Word wrote, and Light, Dark and
Sanguine Atonement for every page (the heading page was read in Light and
Sanguine Atonement, the image page in Dark).
