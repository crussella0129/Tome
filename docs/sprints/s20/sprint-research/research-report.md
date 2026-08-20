# Sprint 20 Research Report

## Intents Reviewed

- [INT-0013 — Resilient scaling & zoom](../../../intents/INT-0013-resilient-scaling-zoom.md)
  — **selected as realized context**; its overflow and breakpoint guardrails remain
  valid, but they do not prove balanced or usable element geometry.
- [INT-0014 — Discoverable library](../../../intents/INT-0014-discoverable-library.md)
  — **selected as realized context**; the Bibliotheca is the right host for both
  library search and the future native add action.
- [INT-0012 — Desktop shell (Electron)](../../../intents/INT-0012-desktop-shell-electron.md)
  — **selected as realized context**; it deliberately names arbitrary local-library
  opening as follow-on work and defines the secure renderer boundary to preserve.
- [INT-0019 — Centered reader and resilient search geometry](../../../intents/INT-0019-centered-reader-search-geometry.md)
  — **created and selected** (`proposed`) for Sprint 20's bounded implementation.
- [INT-0020 — Native library folder management](../../../intents/INT-0020-native-library-folder-management.md)
  — **created** (`proposed`) as the end-to-end follow-on. It is intentionally not
  collapsed into a picker-only task that cannot update the compiled library.

## 1. Sprint Goal

Center the complete reading stack inside the reader's actual main-content track and
make the shared search control resilient in both the Bibliotheca and reader from a
320 CSS-pixel browser viewport through the 768/769 and 1023/1024 grid boundaries.
Prove usable element geometry—not merely absence of overflow. In parallel, preserve
the reported “Add Tome…” need as a separate native-library intent whose acceptance
boundary includes persistence, staged generation, and a real navigable/searchable
Bibliotheca entry. Sprint 20 implements INT-0019; INT-0020 remains proposed for a
dedicated runtime-library sprint.

## 2. Existing Code Survey

| File | Relevance | Notes |
|------|-----------|-------|
| `src/layouts/BookLayout.astro` | high | `.content` only adds padding; the search and slot have no shared centered inner column. Its grid changes at 48.0625rem and 64rem. |
| `src/styles/prose.css` | high | `.tome-prose` has `max-width: var(--measure)` but no auto inline margins, so surplus width stays on the right. |
| `src/components/Pager.astro` | high | Repeats the prose maximum-width-without-centering geometry and must stay aligned with the chapter. |
| `src/components/SearchOverlay.module.css` | high | `.trigger` is full-width, but `.root` has no width. The dialog deliberately lets only the input absorb compression. |
| `src/components/SearchOverlay.tsx` | high | Shared Bibliotheca/reader search island and the semantic targets for trigger, input, decorative icon, and close-control tests. |
| `src/components/Bibliotheca.astro` | high | Normal-flow search host fills its shelf width; future native library management also belongs here. |
| `e2e/scaling.spec.ts` | high | Sweeps 480–2560 and checks overflow/grid mode, but not centered content, Bibliotheca-open search, usable input width, or sibling overlap. |
| `package.json` | high | `predev`/`prebuild` load books before Astro; the desktop commands consume a completed static build. |
| `scripts/load-books.mjs` | high | Resolves env/config roots and atomically publishes generated source content before the build, but has no per-user runtime manifest. |
| `src/lib/book.ts` | high | Uses compile-time Vite/Astro globs for book metadata and chapters. |
| `src/pages/[...slug].astro` | high | Uses `getStaticPaths`; a newly selected folder cannot add a route to an already running build. |
| `electron/main.cjs` | high | Serves one fixed `dist/` through a secure protocol and intentionally has no preload/IPC filesystem bridge. |
| `src-tauri/tauri.conf.json` | high | Embeds `../dist` at package time; selected folders cannot change the installed route graph by themselves. |
| `src-tauri/src/lib.rs` | high | Builds a secure native window and link handling but exposes no library command or runtime builder. |
| `src-tauri/capabilities/default.json` | medium | Grants only the opener capability; a future picker/adapter must remain narrowly scoped. |
| `README.md` | medium | Documents config/env loading and already names arbitrary local-library opening as desktop follow-up work. |

Runtime geometry probes against the current built app reproduced the reader trigger
at about 198px from 320–1280px despite as much as 416px of host space. Giving the
search root `width: 100%; max-width: 26rem` yielded overflow-free trigger widths of
416/416/353/384/416/368/384/416px at 480/768/769/800/1023/1024/1040/1280. The open
dialog was healthy at the desktop minimum (448px dialog, 345px input at 480), but at
320px the input fell to about 185px because fixed padding, gaps, icon, and 32px close
control consume the rest.

## 3. External Sources

- [Electron `dialog`](https://www.electronjs.org/docs/latest/api/dialog) — native
  `showOpenDialog({ properties: ['openDirectory'] })` returns selected paths from the
  privileged main process.
- [Electron IPC tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc) —
  recommends a narrow preload bridge instead of exposing `ipcRenderer` wholesale.
- [Tauri dialog plugin](https://v2.tauri.app/plugin/dialog/) — provides native desktop
  directory selection; its granted scope is not persisted automatically, reinforcing
  the need for a dedicated persisted library command.
- [MDN `showDirectoryPicker()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker) —
  the browser API is secure-context-only, experimental/limited-availability, and
  returns a directory handle rather than solving Tome's native persistence/build need.

## 4. Risks, Unknowns, Dependencies

- **Breakpoint width drops:** at 769px the sidebar appears, and at 1024px the rail
  appears on headed pages. The available reader width legitimately shrinks at those
  boundaries. Tests must assert a usable responsive floor, not a constant 26rem.
- **Wrong centering reference:** centering against the viewport would be incorrect
  when sidebar and rail tracks differ. Geometry must compare against `main.content`.
- **Narrow search trade-off:** the 32px close target is interactive; reclaim width
  first from decorative icon/spacing, not from the close action.
- **Native picker false finish:** choosing a path is easy, but the current static
  routes/assets/search index cannot incorporate it. INT-0020 depends on a persisted
  manifest plus a staged runtime build/switch and shell-specific native adapters.
- **Shell parity:** Electron can host a Node/Astro builder most directly. Tauri's
  embedded `dist` needs a sidecar or equivalent service; unsupported shells must hide
  the action until the complete contract exists.
- **Local state:** this sprint must not consume or commit the user's configured Bible
  library. It is preserved outside the active fixture tree for deterministic gates.

## 5. Recommended Approach

Primary for Sprint 20:

1. Wrap the existing reader search bar and slotted chapter output in one
   `.reading-column` with `width: 100%`, `max-width: var(--measure)`, `min-width: 0`,
   and `margin-inline: auto`. This centers prose, pager, and search as one stack.
2. Give `SearchOverlay`'s root the existing trigger width contract (`width: 100%`,
   `max-width: 26rem`). At a truly narrow viewport, reduce field spacing and hide the
   decorative icon before allowing the input to become unusable; preserve the close
   target.
3. Extend the responsive Playwright suite with wide headed/no-rail centering checks,
   mobile navigation stability, both search hosts, 320/480 sizes, and exact grid-edge
   geometry/overlap assertions.

Follow-on for INT-0020: add a desktop-only Bibliotheca island backed by narrow native
adapters; persist selected roots in per-user app data; reuse existing book validation;
stage a complete generated site and atomically switch/reload on success. Plan Electron's
runtime-builder path first, then Tauri sidecar parity, without presenting an inert button.

Alternative considered: bundle all three observations into one implementation sprint.
Rejected because it would either ship a non-functional picker or mix a cross-platform
runtime-build architecture with a bounded layout correction, weakening both acceptance
proofs.

## Artifacts

- [INT-0019](../../../intents/INT-0019-centered-reader-search-geometry.md) — created
  as Sprint 20's selected responsive-layout authority.
- [INT-0020](../../../intents/INT-0020-native-library-folder-management.md) — created
  as the durable native-library follow-on authority.
- This research report, including the runtime geometry measurements and the bounded
  implementation/follow-on decision.
