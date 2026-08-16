# Tauri desktop shell — go/no-go (Sprint 16 spike, INT-0015)

## Verdict: **GO** — proceed to a full Tauri port in a follow-on sprint, keeping Electron as the fallback until the port is proven cross-platform.

The spike (an isolated `src-tauri/` Tauri v2 app loading the existing `dist/`)
cleared every question we set out to answer on Windows, and the one open risk is
platform-specific and deferrable.

## Evidence

| Question | Result |
|---|---|
| Does it build here? | **Yes** — Rust 1.96 + WebView2 151. First `cargo build` 2m10s; incremental ~20s; release 1m54s. |
| Loads `dist/` offline? | **Yes** — the window opens the Bibliotheca with no dev server / network (`evidence/tauri-bibliotheca.png`). |
| Do Astro's directory routes resolve? (top risk) | **Yes, natively** — `/marginalia` (no `.html`) rendered the full reader (`evidence/tauri-reader.png`). **No custom protocol needed** — Tauri's asset server does the directory→`index.html` fallback that Electron needed a resolver for. |
| Is the aesthetic faithful? | **Yes** — pixel-identical to Chromium: parchment ground, self-hosted Mekzantine fonts, rubric-red accents, the sidebar + switcher + rail layout, the Solid search island hydrated. (WebView2 *is* Chromium on Windows.) |
| Internal vs external links? | Internal navigation stays in-app (the reader navigated between routes); external `http(s)` is routed to the OS browser via `on_navigation` + `tauri-plugin-opener`. |
| Secure? | Secure by default — no Node in the webview, capability allowlist (`capabilities/default.json`). |
| Size / memory? | **8.6 MB** release exe vs Electron's **348 MB** bundled runtime (~40× smaller); main process **~37 MB** RAM. |

## Bundle-size comparison

| | Tauri (this spike) | Electron (shipping) |
|---|---|---|
| Runtime | OS WebView2 (already on Windows) | bundled Chromium **~348 MB** |
| App binary | **8.6 MB** (release exe) | electron.exe + resources |
| Web payload | `dist/` ~276 KB (embedded) | `dist/` ~276 KB (served) |

## Porting effort (low–medium)

The shell is thin and most of it already works or maps 1:1:
- **Done in the spike:** offline `dist/` load, directory-route resolution (free),
  secure window, external-link routing, internal nav.
- **Straightforward to add:** `tauri`/`tauri:dev` scripts (added), signed
  installers via the Tauri bundler (`tauri build` → NSIS/MSI, code-signing), Rust
  file dialogs for "open an arbitrary local library."
- **Needs a parity port:** the theme-aware **window icon** (Electron swaps it live on
  OS theme change; Tauri's runtime icon control is more limited — verify), and the
  **zoom lock** (WebView2 zoom disable) from INT-0013.

## Risks / caveats

- **Linux / WebKitGTK is unverified.** This spike only covers **Windows/WebView2**
  (Chromium). Tailwind v4 emits `color-mix`, `oklch`, `dvh`, etc.; WebKitGTK can
  lag. **Before removing Electron, the full-port sprint must verify the aesthetic on
  Linux/WebKitGTK** (a Linux run or CI). This is the single reason to keep Electron
  as the fallback.
- Automated Tauri E2E needs a WebDriver harness (`tauri-driver`/WebdriverIO) — a
  follow-on for the full port, not the spike.

## Recommended next steps (a follow-on "full-port" intent, on this GO)

1. Port the remaining shell parity (theme icon, zoom lock, launch scripts) and add
   a Tauri E2E harness.
2. Verify Linux/WebKitGTK rendering.
3. Produce signed installers via the Tauri bundler.
4. Then decide whether to make Tauri the default and retire Electron — Electron
   stays until this is proven cross-platform.

## Isolation (this spike changed nothing existing)

The spike lives entirely under `src-tauri/` (+ the `@tauri-apps/cli` devDep, a
`tauri` npm script, and a `tsconfig.json` exclude so `astro check` ignores
`src-tauri/target/`). No `electron/`, `src/`, `scripts/`, or web build changed.
Verified: Vitest 96/96, `astro check` 0 errors, `check:electron` 6/6, the browser
suite and the four build gates green.
