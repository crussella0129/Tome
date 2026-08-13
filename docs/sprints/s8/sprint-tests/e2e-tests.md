# Sprint 8 End-to-End Tests

- **Tested head:** `38ed51208d14aa3e3421542672054f092671de1d`
- **Task commit:** `4cb83b7`

## External handbook browser proof

The successful serialized external gate ran the two new tests against the
prebuilt handbook at `/first`:

- `test_external_book_renders_in_browser` → **passed**. Chromium proved the
  exact `First Chapter` heading and fixture prose, the exact active TOC link
  with `aria-current="page"` and `/first` href, and zero `Getting Started`
  sample links.
- `test_external_relative_image_loads` → **passed**. Chromium located the
  `A sacred plate` image inside `.tome-prose`, successfully awaited browser
  decode, and proved `complete`, positive `naturalWidth`, and positive computed
  border width.

## Bundled-reader regression

Canonical `npx playwright test` → **8 passed / 0 failed / 8 total** using the
ordinary 8-worker configuration. Its default build-first server path and HTML
reporter remained active.

## `gate_hosted_external_browser`

- **Run:** [GitHub Actions 31733596864](https://github.com/crussella0129/Tome/actions/runs/31733596864)
- **Head:** `38ed51208d14aa3e3421542672054f092671de1d`
- **Job:** `verify` ID `94559750900` completed with **success** in 1m50s.
- **External step:** `External book build gate` completed with **success**. Its
  hosted Linux log names both tests and records
  `test_external_book_renders_in_browser` passed in 227ms,
  `test_external_relative_image_loads` passed in 157ms, and **2 passed** in
  2.0s. The log then records both generated-output cases and the default rebuild.
- **Downstream confirmation:** `Multi-book build gate`, `Upload Playwright
  report`, and the final job all completed successfully. The ordinary report was
  uploaded as artifact `9194257287` (198,363 bytes; SHA-256
  `8ba4e89bdb976c9349918d9ef6cccd56d63e6b20c6ac4227f14e189b40853733`).
