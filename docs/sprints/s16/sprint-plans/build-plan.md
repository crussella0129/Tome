Finalized - DO NOT EDIT

# Sprint 16 Build Plan

## Intents
- [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md) — state: planned; acceptance criteria covered: 1 + 3 (build/launch + offline `dist/` + shell behaviors — T-038), 2 + 4 (faithful aesthetic + recorded go/no-go + isolation — T-039).

## Schema Tree
- Sprint Goal: a de-risking Tauri v2 spike → go/no-go
  - Scaffold + load + behaviors
    - T-038: isolated `src-tauri/` app, offline `dist/`, external links, secure window
  - Verify + recommend
    - T-039: build/launch, aesthetic screenshot, go/no-go, isolation/no-regression

## Execution Sequence

### T-038: Scaffold the isolated Tauri app + offline `dist/` load + shell behaviors
- **Intent:** [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md)
- **Touches:** `src-tauri/` (new — `Cargo.toml`, `tauri.conf.json`, `src/main.rs`/`lib.rs`, `build.rs`, `capabilities/default.json`), `package.json` (`@tauri-apps/cli` dev + `tauri`/`tauri:dev` scripts), `.gitignore` (`src-tauri/target/`)
- **Depends on:** (none)
- **Acceptance criterion:** INT-0015 #1, #3.
- **Success criterion (EARS):**
  - **WHEN** the Tauri app runs against the built `dist/` (via `frontendDist` → `../dist`, or a Rust custom URI-scheme handler if directory routes 404), **THEN** a native WebView2 window **SHALL** open and render `/` (the Bibliotheca) and a chapter **offline** (no dev server, no network), with Astro's directory routes (`/tome/getting-started`) and root-absolute assets (`/_astro/…`, `/fonts/…`, `/search-index.json`) resolving.
  - **WHEN** a link or navigation targets an `http`/`https` URL, **THEN** the shell **SHALL** open it in the OS default browser (opener plugin) and keep app-origin navigation in-app; the window **SHALL** use Tauri's secure defaults (no Node in the webview, capability allowlist).
- **Notes:** try Tauri's built-in `frontendDist` asset serving first; if Astro's directory→`index.html` routes 404, register a Rust custom protocol mirroring `scripts/dist-resolve.mjs` `resolveDistPath` (directory→`index.html`, `..`-escape guard — logic known). External links: `tauri-plugin-opener` + a navigation guard (the Electron `setWindowOpenHandler`/`will-navigate` parity). All under `src-tauri/`; `electron/` and the web build untouched. First `cargo build` compiles the Tauri crate tree (minutes; `target/` git-ignored).

### T-039: Build + launch verification, rendering evaluation, and the go/no-go
- **Intent:** [INT-0015](../../../intents/INT-0015-tauri-shell-spike.md)
- **Touches:** `docs/sprints/s16/sprint-tests/` (evaluation notes + the recommendation, produced in the Test Phase), `README.md` (a short "experimental Tauri" note), a captured screenshot (scratchpad/docs)
- **Depends on:** T-038
- **Acceptance criterion:** INT-0015 #2, #4.
- **Success criterion (EARS):**
  - **WHEN** the spike is built and launched on Windows/WebView2, **THEN** a chapter's `<h1>` and the sacred aesthetic (parchment ground, self-hosted Mekzantine font, the modern CSS Tailwind v4 emits) **SHALL** render comparably to the Electron/Chromium shell, captured as a screenshot for evaluation.
  - **WHEN** the evaluation completes, **THEN** a written **go/no-go** recommendation **SHALL** be recorded with evidence (build/launch result, rendering observations, approximate bundle size, porting-effort estimate, Linux/WebKitGTK risk), **AND** the Electron shell + every existing gate **SHALL** remain green (isolation/no-regression).
- **Notes:** launch the built app and capture a Windows screenshot (PowerShell `System.Drawing`) of the window to judge the aesthetic and show the user. **Criterion 2 is a visual judgment** — the screenshot is *surfaced to the user for confirmation*; the go/no-go records the observation, but the aesthetic sign-off is the user's, not self-certified. Record the release exe/bundle size vs Electron. Automated Tauri E2E (tauri-driver/WebdriverIO) is out of scope for a spike — deferred to the full-port sprint on a "go". Re-run `vitest` + `check:electron` + `test:e2e` + the four `check:*` gates + `astro check` to prove the spike changed nothing.
