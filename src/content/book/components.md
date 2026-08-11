# Sacred Components

Tome's surface is a small, ported subset of the
[sacred computer](https://github.com/internet-development/www-sacred) library,
re-expressed for Astro + SolidJS and re-skinned onto paper. The originals are
React + CSS Modules; Tome keeps the *look* and the token contract, not the code.

The pieces in play so far:

- **Sidebar** — the persistent table of contents, parsed from `SUMMARY.md`.
- **Prose** — sacred treatment of rendered Markdown: headings, code, quotes.
- **Pager** — the prev / next chapter controls at the foot of each page.

Every one of them reads its colour from a `--theme-*` token, so switching from
**ink on old paper** to the **warm terminal** theme repaints the entire book
without touching a single component.

## Themes at a glance

| Token                 | Ink on paper | Terminal (dark) |
| --------------------- | ------------ | --------------- |
| `--theme-background`  | parchment    | warm near-black |
| `--theme-text`        | sepia ink    | warm parchment  |
| `--theme-focused-*`   | rubric red   | amber phosphor  |

Try the theme switch at the bottom of the sidebar.
