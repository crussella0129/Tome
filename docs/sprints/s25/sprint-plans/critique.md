# Plan Critique — Sprint 25

The final review: the third reviewer's check of the revision that answered
its seven concerns (`critique-round-3.md`), after two earlier reviews
(`critique-round-1.md`, `critique-round-2.md`). It found all seven answered
in the files as they stand; every task's clause count right (T-077 12,
T-078 13, T-079 9, T-080 7, T-081 13, T-082 10, T-084 3, T-083 5), every
clause with a named test and every cited clause number matching; no clash
between tasks' files and dependencies; and no clause against INT-0030. It
left three caveats, "each small enough to settle in the build inside what
the clauses already promise". "Why it matters" is condensed from the
reviewer's report; each "Suggested response" ends with what was done. All
three were written into the plans before they were locked, so the build
starts with none open.

## Concerns

### C-001: Search has no way to know a `$$…$$` formula inside a paragraph is set apart
- **Where:** `build-plan.md` T-079 clause 1 and Notes, T-077 Notes (exports); `test-plan.md` `test_search_set_apart_environment`
- **Quote:** "read set apart when it is set apart, so a numbered environment is found by what it shows and not by `begin`"
- **Failure mode:** plan-test-mismatch
- **Why it matters:** The step that sets a `$$…$$` formula apart when it has its lines to itself is a tree step of the page's plugin, which search does not run. A numbered environment written hard against its `$$` would be laid out on the page but read within a line by search, where the layout engine refuses it, and indexed as typed.
- **Suggested response:** settle in the build, inside clause 1 — written into the plans: T-077 exports the tree step as `setApart()`, T-079 runs it after parsing, `test_dollars_set_apart` checks that `setApart()` on a parsed tree gives the tree the plugin gives, and `test_search_set_apart_environment` gains the one-line and the three-line `$$` cases.

### C-002: "never read the same" is stronger than the rule delivers when a digit follows a root or a fraction
- **Where:** `build-plan.md` T-078 clause 12; INT-0030 Consequences
- **Quote:** "so that two different formulas never read the same"
- **Failure mode:** EARS-vague
- **Why it matters:** One number stands unbracketed, so `\sqrt{2}3` and `\sqrt{23}` would both read `√23`.
- **Suggested response:** settle in the build — written into the plans: a number that directly follows a root or a fraction is parted from it by `·` (`√2·3` beside `√23`, `1/2·3` beside `1/23`), with those four cases in `test_math_title_text`; and the clause now says what the rule does, that what a root, a fraction or a power holds is never run together with what stands beside it, in place of the absolute.

### C-003: Words left behind by the edits
- **Where:** `build-plan.md` T-079 Notes, Intents (INT-0008), T-083 Notes; `test-plan.md` Intent Traceability AC7; INT-0030 Transition history
- **Quote:** "Search splits text into runs of `a` to `z` and digits (`src/lib/search.ts`, unchanged)"
- **Failure mode:** intent-drift
- **Why it matters:** T-079 now changes how search splits words, so "unchanged" and "and nothing else" were no longer true; a new test was missing from the traceability table; a history entry and a note named the wrong count and the wrong task.
- **Suggested response:** fix-in-plan at the lock — applied, each a phrase: the INT-0008 line says what the fold changes in any chapter; "unchanged" is gone from T-079's Notes; `test_search_set_apart_environment` is in the AC7 row; INT-0030's history says three reviews; T-083's Notes name T-078 as the maker of the fixture pages.

## Confidence
proceed-with-caveats
