# Test Critique — Sprint 10

## Concerns

### C-001: The sprint closes with a red `check_live_reload` gate
- **Where:** `integration-tests.md` `check_live_reload` (FAIL) vs. the green-gate expectation.
- **Quote:** "after editing the handbook fixture's `first.md`, the reader does not reflect the edit … `ImageNotFound: ../assets/parent-plate.svg`".
- **Failure mode:** evidence-drift
- **Why it matters:** a red regression gate at close could mask a real defect or imply a false pass for the sprint.
- **Suggested response:** defer-with-rationale — the failure is **proven independent of INT-0008**: the offending parent-relative image is a Sprint-9 (T-206) fixture artifact (commit `fc1b8f4`), the Sprint-10 diff touches none of the live-reload / parent-asset path, and the same error reproduces on the base commit. It is an INT-0007 concern (whose own Consequences scope out live edits to book-root siblings), it is **not run in CI** (so the PR stays green), and INT-0008's four criteria each have independent green unit/component/E2E/gate evidence. Filed as **T-209**. Not a `block`: no INT-0008 criterion depends on live reload.

### C-002: The overlay's index-fetch failure branch has no executed test
- **Where:** `SearchOverlay.tsx` `loadIndex` (`catch { setRecords([]) }`) vs. `e2e-tests.md` / `unit-tests.md`.
- **Quote:** "It fetches … on first open (lazy; an injected `records` prop lets tests bypass fetch)."
- **Failure mode:** negative-path
- **Why it matters:** if `/search-index.json` fails to load, the overlay should degrade to an empty result set rather than throw; that resilience branch is exercised by neither the component tests (which inject `records`) nor the E2E (which serves a real index).
- **Suggested response:** defer-with-rationale — the branch is a two-line resilience fallback to the already-tested empty-state (`test_search_empty_and_noresults` proves an empty record set renders the designed no-result/hint panels); the happy fetch path is proven by the real-build E2E and `check_search`. A network-failure component test would require fetch mocking for marginal coverage; noted for follow-up rather than blocking.

## Confidence
proceed-with-caveats
