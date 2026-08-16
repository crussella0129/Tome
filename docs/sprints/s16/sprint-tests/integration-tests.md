# Sprint 16 — Integration Test Results

- **Tested head:** `c3378fc1caed23c7bbccca524eef8dfa2512dace`
- **Intent:** [INT-0015](../../intents/INT-0015-tauri-shell-spike.md)

## Spike isolation / no-regression (criterion 4)

The Tauri spike must not disturb the web build or the Electron shell. Everything it
added is confined to `src-tauri/` plus the `@tauri-apps/cli` devDep, a `tauri` npm
script, and a `tsconfig.json` exclude (so `astro check` ignores `src-tauri/target`).
The full existing suite stays green:

| Suite / gate | Result |
|---|---|
| `npx vitest run` | **96 passed / 96** |
| `astro check` | **0 errors / 0 warnings / 0 hints** (after excluding `src-tauri`) |
| `npm run check:electron` | **6 passed / 6** |
| `npm run test:e2e` (browser) | **21 passed / 21** |
| `npm run check:external` | **exit 0** |
| `npm run check:multibook` | **OK** |
| `npm run check:search` | **OK** (tree restored) |
| `npm run check:livereload` | **OK** |

## Tauri build/launch (integration of the whole reader in a native webview)

The spike itself is the integration test of the built `dist/` inside a native
window: `cargo build` → launch → the Bibliotheca and a reader chapter (via the
directory route `/marginalia`) render, with root-absolute assets, self-hosted
fonts, and the Solid search island all resolving. Evidence: `evidence/*.png`,
`go-no-go.md`.
