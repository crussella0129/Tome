# INT-0027 — Cruor as Tome's typefaces

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0027
- **State:** proposed
- **Work evidence:** none
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Tome sets its text in Cruor, the owner's own typeface family, in place of
Mekzantine. The owner, on 21 November 2026: "we are going to add Cruor Lite
as the default for the title with perhaps cruor sans as the text, and then
for sanguine atonement theme it's cruor thornamented for the titles and cruor
lite for the body text."

| theme | titles | body text |
|---|---|---|
| the default themes (Light and Dark) | Cruor Lite | Cruor Sans ("perhaps") |
| Sanguine Atonement ([INT-0022](INT-0022-sanguine-atonement-theme.md)) | Cruor Thornamental | Cruor Lite |

On 23 November 2026 the owner named a second choice for the default themes:
"(or perhaps Curor Sans across the board with bolded titles)". So the
default themes are one of:

- titles in Cruor Lite, body text in Cruor Sans; or
- Cruor Sans throughout, with titles in its Bold.

The owner chooses between them by eye, from the two set side by side.
Sanguine Atonement's pairing is not in question.

The proportional families (Cruor Sans Regular, Cruor Lite Regular, Cruor
Thornamental Regular) suit titles and body text; the Mono families stay for
code.

## Acceptance criteria

To be settled when a sprint plans it. The owner's words set the outline:

1. The default themes set titles in Cruor Lite and body text in Cruor Sans,
   or Cruor Sans throughout with bold titles, as the owner chooses from a
   side-by-side.
2. Sanguine Atonement sets titles in Cruor Thornamental and body text in
   Cruor Lite.
3. Mekzantine is no longer what Tome sets its text in.
4. The fonts come from the Cruor project's build; the accented letters,
   Greek and mathematical symbols of Cruor's Sprint 5 show in Tome as soon
   as that build is taken in.

## Rationale

Cruor was made for this: its intent names Tome as a destination, replacing
Mekzantine. "Cruor Sans" for body text is the owner's "perhaps", to be
confirmed by eye.

## Alternatives

- Keep Mekzantine. The owner chose Cruor.

## Consequences

- Each theme names its fonts by role (titles, body, code), which themes as
  configuration files ([INT-0028](INT-0028-themes-as-configuration.md))
  then carry.
- Tome takes Cruor's built fonts from the Cruor project; the two move in
  tandem.

## Transition history
- 2026-11-21: created as `proposed` from the owner's words in the Cruor
  project's Sprint 5 Research ("make sure to add all of that to Tome
  specifically as this will all move in tandem").
- 2026-11-23: revised in Sprint 24's Research, still `proposed`. Added the
  owner's second choice for the default themes (Cruor Sans throughout with
  bold titles).
