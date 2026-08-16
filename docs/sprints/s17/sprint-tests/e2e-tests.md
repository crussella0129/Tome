# Sprint 17 — End-to-End Test Results

- **Tested head:** `6036f076a466afad1d05985bb67cc040ab175b0c`
- **Status:** possible (the screenshots ARE E2E captures)
- **Intent:** [INT-0016](../../intents/INT-0016-showcase-readme.md)

The six feature screenshots (`docs/assets/shots/*.png`) are produced by
`scripts/make-shots.mjs` driving the served `dist/` with Playwright — exercising the
real reader (adaptive routes, search hydration + library-wide query, theme toggle,
the on-this-page rail) on the shipping 2-tome default. Their capture is the E2E
evidence for criterion 2; the banner (T-040) and the terminal-font conversion
(T-043) are verified by their artifacts. All captures + the banner + the rendered
README are **surfaced to the user** for the visual sign-off (criteria 1–3 are a
user judgment, not self-certified).

| Feature | Screenshot |
|---|---|
| Bibliotheca (library shelf) | `bibliotheca.png` |
| Reader (sidebar + switcher + admonitions + rail) | `reader.png` |
| Library-wide search (hits across both tomes) | `search.png` |
| Rich content (code panel + figure) | `content.png` |
| Warm-dark theme | `dark.png` |
| On-this-page rail | `rail.png` |
