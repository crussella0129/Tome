# INT-0015 — Tauri desktop shell (feasibility spike)

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0015
- **State:** active
- **Work evidence:** [Sprint 16 build plan (T-038, T-039)](../sprints/s16/sprint-plans/build-plan.md)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Evaluate **Tauri** as the specialized desktop platform for Tome by building a
de-risking **spike**: a minimal Tauri (v2) app that loads the existing built
`dist/` **offline** in a native webview window (WebView2 on Windows), renders the
reader with the ink-on-old-paper aesthetic intact, and routes external links to
the OS browser — enough to produce an **evidence-backed go/no-go recommendation**
on migrating the desktop shell from Electron to Tauri. The Electron shell remains
the shipping default and the fallback; the spike is isolated and does not modify
or replace it.

## Acceptance criteria

1. A minimal Tauri v2 app builds and launches on this platform (Windows /
   WebView2), loading the committed `dist/` fully **offline** (no dev server, no
   network) so that a chapter and the Bibliotheca render — including how Astro's
   directory-style routes (`/tome/getting-started` → `…/index.html`) and
   root-absolute assets (`/_astro/…`, `/fonts/…`, `/search-index.json`) resolve
   under Tauri's asset serving.
2. The reader renders **faithfully** in the Tauri webview: the ink-on-paper
   aesthetic — self-hosted fonts, parchment ground, the sacred styling, and the
   modern CSS Tailwind v4 emits (`color-mix`, `min()`, `dvh`, `oklch`, etc.) — is
   intact and comparable to the Electron/Chromium rendering; any webview-specific
   gaps are documented.
3. The core shell behaviors are demonstrated: internal navigation stays in-app,
   and an external `http`/`https` link opens in the OS default browser — the
   Electron shell's behaviors, reproduced in Tauri's model (secure by default).
4. A written **go/no-go recommendation** is recorded in the Book, backed by
   evidence: build + launch result, rendering observations, an approximate bundle
   size and porting-effort estimate, and the risks (chiefly Linux/WebKitGTK CSS
   parity, which this Windows spike can only partially cover). The spike lives in
   its own directory (e.g. `src-tauri/`), leaves the Electron shell and every
   existing gate untouched and green, and is clearly marked experimental.

## Rationale

Tome is ~95% a web application (the Astro/Solid reader compiled to `dist/`); the
Electron "shell" is thin. Tauri is therefore a **shell swap, not a rewrite** —
keep the whole web reader, replace the Chromium bundle with the OS webview + a
small Rust backend, gaining a ~10–20× smaller bundle, lower memory, Rust
alignment, and a built-in installer/signing path. egui (pure-Rust immediate-mode)
was rejected as the wrong tool for a rich, print-capable document reader (it would
discard the entire web frontend). The one real risk — webview CSS consistency,
especially Linux/WebKitGTK — is exactly what a spike de-risks before committing to
a full port, per the user's explicit "spike-first" choice.

## Alternatives

- **egui / eframe (pure-Rust rewrite).** Rejected: immediate-mode GUI is built for
  tools/dashboards, not flowing documents with footnotes, tables, print/PDF, and a
  CSS design system; it would abandon Sprints 0–15's web reader.
- **Port directly to Tauri, no spike.** Rejected: the webview-parity risk warrants
  a cheap, reversible proof-of-concept first; Electron stays as the fallback.
- **Stay on Electron.** The valid status quo and fallback; the spike decides
  whether Tauri's gains justify the migration.

## Consequences

- The full shell port (custom protocol/asset resolution, secure window,
  external-link routing, theme icon, zoom handling, launch scripts) and signed
  installers are follow-on intent(s), **gated on a "go."** On "no-go," Electron
  remains and the spike may be kept as a reference or removed.
- The spike adds a Rust toolchain + `@tauri-apps/cli` (dev) and a `src-tauri/`
  crate; the first `cargo build` compiles the Tauri dependency tree (minutes,
  a large `target/` — git-ignored). It does not touch `electron/` or the web build.

## Transition history

- 2026-08-15: created as `proposed` during Sprint 16 research — after the Electron
  shell reached functional maturity (Sprints 14–15), evaluate the planned Tauri
  specialization; Windows feasibility confirmed (WebView2 151.x + Rust 1.96 present).
- 2026-08-15: `proposed → planned` — Sprint 16 plans T-038 (isolated `src-tauri/`
  app loading `dist/` offline + external-link routing + secure window) and T-039
  (build/launch verification, aesthetic screenshot, recorded go/no-go, isolation),
  covering all four criteria.
- 2026-08-16: `planned → active` — Sprint 16 Build Phase began with T-038.
