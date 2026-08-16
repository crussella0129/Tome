# Sprint 19 Meta

- **Sprint number:** 19
- **Book schema version:** 2
- **Start timestamp:** 2026-08-16T20:44:26Z
- **End timestamp:** 2026-08-16T21:35:38Z
- **Model:** claude-opus-4-8
- **Exit status:** success
- **Token count:** (filled at Loop Phase if observable)
- **Summary:** Tauri shell to Linux/WebKitGTK parity — build the same src-tauri/ on WSL2 Ubuntu (webkit2gtk-4.1) into a native .deb, verify a WSLg launch renders offline with Tome branding + zoom parity, keeping Windows Tauri + Electron + all gates green (Electron stays the default).
- **Intents:** [INT-0018](../../intents/INT-0018-tauri-linux-parity.md) — planned (T-047 Linux build + .deb; T-048 WebKitGTK launch verification + parity; T-049 coexistence + docs).
- **Completion evidence:** INT-0018 realized — Tauri Linux/WebKitGTK parity: the one src-tauri/ builds in WSL (webkit2gtk-4.1) into a native .deb (4.1MB) + AppImage; launched under WSLg it renders Bibliotheca + a chapter offline with 'Tome' branding and non-collapsing zoom (no shell code change); Windows Tauri + Electron + Vitest 97 + browser 21 + gates all green
