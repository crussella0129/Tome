# Sprint 26 Meta

- **Sprint number:** 26
- **Book schema version:** 2
- **Start timestamp:** 2026-11-24T05:28:04Z
- **End timestamp:** (filled at Loop Phase)
- **Model:** claude-fable-5-2
- **Bundle version:** 0.22.0
- **Exit status:** in-progress
- **Token count:** (filled at Loop Phase if observable)
- **Summary:** Read papers: a document written in LaTeX or Typst is read as a tome, its formulas laid out and whatever cannot be carried over marked and named.
- **Intents:** [INT-0033](../../intents/INT-0033-latex-and-typst-documents.md) — realized; INT-0029 and INT-0030 realized compatibility boundaries; INT-0032 and INT-0026 proposed constraints.
- **Completion evidence:** (filled at Loop Phase)

## Blockages

- **Resolved during T-093 (a clause that asked more of search than search does):** the
  plan says that a word standing only in the LaTeX paper's appendix, searched for, gives a
  first result that "SHALL be the paper's `Appendix` section and SHALL open at it". Tome's
  search opens a section only for a match in a heading's own words; a match in the text
  opens its chapter (INT-0008, unchanged by this sprint). So `test_papers_search` holds
  what search does, in both engines: the word gives one result, the LaTeX paper, which
  opens with the word on the page; and the heading `Closing`, read from a file in a
  folder of its own, gives a result for each paper, each opening at that section with the
  heading in view. Opening at the section a word of the text stands in would be a change
  to search, and is not made here.
- **Resolved during the Test phase (source changed after Build):** four
  reviews of the tests found faults no planned test had tried, and each was
  corrected in the phase with a test, as the critique files record:
  `2fe447b` (`critique-round-1.md`: an environment with an option, Windows
  line ends, spanning cells, a norm in a cell, a Hayagriva bibliography,
  `../` in Typst, pictures by path, other properties of a paper, Typst
  labels with a colon, `\input` cycles, parts of a paper); `5662158`
  (`critique-round-2.md`: the cycle guard and code the paper shows, Typst
  pictures of one name, the heading before the list); `43c9a66`
  (`critique-round-3.md`: a file lost when its argument stood where code
  was found, a chapter's file answered by one beside the paper); `c9f4e2e`
  (`critique-round-4.md`: a lone backtick, `	oday` after a `%`, Typst names
  only in calls). The design stands; what the reader cannot know by pattern
  is recorded in INT-0033's Consequences. T-096 (backlog, INT-0008) carries
  T-093 clause 6.
