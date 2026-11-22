# INT-0028 — Themes as configuration files

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0028
- **State:** proposed
- **Work evidence:** none
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

A Tome theme is a configuration file the owner can write and change, and
designing a new one is easy. The owner, on 21 November 2026: "Designing
'themes' in tome should be easy though, like configuring a TOML config (or a
dotfile in hyprland)."

A theme file names, by role, the fonts (titles, body, code), the colours, and
the theme's other choices. Tome's own themes, Light, Dark and Sanguine
Atonement, are written in the same form.

## Acceptance criteria

To be settled when a sprint plans it. The owner's words set the outline:

1. A theme is a TOML file; Tome reads the themes it finds and offers them.
2. Light, Dark and Sanguine Atonement are themselves TOML files, and look
   as they do now.
3. A new theme is made by writing a new file, with no change to Tome's code.

## Rationale

The owner configures their own tools in files (TOML, Hyprland dotfiles), and
asked for themes to work the same way. Tome's themes are already expressed
as `--theme-*` custom properties ([INT-0001](INT-0001-tome-ink-on-paper-mdbook-viewer.md)),
so a file that sets them by role is a short step.

## Alternatives

- Themes in code, as now. The owner asked for files.

## Consequences

- Which of Sanguine Atonement's ornaments (the briar, the inscription, the
  rite that unlocks it) a file can describe, and which stay in code, is for
  the sprint that plans it.
- The fonts each theme names by role are Cruor's
  ([INT-0027](INT-0027-cruor-typefaces.md)).

## Transition history
- 2026-11-21: created as `proposed` from the owner's words in the Cruor
  project's Sprint 5 Research ("make sure to add all of that to Tome
  specifically as this will all move in tandem").
