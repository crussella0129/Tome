Finalized - DO NOT EDIT

# Sprint 19 Test Plan

## Intent Traceability
| Intent | Acceptance criterion | Build task / EARS clause | Verification |
|--------|----------------------|--------------------------|--------------|
| [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md) | 1 — builds + packages on Linux | T-047 / WHEN built in WSL vs webkit2gtk-4.1 … THEN a native `.deb` | `tauri build` in WSL emits a `.deb` under `target/release/bundle/deb/` (path + size recorded); AppImage best-effort |
| [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md) | 2 — offline render on WebKitGTK | T-048 / WHEN run under WSLg … THEN chapter renders offline + external link → OS browser | WSLg launch: Bibliotheca + a chapter render offline; external link opens the OS browser; screenshot surfaced |
| [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md) | 3 — branding + zoom parity | T-048 / WHEN gesture occurs … THEN SHALL NOT collapse the reader; title "Tome" + theme icon | launch: title "Tome" + theme icon (best-effort GTK); an accidental zoom gesture does not collapse the layout (observed; WebKitGTK handler only if a gap is found) |
| [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md) | 4 — coexistence + docs | T-049 / WHEN Linux support lands … THEN Windows/Electron/gates green + README | Windows `cargo build`/clippy clean; Vitest 97; `astro check` 0; `check:electron` 6/6; `test:e2e` 21; four gates green; README Windows+Linux |

## Unit Tests
- **Intent:** [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md)
- None. The work is a cross-platform build + WebKitGTK launch verification + docs. Any
  Linux zoom branch added to `lib.rs` is a platform side effect (a WebKitGTK signal
  handler), verified by build + launch, not a pure function.

## Integration Tests
### Linux build + launch (the whole reader in a native WebKitGTK window)
- **Intent:** [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md)
- `tauri build` in WSL is the integration test of the built `dist/` compiled into a
  native Linux package; the WSLg launch is the integration test of the whole reader
  (Bibliotheca + a chapter, offline, external-link routing) rendering on WebKitGTK.
  Evidence: `evidence/*.png`, recorded `.deb` path/size.

### Coexistence / no-regression
- **Intent:** [INT-0018](../../../intents/INT-0018-tauri-linux-parity.md)
- `cargo build`/`clippy` (Windows target), `npx vitest run`, `astro check`,
  `npm run check:electron`, `npm run test:e2e`, and `check:external`/`multibook`/
  `search`/`livereload` — all remain green. All changes are additive / `cfg`-gated under
  `src-tauri/` (+ a build script + README), so the Windows build, the Electron shell, and
  the web app are untouched.

## End-to-End Tests
- **Status:** not-yet-possible (automated), by design
- **Rationale / unlocked by:** an automated Tauri E2E (Linux or Windows) needs a
  WebDriver harness (`tauri-driver` + WebdriverIO) — a named follow-on intent, as on
  Windows (INT-0017). Standing it up mid-Linux-port is disproportionate; the identical
  `dist/` is already covered end-to-end by the browser (21/21) and Electron (6/6) suites.
- **Port verification instead:** `tauri build` in WSL emits a `.deb` (recorded); the built
  app is launched under WSLg and captured rendering a chapter offline with the Tome
  branding + zoom that can't collapse the layout + an external link opening the OS
  browser. The render/icon/zoom are **visual/behavioural** and surfaced to the user for
  sign-off. `.rpm`, Linux signing, cross-DE nuances, and CI Linux builds are follow-ups.
