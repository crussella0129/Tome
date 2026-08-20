# Sprint 20 — End-to-End Test Results

- **Tested implementation head:** `3830b71eb2c3cab0ce3aa3f4f25aa456cbfe8d9a`
- **Status:** possible and executed in real Chromium
- **Intent:** [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md)
- **Environment:** Windows 11, Node 24.12.0, Playwright 1.62.1

## EARS and acceptance trace

| Locked clause / acceptance outcome | Named executed test | Assertions | Result |
|---|---|---|---|
| T-050 wide headed/unheaded reading stack | `test_scaling_reader_column_centered` | At 1280/1920/2560, reading column/prose/pager are no wider than resolved `--measure`; each center matches `main.content` within 1px; search stays contained and right-aligned; headed rail mode remains correct | **pass** |
| T-050 hydrated mobile navigation | `test_scaling_reader_column_stable_with_mobile_nav` | At 600px, viewport is set before navigation, `body.js-nav` is awaited, `aria-expanded` proves closed→open→closed, column center stays within 1px, and no state overflows | **pass** |
| T-051 root/trigger width on both hosts | `test_scaling_search_trigger_usable_across_hosts` | On `/` and `/tome/getting-started` at 480, 768/769, 1023/1024, and 1040px, computed maximum equals independent `26 × root-font-size` within 0.01px; root≈trigger≈`min(26rem, real host content box)` within 1px; root stays inside host; internal affordances and neighboring catalogue/TOC/rail/prose rectangles do not overlap; copy has one rendered line; no overflow | **pass** |
| T-051 open-dialog controls on both hosts | `test_scaling_search_dialog_controls_do_not_compress` | At 320×360 and 480×360, focused input is ≥192px; the **rendered** close rectangle is ≥32×32 within 0.01px floating-point tolerance; input/close do not overlap and both stay inside the dialog; dialog stays inside viewport; real close click succeeds | **pass** |
| T-051 decoration yields first | `test_scaling_search_dialog_controls_do_not_compress` | At 320px the icon has no rendered box and field gap/inline padding are each ≤8px; at 480px the visible icon does not overlap input | **pass** |
| INT-0019 AC4 regression matrix | four tests above plus `test_scaling_no_overflow`, `test_scaling_dialog_in_viewport`, `test_scaling_layout_mode` | Both hosts, narrow sizes, wide headed/unheaded pages, exact 768/769 and 1023/1024 layout edges, actual element geometry | **pass** |

The complete `e2e/scaling.spec.ts` matrix passed **7/7**. The complete browser
suite then passed **25/25** using 12 workers: reader 16/16, search 2/2, scaling
7/7. The separate external-book Chromium gate passed **3/3**, and the Electron
shell regression suite passed **6/6**.

## Adversarial tightening and determinism

An independent code review caught that the initial close-target test asserted
computed CSS width/height even though it had already captured the rendered
rectangle. The assertion now uses `getBoundingClientRect()` and also proves input
and close containment within the dialog. Its first tightened run exposed
Chromium's `31.999998px` floating-point representation of the exact 32px target;
the final assertion permits only **0.01px** undershoot and therefore cannot mask
meaningful scaling or clipping. The reviewer re-checked the change as clean, and
the final 7/7 and 25/25 runs passed. The formal Test critic then found two more
false-pass paths: deriving the 26rem expectation from the implementation itself,
and omitting explicit adjacent-UI separation. The final test uses root font size
as the independent rem oracle, contains the root in the host content box, and
compares actual rectangles for the trigger's children and host-specific neighbors.
It also tightened every “does not overlap” comparison from 1px to 0.01px.

No sleeps, retries, network dependencies, random data, or mutable external books
are used by the Sprint 20 geometry tests. Hydrated controls wait on the existing
`body.js-nav` / `html[data-search-ready="true"]` product signals, and every
viewport is set before navigation. The committed two-tome fixture supplies all
planned routes; the user's Bible configuration remained preserved outside the
active tree throughout testing.

## Hosted CI

Authoritative GitHub Actions
[run 32334993225](https://github.com/crussella0129/Tome/actions/runs/32334993225)
completed **success** on exact head
`3830b71eb2c3cab0ce3aa3f4f25aa456cbfe8d9a`. Its `verify` job reported success
for checkout/setup-node v7, dependency install, Type check, Unit & integration
tests, End-to-end tests, External book build, Multi-book build, Search build, and
Playwright-report upload.
