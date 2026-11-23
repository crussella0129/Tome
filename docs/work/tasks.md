# Agent Tasks (Persistent Backlog)

- [ ] T-052 (backlog) [intent: INT-0020]: Implement native folder selection, per-user library persistence, and staged atomic library publication across supported desktop shells — touches: Bibliotheca desktop island, Electron/Tauri native adapters, runtime builder, tests, documentation
- [ ] T-063 (backlog) [intent: INT-0024]: Opt-in service worker so tablets reopen visited chapters offline — touches: build config, a service-worker entry, BookLayout/Bibliotheca registration, E2E offline test, Take It to the Table chapter
- [ ] T-064 (backlog) [intent: INT-0024]: Base-path builds for sub-path static hosting — touches: astro.config base, a base-aware URL helper (paths.ts, search, Bibliotheca, init-theme), serve-dist, E2E sub-path build, tutorial
- [ ] T-070 (sprint 24) [intent: INT-0029]: Open the first chapter at a tome's own address when it has no opening page — touches: src/lib/book.ts, src/lib/__tests__/book.test.ts
- [ ] T-071 (sprint 24) [intent: INT-0029]: Let books:add take a document or a loose folder — touches: scripts/find-books.mjs, src/lib/__tests__/find-books.test.ts
- [ ] T-072 (sprint 24) [intent: INT-0029]: Say in npm run dev that live reload is off for documents — touches: astro.config.mjs, scripts/document-source.mjs, src/lib/__tests__/document-source.test.ts
- [ ] T-073 (sprint 24) [intent: INT-0029]: Prove documents in a built site with a gate and a browser check — touches: scripts/check-documents.mjs, e2e/documents.spec.ts, playwright.config.ts, package.json, .github/workflows/ci.yml, fixtures/papers/, src/lib/__tests__/fixture-commands.test.ts, src/lib/__tests__/ci-workflow.test.ts
- [ ] T-074 (sprint 24) [intent: INT-0029]: Tell a person how to add a document — touches: src/content/books/tome/find-your-books.md, README.md, tome.config.toml, src/lib/__tests__/tutorial.test.ts
