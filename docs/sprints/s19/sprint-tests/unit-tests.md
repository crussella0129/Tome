# Sprint 19 — Unit Test Results

- **Tested head:** `a046b8917dc7f19b83fc07ffb693765aa91688a0`
- **Intent:** [INT-0018](../../intents/INT-0018-tauri-linux-parity.md)

## New unit tests

None. The sprint is a cross-platform build + WebKitGTK launch verification + docs, not
pure logic:

- No new shell code was written — WebKitGTK needed **no** zoom handler (Ctrl+scroll does
  not zoom, verified at launch), so `src-tauri/src/lib.rs` is unchanged; the existing
  cross-platform paths (`title("Tome")`, `set_icon`, `zoom_hotkeys_enabled(false)`,
  `on_navigation` + opener) simply hold on Linux.
- `scripts/build-linux.sh` is a build wrapper, exercised end-to-end by the actual Linux
  build (see `integration-tests.md`).

The **build itself is the machine check** of the code on Linux: the same `src-tauri/`
compiles clean against webkit2gtk-4.1, and still compiles clean + `clippy`-0 on the
Windows target (coexistence).

## Regression (the existing web unit suite is untouched)

- `npx vitest run` → **97 passed / 97** (20 files). The sprint added only
  `scripts/build-linux.sh` + a README note + docs — nothing the web unit suite depends on.
