# Sprint 23 Unit Verification

- **Tested head:** `277e597` (T-062 committed). `npx vitest run`: **27 files,
  178 tests passed**, five consecutive full runs after the cleanup fix.
- `npx astro check`: 0 errors, 0 warnings, 0 hints.

| Test | Clause | Result |
|---|---|---|
| tint composites (`#2f0004`, `#380407`) match the contract | T-062 EARS 2 | pass |
| `test_sanguine_sidebar_contrast` — salmon 5.08–6.04, old blood 5.10–5.30 (void, sunken), accent 6.68–7.94 on every ground used | T-062 EARS 2 / AC1 | pass |
| crimson channel 3.85:1 on the void (non-text ≥ 3:1) | T-062 EARS 2 | pass |
| `test_sanguine_chip_contrast` — `#ff9a8a` 9.26:1, `#ec5658` 5.46:1 on `#170e0f` | T-062 EARS 5 / AC4 | pass |
| drift guard — sidebar tokens, channel, and chip layers match `SANGUINE_SIDEBAR` | T-062 | pass |
