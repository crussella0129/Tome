# INT-0006 — Browser-verified external books

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0006
- **State:** active
- **Work evidence:** [T-205 Sprint 8 build plan](../sprints/s8/sprint-plans/build-plan.md#t-205-join-the-external-fixture-build-gate-to-an-isolated-chromium-verification-mode)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Prove that Tome's canonical external-book fixture works through the complete
production reader path: external source ingestion, Astro build, static serving,
browser rendering, navigation, and asset loading. This is a verification intent;
it does not add reader behavior, broaden supported mdBook syntax, or replace the
existing fast generated-output assertions.

## Acceptance criteria

1. The canonical external-book gate opens the built handbook fixture in a real
   Chromium session and proves `/first` renders fixture-specific chapter and
   navigation content while bundled-sample content is absent.
2. The browser session proves the handbook's relative image is visible, has
   loaded successfully (`complete` with positive natural width), and retains the
   sacred prose image treatment.
3. External-book browser verification runs in CI through the existing external
   build gate, remains isolated from the ordinary bundled-reader Playwright
   suite and report, and leaves the committed sample restored after success or
   failure.

## Rationale

Tome separately verifies external books by inspecting generated files and the
bundled reader in Chromium. Neither proof joins ingestion and production build
to a served external-book page in a browser, so HTTP asset delivery, hydrated
navigation, and real rendering could regress without either gate noticing.

## Alternatives

- Treat the generated HTML inspection as sufficient. Rejected because it
  cannot prove that referenced assets are served or decoded by a browser.
- Reopen INT-0003. Rejected because its product outcomes are realized; this is
  a distinct verification outcome and must not move a terminal intent backward.
- Rebuild the external fixture inside the ordinary parallel reader suite.
  Rejected because both paths mutate shared `src/content/books/` and `dist/`
  state, creating nondeterministic cross-test interference.

## Consequences

- The external build gate becomes slower because one fixture is also exercised
  in Chromium.
- The external browser mode needs isolated test selection, port, and report
  output so it cannot consume or overwrite the bundled-reader run.
- The inherited external-gate clean-tree rule remains: its cleanup restores the
  tracked content library and is unsuitable while that directory has local
  edits.

## Transition history

- 2026-08-13: created as `proposed` for Sprint 8 research, separating browser
  verification from the terminal INT-0003 product scope.
- 2026-08-13: `proposed → planned` — the user approved Sprint 8 T-205 to cover
  all three acceptance criteria without changing application behavior or
  reopening INT-0003.
- 2026-08-13: `planned → active` — Build Phase began executing T-205 against
  the locked Sprint 8 plans.
