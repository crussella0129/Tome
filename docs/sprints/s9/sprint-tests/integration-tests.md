# Sprint 9 Integration Tests

- **Tested head:** `777f6fe160bc7d111bbf8c99fca93e48004f9ee2`
- **Task commit:** `fc1b8f4`

## `gate_external_parent_asset_optimized`

`node scripts/check-external-build.mjs` passed serially. For the handbook it
proved both image classes were emitted as distinct, existing, non-empty hashed
assets:

- `./img/plate.svg` → `/_astro/plate.<hash>.svg`;
- `../assets/parent-plate.svg` → `/_astro/parent-plate.<hash>.svg`.

The gate then ran the isolated external Chromium suite **3/3**, validated the
config-less docs-book routes, strictly restored `src/content/books/` after each
case, and completed a five-route bundled-sample rebuild. Scoped content status
was empty afterward.

## `gate_multibook`

`node scripts/check-multibook.mjs` passed for the two-tome Bibliotheca,
namespaced routes, and sidebar switcher. The handbook's parent plate also
optimized in multi-tome mode. The gate restored the sample and successfully
rebuilt all five default routes; scoped content status remained empty.

## Loader staging and publication integration

The real-process tests in `load-books.test.ts` exercised the complete loader,
not a stub:

- one- and two-tome parent-asset preparation and metadata publication passed;
- equal relative paths remained tome-private;
- declared and symlinked source directories retained their authoritative
  behavior while asset targets were independently confined; and
- every later-tome invalid-target case preserved a pre-existing destination
  and removed the complete sibling stage.

An independent implementation review first found a reserved-directory
traversal bypass. After an unconditional collision preflight, a nested bypass
regression case, escaped-image coverage, and rollback-safe publication were
added, the focused 30-test run and every canonical gate passed, and the
reviewer's second verdict was **clean**.

## Hosted integration confirmation

[GitHub Actions run 31740605981](https://github.com/crussella0129/Tome/actions/runs/31740605981)
checked out the exact tested head on Ubuntu with Node 24.19.0. Its external-book
step passed both fixture cases, emitted `parent-plate.<hash>.svg`, ran the three
external browser tests, restored the sample, and rebuilt the default. The
downstream multi-book step also passed and rebuilt the default.
