# Sprint 8 Research Report

## Intents Reviewed

- [INT-0006](../../../intents/INT-0006-browser-verified-external-books.md) — created; relevance: gives T-205 a bounded verification outcome without reopening realized product scope; current state: proposed.
- [INT-0003](../../../intents/INT-0003-richer-external-book-support.md) — selected as provenance only; relevance: owns the already-realized external-book capabilities that T-205 will protect; current state: realized and unchanged.
- [INT-0001](../../../intents/INT-0001-tome-ink-on-paper-mdbook-viewer.md) — reviewed but not selected; relevance: T-208 preserves its realized theme behavior, but the lower-numbered T-205 backlog gap is the recommended Sprint 8 slice; current state: realized and unchanged.

## 1. Sprint Goal

Close the gap between Tome's generated-output external-book checks and its
bundled-reader browser suite by exercising the existing handbook fixture through
ingestion, production build, static serving, and Chromium. Keep this a bounded
test-infrastructure change: no application behavior, supported syntax, package,
or CI-step-order changes.

## 2. Existing Code Survey

| File | Relevance | Notes |
|------|-----------|-------|
| `docs/work/tasks.md` | high | T-205 is the first canonical backlog item; T-206 and T-208 remain later work. |
| `docs/intents/INT-0003-richer-external-book-support.md` | high | External-book product outcomes are realized, so verification belongs to a follow-on intent. |
| `e2e/reader.spec.ts` | high | Exercises the served production reader in Chromium, but only against the bundled sample. |
| `playwright.config.ts` | high | Always rebuilds the bundled sample before serving `dist/`; needs an isolated prebuilt-external mode. |
| `scripts/check-external-build.mjs` | high | Serially builds fixture books, inspects output, restores content, and already runs in CI. |
| `scripts/serve-dist.mjs` | high | Deterministically serves directory routes and optimized assets from the current `dist/`. |
| `.github/workflows/ci.yml` | medium | Runs Playwright before the external gate; the existing external step can inherit Chromium installed earlier. |
| `package.json` | medium | Existing Playwright and external-gate scripts are sufficient; no dependency is needed. |
| `fixtures/handbook/src/first.md` | high | Supplies fixture-specific prose, navigation, and a relative image already asserted in generated HTML. |
| `docs/sprints/s6/sprint-tests/e2e-tests.md` | low | Records T-208's separate hydration flake; useful candidate evidence but not Sprint 8's selected scope. |

## 3. External Sources

No external sources were needed. The gap, runner lifecycle, cleanup behavior,
and available serving/test primitives are defined by Tome's committed code and
were independently surveyed by three read-only candidate assessments.

## 4. Risks, Unknowns, Dependencies

- **Risk:** rebuilding an external fixture inside the fully parallel default
  Playwright suite would race shared `src/content/books/` and `dist/` state.
- **Risk:** a second Playwright invocation could overwrite the ordinary
  `playwright-report`; external mode needs separate or non-HTML reporter output.
- **Risk:** browser failure must still reach the external gate's cleanup path.
- **Unknown:** the smallest configuration interface may be an environment flag
  in the existing config or a dedicated config file; Planning should prefer the
  lower-complexity option that keeps default behavior unchanged.
- **Dependency:** CI installs Chromium before invoking the existing external
  build gate; local execution requires the same already-declared Playwright
  browser dependency.
- **Dependency:** the gate inherits its documented clean-tree requirement for
  `src/content/books/`.

## 5. Recommended Approach

Primary: add a focused `e2e/external-book.spec.ts`, give the existing Playwright
configuration an explicit prebuilt-external mode with dedicated test selection,
port, and reporter behavior, and invoke that mode from the handbook case in
`check-external-build.mjs` after generated-output assertions but before sample
restoration. Assert fixture-specific chapter/navigation content, sample absence,
and a visible, decoded, sacred-prose-styled relative image. Preserve the default
reader suite and CI ordering.

Alternative considered: run the fixture build as an ordinary Playwright test.
Rejected because the suite is fully parallel and both modes mutate the same
content and output trees. A serialized child invocation inside the existing
external gate matches the established state owner and cleanup boundary.

Rationale: this composes Tome's current build gate, foreground server, and
browser tools instead of introducing another harness. It creates the missing
end-to-end proof with no production or dependency change.

## Artifacts

- No separate research artifacts were saved; all evidence is linked above and
  the three candidate assessments were read-only session inputs.
