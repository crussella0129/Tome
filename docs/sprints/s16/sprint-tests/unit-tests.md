# Sprint 16 — Unit Test Results

- **Tested head:** `c3378fc1caed23c7bbccca524eef8dfa2512dace`
- **Intent:** [INT-0015](../../intents/INT-0015-tauri-shell-spike.md)

## New unit tests

None. The spike added no pure logic that warrants a unit test: the Tauri
navigation guard (`src-tauri/src/lib.rs`) is a small scheme/host check, and the
directory-route resolution the reader needs is handled **natively** by Tauri's
asset server (so the custom-protocol resolver — which *would* have carried a Rust
unit test — was not needed). See `go-no-go.md`.

## Regression (the existing web unit suite is untouched)

- `npx vitest run` → **96 passed / 96** (19 files). The spike added only
  `src-tauri/` + a devDep + a script + a `tsconfig` exclude, none of which the web
  unit suite depends on. (The recurring Windows-only `load-books` temp-cleanup
  `EPERM` marked one file failed while all 96 tests passed — Linux CI unaffected.)
