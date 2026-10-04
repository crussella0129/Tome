# Sprint 22 Integration Verification

## Personal library (INT-0023 AC2–AC5)

- `test_personal_build_leaves_checkout_clean` (real disposable git repository): a
  `tome.local.toml` book publishes into `src/content/library/`;
  `git status --porcelain --untracked-files=all` is empty; the committed sample
  and tracked `tome.config.toml` are byte-identical.
- **On the user's real library** (active workspace, `tome.local.toml` listing a
  large root-layout mdBook): `npm run build` published it into the ignored
  library at 21 MB (the pre-refactor copy was 35 MB), with **no `.git`** inside,
  and `git status` showed no library or manifest changes. (Personal content is
  not reproduced here.)

## Production fixture gates — now runnable in the active workspace

Sprint 21 had to run these in a disposable worktree because a personal library
dirtied the tracked sample. After T-058 they ran in the user's workspace
directly, with the personal manifest present and ignored by the gate's pinned
empty manifest:

| Gate | Result |
|---|---|
| `npm run check:external` | PASS — handbook + docs-book; Chromium **3 passed** |
| `npm run check:multibook` | PASS — two-tome routes, Bibliotheca, switcher |
| `npm run check:search` | PASS — single + namespaced index, queries resolve |
| `npm run check:livereload` | PASS — live edit + parent image; owned dev pid stopped |

The tracked sample stayed clean after every gate.

## Discovery on a real machine (INT-0023 AC1)

`npm run books:find -- .. --depth 3` listed 31 books under the user's home in
seconds: 21 Sprint Loops Project Books, several nested `rust-book` editions, the
user's root-layout mdBook (67 chapters), and Tome's fixtures. The generated
library was not listed, and no `src/`/`docs/` folder was listed twice.

## Tutorial claims checked against live servers (INT-0023 AC6)

- `verify_live_unseal` (scripted; `TOME_BOOK=<temp copy> npm run dev -- --background --host 127.0.0.1`):
  - the unlinked chapter `/third` returned **404**;
  - after its `SUMMARY.md` entry was linked, it served in **0.043–0.046 s**,
    with its sidebar link, without a restart;
  - the raw source file was fetchable from the dev server (`rawReachable: true`),
    so the tutorial's "sealing is not a lock" warning is factual.
- `npm run preview -- --host` served `/tome/getting-started` with **HTTP 200**
  on `localhost` and on a LAN address; `npx astro preview stop` stopped it.
