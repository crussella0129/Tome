# Test Critique — Sprint 16

## Concerns

### C-001: criterion 2 (faithful aesthetic) rests on a visual judgment
- **Where:** `e2e-tests.md` criterion 2 / `INT-0015` acceptance criterion 2
- **Quote:** "pixel-identical to Chromium (parchment, Mekzantine fonts, rubric accents…)"
- **Failure mode:** weak-assertion (subjective)
- **Why it matters:** "the aesthetic is intact" is an experiential judgment; a spike could be marked GO on the agent's say-so.
- **Suggested response:** fix-in-plan — **addressed.** The rendered Bibliotheca and reader are captured (`evidence/*.png`) and **surfaced to the user** for the visual sign-off; the report records the observation but the aesthetic confirmation is the user's. There is also an objective floor: the same `dist/` renders in Chromium/WebView2 (the same engine on Windows), and the search island hydrated + fonts/assets loaded, which is machine-verifiable.

### C-002: external-link routing (criterion 3) is verified by construction, not interactively
- **Where:** `e2e-tests.md` criterion 3
- **Quote:** "external `http(s)` routed via `on_navigation` + `tauri-plugin-opener` … (external implemented per the standard pattern)"
- **Failure mode:** negative-path / weak-assertion
- **Why it matters:** internal navigation was demonstrated (the reader loaded `/marginalia`), but an external link click was not driven, and the "deny other schemes" branch is untested.
- **Suggested response:** defer-with-rationale — driving a click needs the WebDriver harness the spike explicitly defers; the routing uses Tauri's canonical `on_navigation` + opener pattern, and internal navigation working proves the guard's allow-path. Interactive external-link + scheme-deny coverage belongs to the full-port sprint's E2E harness, alongside the Linux parity check. Not a blocker for a go/no-go.

## Confidence
proceed-with-caveats
