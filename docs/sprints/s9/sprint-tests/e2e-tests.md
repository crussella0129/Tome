# Sprint 9 End-to-End Tests

- **Tested head:** `777f6fe160bc7d111bbf8c99fca93e48004f9ee2`
- **Task commit:** `fc1b8f4`

## External handbook browser proof

The serialized external gate served the production handbook build and passed
**3/3** tests using one Chromium worker:

- `test_external_book_renders_in_browser` retained the fixture-specific
  heading, prose, active TOC link, route, and bundled-sample exclusion proof.
- `test_external_relative_image_loads` retained visible browser decode,
  positive natural width, and sacred-prose border proof for the existing
  in-source plate.
- `test_external_parent_relative_image_loads` located the uniquely named
  `A parent-held plate` inside main prose, awaited `decode()`, and proved it was
  visible and complete with positive natural width, a hashed
  `/_astro/parent-plate.<hash>.svg` current URL, and positive computed border
  width.

The external gate's generated-output assertions separately proved both hashed
files existed and were non-empty, so the browser assertions do not merely trust
an authored URL.

## Bundled-reader and mode-isolation regression

- Default `npx playwright test --list` listed exactly **8 tests in 1 file**,
  all from `reader.spec.ts`; no external test appeared.
- Canonical default `npx playwright test` passed **8/8** using eight workers
  after all fixture-mutating gates had restored the bundled sample.
- External execution ran exactly the three tests in `external-book.spec.ts`
  using its dedicated prebuilt-server mode and did not alter the ordinary
  suite's HTML reporter contract.

## `gate_hosted_parent_asset_browser`

- **Run:** [GitHub Actions 31740605981](https://github.com/crussella0129/Tome/actions/runs/31740605981)
- **Head:** `777f6fe160bc7d111bbf8c99fca93e48004f9ee2`
- **Job:** `verify` ID `94582776775` completed with **success** in 1m12s.
- **Ordinary E2E:** **8 passed** using two hosted workers.
- **External E2E:** **3 passed** using one hosted worker. The hosted log names
  `test_external_book_renders_in_browser` (249ms),
  `test_external_relative_image_loads` (155ms), and
  `test_external_parent_relative_image_loads` (149ms), and also records
  `/_astro/parent-plate.DsW0-tlD_ZLD56K.svg` generation.
- **Downstream confirmation:** external fixture output/restoration, multi-book
  and default rebuilds, and the final job all succeeded.
- **Report artifact:** `playwright-report` artifact `9196934394`, 198,372 bytes,
  SHA-256 `33969ff82917491896c36ccc69c488aa3be033eb130ee8b3a643188d26e0a9c2`,
  uploaded successfully through `actions/upload-artifact@v7`.
