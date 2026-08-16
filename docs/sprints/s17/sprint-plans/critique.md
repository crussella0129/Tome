# Plan Critique — Sprint 17

## Concerns

### C-001: criteria 1–3 rest partly on a "beautiful / finished" visual judgment
- **Where:** `build-plan.md` T-040/T-041/T-042 / `INT-0016` criteria 1–3
- **Quote:** intent — "a **beautified showcase** that sells Tome at a glance"
- **Failure mode:** intent-drift (unverifiable-judgment realization)
- **Why it matters:** "beautiful" and "finished" are experiential; a docs sprint could be self-certified as done on aesthetics alone.
- **Suggested response:** fix-in-plan — **addressed.** Each criterion has an *objective* gate (the banner PNG exists + is non-empty; the six feature PNGs exist + depict each feature; `test_readme_assets_resolve` proves every image path resolves), and the **rendered banner/screenshots/README are surfaced to the user for the visual sign-off** — the aesthetic verdict is the user's, not the agent's.


## Confidence
proceed-with-caveats
