# Sprint 17 Meta

- **Sprint number:** 17
- **Book schema version:** 2
- **Start timestamp:** 2026-08-16T03:27:58Z
- **End timestamp:** 2026-08-16T05:01:01Z
- **Model:** claude-opus-4-8
- **Exit status:** success
- **Token count:** (filled at Loop Phase if observable)
- **Summary:** Showcase README with the Mekzantine brand — a title banner set in the reader's own display font (committed as a GitHub-safe image, since GitHub can't use web fonts), a gallery of feature screenshots captured from the built app, and a polished showcase structure; plus a companion converter that makes the monospace MekzantineMono installable as a local terminal font. Font binaries stay git-ignored (unclear licence); only rendered images are committed.
- **Intents:** [INT-0016](../../intents/INT-0016-showcase-readme.md) — planned (T-040–T-043). On green, realized.
- **Completion evidence:** INT-0016 realized: showcase README with a Mekzantine brand banner + a feature-screenshot gallery from the built app + a polished structure (all images guarded by test_readme_assets_resolve), reproducible generators, and a committed converter installing the monospace MekzantineMono as a per-user terminal font (binary git-ignored). Isolation green: vitest 97/97, astro 0, check:electron 6/6, browser e2e 21/21.
