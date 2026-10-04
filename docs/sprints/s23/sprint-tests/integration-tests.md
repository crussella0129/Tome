# Sprint 23 Integration Verification

No separate integration layer: the styles are verified in the production build
by the E2E suite (`e2e-tests.md`), per the test plan.

## Chip technique, checked across engines

Before implementation, a scratch page rendered two chip techniques in
**WebKit 26.5** (iPad Safari's engine) and **Chromium**:

- multi-layer `background-clip: text, padding-box` showed a filled chip with
  gradient text in both;
- a text-clipped gradient over an inset-shadow fill painted the shadow over the
  letters in both, so the text vanished.

The shipped CSS uses the first, behind `@supports`, with a solid salmon
fallback.

## Pre-existing test race, resolved

Fixture-test cleanup began failing with `EPERM` on this machine. An exact
reproduction outside Vitest showed Windows holding the temporary repository for
~275 ms after the gate's failing `npm run build` returned. Node 24's `rmSync`
`maxRetries` did not cover it. Both cleanup helpers now retry lock errors
explicitly (≤ ~5 s). Full Vitest then passed 178/178 in five consecutive runs.
