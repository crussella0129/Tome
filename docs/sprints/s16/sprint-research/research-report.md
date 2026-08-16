# Sprint 16 Research Report

## Intents Reviewed

- [INT-0015 — Tauri desktop shell (feasibility spike)](../../intents/INT-0015-tauri-shell-spike.md)
  — **created** this sprint (`proposed`). A platform-evaluation outcome (spike →
  go/no-go), distinct from the shipped Electron shell (INT-0012).

## 1. Sprint Goal

Build a **de-risking Tauri v2 spike**: a minimal, isolated Tauri app that loads the
existing `dist/` offline in a native WebView2 window, renders the reader with the
sacred aesthetic intact, and routes external links to the OS browser — then record
an evidence-backed **go/no-go** on migrating the shell from Electron to Tauri.
Scope is spike-only (the user chose "spike, then decide"); the Electron shell stays
the shipping default and fallback, untouched.

## 2. Existing Code Survey

| File | Relevance |
|------|-----------|
| electron/main.cjs | The behaviors the spike must reproduce in Tauri: load `dist/` via a custom `app://` protocol, secure window, external `http(s)` → OS browser, internal nav in-app. The reference for the Tauri equivalents. |
| scripts/dist-resolve.mjs | `resolveDistPath` (directory → `index.html`, `..`-escape guard). Tells us the resolution Astro needs; the spike must confirm whether Tauri's asset serving does the directory→`index.html` fallback or whether a custom protocol (mirroring this) is required. |
| dist/ (built, 2-tome) | What the spike serves: `/` (Bibliotheca), `/tome/*`, `/marginalia/*`, `/_astro/*`, `/fonts/*.woff2`, `/search-index.json` — all root-absolute. The key question: do these resolve under Tauri's `frontendDist`? |
| src/styles/tokens.css + prose/paper.css | The aesthetic to verify in WebView2: parchment ground, self-hosted Mekzantine fonts, and modern CSS (`color-mix`, `min()`, `100dvh`) — the WebKitGTK-parity risk surface (Windows/WebView2 is Chromium, so low risk here; Linux is the unknown). |
| package.json | Add `@tauri-apps/cli` (dev, prebuilt binary — no Rust compile for the CLI) + Tauri npm API if used; add `tauri`/`tauri:dev` scripts. `electron` scripts stay. |
| e2e/electron.spec.ts, playwright.electron.config.ts | The Electron proof stays green; the Tauri spike is verified separately (build+launch+screenshot/observation), not folded into the Electron gate. |
| Feasibility probe (this phase) | **WebView2 runtime 151.0.4129.86** installed; **Rust 1.96.0** (cargo/rustc); Tauri CLI installable via npm (prebuilt). Windows build+run is feasible. |

## 3. External Sources

- [Tauri v2 — embedding a frontend (`frontendDist`, asset protocol)](https://v2.tauri.app/start/frontend/)
- [Tauri v2 — Windows prerequisites / WebView2](https://v2.tauri.app/start/prerequisites/)
- [Tauri v2 — Opener plugin (`open` external URLs) & navigation handling](https://v2.tauri.app/plugin/opener/)
- [Tauri v2 — security model (capabilities, CSP, no Node in the webview)](https://v2.tauri.app/security/)
- [egui / eframe (the rejected pure-Rust alternative)](https://github.com/emilk/egui)

## 4. Risks, Unknowns, Dependencies

- **Directory-route resolution (top unknown).** Astro emits `/a/b/index.html` and
  Tome links to `/a/b`. Tauri's built-in asset serving of `frontendDist` may not do
  the directory→`index.html` fallback that our Electron `resolveDistPath` does.
  Mitigation: first try `frontendDist` as-is; if routes 404, register a custom URI
  scheme/protocol handler in Rust mirroring `resolveDistPath` (the logic is known).
- **WebView2 vs WebKitGTK parity.** Windows/WebView2 is Chromium (low risk — should
  match Electron). Linux/WebKitGTK is the real risk for Tailwind v4 features
  (`color-mix`, `oklch`, `dvh`). This Windows spike can only *flag* it; a Linux pass
  is a follow-up. Document explicitly in the recommendation.
- **Build weight.** The first `cargo build` compiles the Tauri crate tree (wry/tao/…)
  — several minutes and a large `target/` (git-ignore `src-tauri/target/`). One-time.
- **External-link + secure config in Tauri's model.** Different API than Electron
  (Rust `on_navigation` / opener plugin, capability allowlist). Mitigation: use the
  opener plugin + a navigation guard; Tauri is secure-by-default (no Node exposure).
- **Isolation.** The spike must not disturb `electron/`, the web build, or the gates.
  Mitigation: everything under `src-tauri/` + new npm scripts; run the full existing
  suite to confirm no regression.
- **Scope discipline.** Spike only — no installers, no icon/zoom port, no Electron
  removal; those are gated on a "go."

## 5. Recommended Approach

- **Scaffold (isolated):** add `@tauri-apps/cli` (dev) + a minimal `src-tauri/`
  crate and `tauri.conf.json` with `frontendDist` → `../dist`, a secure window, and
  the opener plugin; `tauri`/`tauri:dev` npm scripts. Git-ignore `src-tauri/target/`.
- **Offline `dist/` loading:** point Tauri at the built `dist/`; verify directory
  routes + root-absolute assets + `/search-index.json` resolve. If the built-in
  asset server won't do directory→`index.html`, add a Rust custom-protocol handler
  porting `resolveDistPath`.
- **Shell behaviors:** internal nav in-app; external `http(s)` → OS browser via the
  opener plugin + a navigation guard (the Electron parity behaviors).
- **Verify + recommend:** build + launch on Windows/WebView2; confirm a chapter and
  the Bibliotheca render with the aesthetic intact (screenshot/observation); record
  a **go/no-go** with bundle size, effort estimate, and the WebKitGTK risk. Confirm
  the Electron shell + all gates stay green (isolation).
- **Tasks (Plan Phase):** (T-038) scaffold + offline `dist/` load + shell behaviors;
  (T-039) build/launch verification, rendering evaluation, and the recorded go/no-go
  + isolation/no-regression check.

## Artifacts

- [INT-0015](../../intents/INT-0015-tauri-shell-spike.md) (created).
- This report; feasibility-probe evidence (WebView2 151.0.4129.86; Rust 1.96.0;
  Tauri CLI installable via npm). Electron shell (`electron/main.cjs`) + `dist/`
  structure are the porting reference.
