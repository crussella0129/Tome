# INT-0019 — Centered reader and resilient search geometry

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0019
- **State:** active
- **Work evidence:** [Sprint 20 build plan (T-050–T-051)](../sprints/s20/sprint-plans/build-plan.md)
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Keep Tome's reading surface visually balanced and its search controls usable at
every supported window size. The prose, reader search control, and pager form one
centered reading column inside the space left after navigation and the optional
on-this-page rail. Search should use the available width consistently in the
Bibliotheca and reader, while preserving a usable query field and close target at
narrow browser widths and desktop breakpoint boundaries.

This intent changes layout geometry, not paragraph alignment: prose remains
left-aligned and retains the existing readable maximum measure. It does not change
the sidebar/rail breakpoints or the search behavior and result model.

## Acceptance criteria

1. On reader pages both with and without an on-this-page rail, the search control,
   prose, and pager share a reading column no wider than `--measure`; that column is
   horizontally centered in the available main-content track at wide viewports.
   Opening and closing the mobile navigation does not displace it or introduce
   horizontal overflow.
2. The closed search control fills its host up to its existing maximum width in
   both the Bibliotheca and reader instead of shrink-wrapping to its label. At the
   medium and wide grid-boundary widths it shrinks only to the genuinely available
   content width, keeps its copy on one line, and does not overlap adjacent UI.
3. With search open at the desktop shell minimum and at a 320 CSS-pixel browser
   viewport, the input remains meaningfully usable, the decorative search icon,
   input, and close control do not overlap, and the close target remains at least
   32 by 32 CSS pixels. The dialog and document have no horizontal overflow.
4. Browser regression tests exercise the centered reader geometry (with and
   without the rail), Bibliotheca and reader search hosts, 320/480 narrow sizes,
   and the 768/769 and 1023/1024 breakpoint edges using element geometry—not only
   document-overflow checks.

## Rationale

The reader currently applies a maximum width to prose and the pager without auto
inline margins, so extra width accumulates on the right and the text is pinned to
the content track's left padding. Separately, the search component's root is a
shrink-to-content flex item in the reader even though its trigger is full-width;
the same component fills the Bibliotheca host. Existing scaling tests prove only
that nothing overflows or clips, so both visually compressed states can pass.

## Alternatives

- Center only `.tome-prose` and `.pager` with duplicate margin rules. Rejected:
  the reader search control would remain on a different alignment axis and future
  reading-surface elements could drift again.
- Reduce or delay the sidebar and rail breakpoints. Rejected for this slice: the
  grid modes are already intentional and tested; the controls should respond to
  the actual track width.
- Shrink the search close control to preserve input width. Rejected: the close
  target is interactive and should not absorb compression before decorative UI.

## Consequences

- `BookLayout` gains a small reading-column wrapper around the existing search and
  slotted chapter content; prose and pager keep their present maximum measure.
- Search's reusable root owns its width contract. A narrow-dialog rule may reduce
  spacing or hide the decorative icon before the input becomes unusable.
- Geometry assertions become part of the responsive E2E contract, including the
  abrupt but valid content-width changes at grid breakpoints.

## Transition history

- 2026-08-20: created as `proposed` during Sprint 20 research after reproducing
  the off-center reader stack and the reader search trigger's shrink-to-content
  geometry.
- 2026-08-20: `proposed → planned` — Sprint 20 schedules T-050 to center the
  full reader stack and T-051 to normalize narrow search geometry, with explicit
  element-geometry E2E coverage for all four acceptance criteria.
- 2026-08-20: `planned → active` — Sprint 20 Build Phase began with T-050,
  keeping the locked reader/search geometry and test thresholds unchanged.
