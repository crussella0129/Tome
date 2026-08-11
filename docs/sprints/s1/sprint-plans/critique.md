# Plan Critique — Sprint 1

## Concerns

### C-001: The prebuild font-fetch hook runs in every build, including CI — a network failure could break otherwise-green builds
- **Where:** `build-plan.md` T-006 (`package.json` `prebuild`/`predev` hooks) interacting with T-009 CI (`playwright` webServer runs `npm run build`).
- **Quote:** "wired as an npm `prebuild`/`predev` hook".
- **Failure mode:** hidden-dep
- **Why it matters:** `prebuild` fires on **every** `npm run build`, including the Playwright `webServer` build in CI and any future sprint's build. If the fetch exits non-zero on a blocked/slow CDN, it would fail builds that are otherwise green — a cross-task coupling not visible in the dependency edges.
- **Suggested response:** fix-in-plan — `fetch-fonts.mjs` must be **idempotent** (skip if the file exists) **and non-fatal** (warn and exit 0 on any network error); the `monospace` fallback (T-006 clause 3) then keeps the reader working. Note this contract in the T-006 plan entry.

### C-002: The font-hosting decision is durable but recorded only in the plan
- **Where:** `build-plan.md` T-006 / Context vs. `INT-0001` Consequences.
- **Quote:** "fetches the font at build time into a git-ignored `public/fonts/` … without the repo redistributing the binary".
- **Failure mode:** intent-drift
- **Why it matters:** *how* Mekzantine is hosted (build-time fetch, no redistribution, driven by the undocumented licence) is a lasting constraint on the project; the intent's Consequences currently only say self-hosting is "a later hardening". A future sprint reading the intent would miss the licence-driven method.
- **Suggested response:** fix-in-plan (amend intent) — record the build-time-fetch / no-redistribution decision and its licence rationale in INT-0001 Consequences.

## Confidence
proceed-with-caveats
