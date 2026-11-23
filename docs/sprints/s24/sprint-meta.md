# Sprint 24 Meta

- **Sprint number:** 24
- **Book schema version:** 2
- **Start timestamp:** 2026-11-23T13:26:23Z
- **End timestamp:** 2026-11-23T17:24:34Z
- **Model:** claude-fable-5-2
- **Bundle version:** 0.22.0
- **Exit status:** success
- **Token count:** (filled at Loop Phase if observable)
- **Summary:** Read a Markdown file, a Word document, or a folder of them as a tome, converted when the library is built.
- **Intents:** [INT-0029](../../intents/INT-0029-documents-as-tomes.md) — realized; INT-0023, INT-0011, INT-0009 and INT-0008 realized compatibility boundaries. Recorded in Research and not built this sprint: INT-0026, INT-0027, INT-0028 (revised), INT-0030, INT-0031, INT-0032 (created).
- **Completion evidence:** INT-0029 realized: T-065 to T-074 complete; Vitest 258 tests, all passed at 36b5db1 across Windows and CI (one platform-bound skip on each); Playwright 39/39 and the documents gate 6/6; final test review proceed-with-caveats after four rounds; GitHub Actions 45225743756 succeeded at 36b5db1.

## Blockages

- **Resolved during T-066 (test environment):** the test plan said every new
  test file that touches the file system starts with the node-environment
  line. Under that environment the shared Vitest config still resolves the
  Markdown parser's browser build, which needs a `document`, so
  `docx-to-markdown.test.ts` and `document-stage.test.ts` run in the default
  (jsdom) environment, as `parent-assets.test.ts` already does.
  `document-source.test.ts` and the spawned-CLI tests keep the node line.
- **Resolved during T-069 (loader start-up):** importing the Word reader at
  the top of the loader raised every load from about 0.85 s to 2.4 s and
  timed out an existing test. The document tools are now loaded only when an
  entry names documents; an mdBook load is back to about 0.85 s.
- **Resolved before T-074 (test time under load):** with the sprint's new
  spawned-process tests in the suite, `test_fixture_gate_isolates_environment`
  (four loader runs in one test) once took 6 s against Vitest's default 5 s
  limit and failed; it passes alone. `vitest.config.ts` now sets
  `testTimeout: 20_000`. No assertion changed. The whole suite then passed
  238/238 in two consecutive runs.
- **Resolved at the Test phase (real documents):** no paper of the owner's
  had been given when T-066 passed, so `verify_real_paper_converts` was not
  run during the build. At the Test phase the owner asked for an example
  found online instead. Twelve files saved by Word, from the pandoc
  project's tests, were read; they showed three faults the hand-written
  fixture could not, all fixed with tests.
- **Resolved at the Test phase (four reviews):** the test review ran four
  times. The second and third each blocked on faults introduced by the fixes
  made for the review before, most of them in how search text is gathered
  around a tag or a line break. That rule was rewritten once on a plainer
  footing and now carries a test for each input that broke it. The fourth
  review passed with caveats, each fixed or stated as a limit in INT-0029.
- **Carried forward:** the live reload gate is intermittent and was before
  the sprint (T-075); a heading that cites a note has a different address in
  search than on the page (T-076).
