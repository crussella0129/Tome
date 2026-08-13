# Sprint 8 Integration Tests

- **Tested head:** `38ed51208d14aa3e3421542672054f092671de1d`
- **Task commit:** `4cb83b7`

## `gate_external_failure_cleanup`

The external gate was run with `PLAYWRIGHT_BROWSERS_PATH` set to the deliberately
unavailable `Z:\\tome-s8-missing`. The handbook built, both external browser
tests reached Chromium launch, and the Playwright child failed as intended
because no executable existed there. The gate propagated **exit 1**.

After failure:

- `git diff --exit-code HEAD -- src/content/books` → exit 0;
- scoped porcelain status including staged, untracked, and ignored files →
  empty.

This executes the real destructive fixture path while the new pristine-target
preflight protects user content and the strict restoration path proves cleanup.

## `gate_external_build_browser`

`node scripts/check-external-build.mjs` → **passed**:

- handbook generated-output assertions passed;
- the two isolated Chromium tests passed **2/2** using one worker;
- the config-less docs-book generated-output assertions passed;
- sample restoration was clean after each fixture; and
- the final bundled-sample rebuild generated all five default routes.

## `gate_external_report_isolation`

A uniquely named sentinel was added to the existing ordinary
`playwright-report/`, the successful external gate ran, and the sentinel
remained byte-for-byte present. It was then removed. External mode therefore
did not replace the ordinary HTML report.

## Shared-state regression

`node scripts/check-multibook.mjs` → **passed** for the two-tome Bibliotheca,
namespaced routes, and sidebar switcher, followed by a successful default
rebuild. Final scoped content status was empty.
