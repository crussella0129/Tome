# Sprint 22 Research Report

## Intents Reviewed
- [INT-0022](../../../intents/INT-0022-sanguine-atonement-theme.md) — created; relevance: the hidden Sanguine Atonement theme, its riddle unlock, and its researched palette; current state: proposed.
- [INT-0023](../../../intents/INT-0023-find-load-and-deploy-books.md) — created; relevance: the "explorer" review — discovery, personal manifest, clean generated library, deployment tutorial; current state: proposed.
- [INT-0020](../../../intents/INT-0020-native-library-folder-management.md) — selected (reviewed, unchanged); relevance: the native in-app picker stays a separate, larger outcome that INT-0023's discovery + personal-manifest work prepares; current state: proposed.
- [INT-0021](../../../intents/INT-0021-safe-consistent-fixture-verification.md) — selected (consequence to revise during Build); relevance: fixture gates must keep protecting the tracked sample once fixtures publish into a generated library; current state: realized.
- [INT-0012](../../../intents/INT-0012-desktop-shell-electron.md) / [INT-0017](../../../intents/INT-0017-tauri-production-port.md) — selected (compatibility boundary); relevance: the theme and library changes must keep the offline desktop shells working; current state: realized.

## 1. Sprint Goal
Deliver the user's two requests for Sprint 22. First, a hidden **Sanguine
Atonement** theme for reading a campaign's blood-channel obsidian tablets on a
tablet. It is reached through a Light · Dark · **Other** selector whose dialog
asks *Oblivion*'s Black Door riddle, "What is the color of Night?". It is drawn
with a researched, contrast-safe blood palette on a procedural obsidian
surface, with restrained Halloween/necromantic flourishes. Second, a review and
refactor of Tome's book "explorer" path so a human or agent can find mdBooks on
their machine, add them without dirtying the repository, build them without
copying VCS data, and deploy the result to a desktop or a tablet, all documented
by a detailed, tested tutorial.

## 2. Existing Code Survey
| File | Relevance | Notes |
|------|-----------|-------|
| src/styles/tokens.css | high | Owns every `--theme-*` token per `body.theme-*` class; Sanguine adds a third scoped block |
| src/styles/theme.ts | high | `THEMES` + WCAG math; the contrast test iterates `THEMES`, so a hidden Sanguine entry gains coverage automatically |
| src/components/init-theme.astro | high | Pre-paint restore hardcodes `['theme-ink-paper','theme-terminal-dark']`; must derive from `THEMES` |
| src/components/TocSidebar.tsx | high | Single cycling "Switch colour theme" button in the footer; becomes the shared three-option selector |
| src/components/TocSidebar.module.css | medium | Footer/button styling; touch targets are 2rem today |
| src/components/Bibliotheca.astro | high | No theme control today; masthead rule is the natural "dripping" surface |
| src/styles/paper.css | high | Asset-free SVG `feTurbulence` grain + vignette on `body::before/::after`; the obsidian surface reuses this pattern |
| src/styles/prose.css | medium | Heading/hr/blockquote treatments the blood-channel styles override per theme |
| src/layouts/BookLayout.astro | medium | Head metadata (theme-color, web-app capable) and island wiring |
| src/lib/summary.ts | medium | Unlinked SUMMARY entries parse as `draft`; rendered "(draft)" → "(sealed)" in Sanguine |
| e2e/reader.spec.ts | medium | Theme tests click the old cycle button; must move to the selector |
| scripts/load-books.mjs | high | Copies the whole source dir (incl. `.git` for root-layout books); "unconfigured" is a no-op leaving the tracked sample in place |
| scripts/book-source.mjs | high | Shared detection rules (`book.toml` src → src/ → docs/ → root); discovery must reuse them |
| scripts/library-config.mjs | medium | Owner resolution reads the same manifest; must follow the new precedence |
| scripts/fixture-gate.mjs | high | Gate pins `TOME_CONFIG` to an empty fixture and `TOME_BOOK_DEST` to the tracked sample dir |
| src/lib/book.ts | high | Vite globs `../content/books/*`; slug-from-key regex and chapter-key matching depend on that path |
| src/pages/[...slug].astro | medium | Chapter glob over the library |
| src/pages/search-index.json.ts | medium | Search-index glob over the library |
| astro.config.mjs | medium | Dev live-reload destination `src/content/books` |
| tome.config.toml | high | Tracked manifest the user had to edit to add a personal book |

## 3. External Sources
- [UESP — Oblivion: A Knife in the Dark](https://en.uesp.net/wiki/Oblivion:A_Knife_in_the_Dark) — confirms the Cheydinhal Black Door exchange verbatim: "What is the color of night?" / "Sanguine, my Brother." (Skyrim's door instead asks "What is the music of life?" / "Silence, my brother.")
- [Compound Interest — The Chemistry of the Colours of Blood](https://www.compoundchem.com/2014/10/28/coloursofblood/) — oxygenated haemoglobin is bright red, deoxygenated is a darker red (not blue); the basis for "less oxygenated = darker, not bluer".
- [Wikipedia — Methemoglobin](https://en.wikipedia.org/wiki/Methemoglobin) — ferric haemoglobin is chocolate-brown; why drying blood browns, used for the subdued "old blood" role.
- [Effect of Chromostereoscopic Stimulus on Accommodative Response (BIOJ)](https://bioj-online.com/articles/10.22599/bioj.515) — 30 adults read coloured text on black **on an iPad**: red produced the smallest accommodative lag (0.18 D) and was perceived as nearest; saturated blue was worst.
- [Geology In — Mahogany Obsidian](https://www.geologyin.com/2023/12/mahogany-obsidian.html) — obsidian's vitreous luster, conchoidal (shell-curved) fracture, and iron/hematite red-brown streaks; the reference for the procedural surface.

## 4. Risks, Unknowns, Dependencies
- **Risk — legibility:** dark reds fail WCAG on near-black. Measured (WCAG 2.x,
  vs `#0a0708`/`#110b0c`/`#170e0f`): `#FF0000` 5.02/4.88/4.75; `#BA1A1A`
  3.11/3.02/2.94. Body text must use a lifted crimson; `#BA1A1A` is limited to
  large display letters and depth. Mitigation: contrast unit tests per role and
  surface (see `palette-derivation.md`).
- **Risk — texture over text:** a lit SVG surface raises local ground luminance.
  Mitigation: the surface stays behind content at low opacity; contrast is
  asserted against the panel/input surfaces as the worst case.
- **Risk — iPad performance:** SVG lighting filters are costly if re-rasterized.
  Mitigation: a static data-URI tile on a fixed pseudo-element (rasterized once,
  as `paper.css` already does); animations limited to opacity/transform.
- **Risk — test coupling:** `book.test.ts` reads the real library via globs. If
  the library becomes generated, tests would follow a developer's personal books.
  Mitigation: one `@library` alias; Vitest maps it to the committed sample.
  Verified in a scratch Vite 8.2.1 server that aliased `import.meta.glob`
  resolves and returns root-relative keys.
- **Risk — workspace migration:** the active checkout currently holds a personal
  library copy and an edited tracked manifest. Moving that entry to the ignored
  `tome.local.toml` and restoring the sample is a local action requiring the
  user's approval and is never committed.
- **Unknown — static-host base paths:** routes are root-absolute, so project
  subpaths (`user.github.io/repo/`) break links. Documented as a limitation and
  deferred.
- **Unknown — offline tablet use:** no service worker exists; "Add to Home
  Screen" works while the host is reachable. Documented; offline PWA deferred.
- **Dependency:** none new. Node 24 strips TypeScript, so scripts can import the
  shared `src/lib/summary.ts` parser (as `check-search.mjs` already imports
  `search.ts`).

## 5. Recommended Approach
Primary: one sprint, two intents, theme first.
1. **INT-0022** — extract a shared `ThemePicker` island (Light · Dark · Other)
   for the sidebar and Bibliotheca. Add a pure, unit-tested riddle matcher, a
   `<dialog>` drawn from the active tokens, a transform-only blood-wash
   transformation (instant under reduced motion), and a hidden `THEMES` entry
   that the pre-paint script and selector both derive from. Build the visual
   system on a role palette walking blood's oxidation path: arterial `#ff2b2b`
   (focus/current), crimson ichor ≈`#e64b4d` (body ≥5:1 on every surface),
   pooled venous `#BA1A1A` (bottom of large blood-channel letters), old-blood
   brown ≈`#b86554` (subdued ≥4.5:1), vein-pink ≈`#e6757f` links, clotted
   `#5a1a1c` borders, bone ≈`#d9c1b8` for selected text. Ground: obsidian
   `#0a0708`, not pure black (texture headroom, OLED smear, "or close to it").
   Flourishes: obsidian `feTurbulence`/specular surface with mahogany streaks,
   blood filling heading channels, a slow heartbeat glow, drop cap, sigil rules,
   inscription callouts, dripping Bibliotheca masthead, candle-dim vignette,
   "sealed" drafts, blood selection and scrollbar. All motion stops under
   reduced motion; none appears in print.
2. **INT-0023** — publish every build into a git-ignored generated library read
   through a `@library` alias (sample copied when unconfigured). Add the ignored
   `tome.local.toml` manifest with explicit precedence, exclude
   VCS/dependency/build directories from copies, and keep fixture gates
   targeting the generated library while guarding the tracked sample. Add
   `books:find` (table + `--json`) and `books:add`. Write the tutorial as
   chapters of the bundled Tome guide plus a README section, covering the agent
   recipe, LAN-to-tablet serving, static hosting caveats, and the campaign
   "sealed tablets" recipe.

Alternative considered: two sprints, one per intent. Not chosen because the user
framed both as this sprint's work and one plan approval keeps the session moving.
The build order still lands the theme first, so a later explorer blockage cannot
strand it.
Rationale: both requests are user-visible and bounded, and they reinforce each
other: the tutorial's campaign recipe is where the hidden theme gets used.

## Artifacts
- `palette-derivation.md` — OKLCH/WCAG derivation for every Sanguine role and the `#FF0000` vs `#BA1A1A` comparison.
- `explorer-findings.md` — observed explorer defects (tracked-manifest edits, deleted sample, `.git` copy) and the discovery scan summary.
