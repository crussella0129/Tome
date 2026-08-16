# Test Critique — Sprint 17

## Concerns

### C-001: criteria 1–3 (banner, screenshots, "finished" README) rest on visual judgment
- **Where:** `e2e-tests.md` / `INT-0016` criteria 1–3
- **Quote:** intent — "a **beautified showcase** that sells Tome at a glance"
- **Failure mode:** weak-assertion (subjective)
- **Why it matters:** "beautiful/finished" can't be machine-graded; the sprint could be self-certified on aesthetics.
- **Suggested response:** fix-in-plan — **addressed.** Each criterion has an objective floor — the banner PNG exists + is non-empty; the six feature PNGs exist and are captured from the real app (E2E); `test_readme_assets_resolve` proves every embedded image resolves — and the rendered banner, screenshots, and README are **surfaced to the user for the visual sign-off**. The verdict is the user's.

### C-002: T-043 installs a font on the user's machine
- **Where:** `unit-tests.md` / `build-plan.md` T-043
- **Quote:** "Installed per-user … lists as 'Mekzantine Mono' in the terminal font picker"
- **Failure mode:** scope / side effect
- **Why it matters:** a system modification outside normal repo artifacts, with an unclear font licence.
- **Suggested response:** defer-with-rationale — **explicitly requested**; per-user, no-admin, reversible; the only committed artifact is the converter **script** (the TTF is git-ignored, confirmed by `git check-ignore`); the licence caveat is surfaced. Nothing about the repo's tracked contents changed.

## Confidence
proceed-with-caveats
