# Plan Critique — Sprint 17

## Concerns

### C-001: criteria 1–3 rest partly on a "beautiful / finished" visual judgment
- **Where:** `build-plan.md` T-040/T-041/T-042 / `INT-0016` criteria 1–3
- **Quote:** intent — "a **beautified showcase** that sells Tome at a glance"
- **Failure mode:** intent-drift (unverifiable-judgment realization)
- **Why it matters:** "beautiful" and "finished" are experiential; a docs sprint could be self-certified as done on aesthetics alone.
- **Suggested response:** fix-in-plan — **addressed.** Each criterion has an *objective* gate (the banner PNG exists + is non-empty; the six feature PNGs exist + depict each feature; `test_readme_assets_resolve` proves every image path resolves), and the **rendered banner/screenshots/README are surfaced to the user for the visual sign-off** — the aesthetic verdict is the user's, not the agent's.

### C-002: a docs sprint performs a system-level font install
- **Where:** `build-plan.md` T-043
- **Quote:** "the TTF **SHALL** be installed for the current user … so it appears in the terminal font picker"
- **Failure mode:** intent-drift (scope / side effect)
- **Why it matters:** installing a font modifies the user's machine — outside a repo's normal artifacts, and the font's licence is unclear.
- **Suggested response:** defer-with-rationale — the install was **explicitly requested**, is **per-user / no-admin / reversible**, and is done **out-of-band**; the only *committed* artifact is the reproducible converter **script** (`make-terminal-font.py`), never a font binary (guarded by `.gitignore` and `git check-ignore`). The licence caveat is surfaced to the user. This keeps the repo clean while fulfilling the request.

## Confidence
proceed-with-caveats
