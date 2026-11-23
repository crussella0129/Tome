# INT-0031 — Files that are simple to find

<!-- sprint-loop-intent-v2 -->
- **Intent ID:** INT-0031
- **State:** proposed
- **Work evidence:** none
- **Completion evidence:** none
- **Code evidence:** none
- **Test evidence:** none
- **Documentation evidence:** none

## Intent

Finding a book or a document and putting it in front of the reader is
simple. The owner, on 23 November 2026: "i also want it to be super simple
to find files via the exploerer I still feel like that's covoluded."

"The explorer" is read here as the way books are found and added, which
[INT-0023](INT-0023-find-load-and-deploy-books.md) called the "explorer"
path. Today that is a command in a terminal (`npm run books:find`), a
second command to add what it found (`npm run books:add`), and a rebuild.
The owner finds that convoluted.

## Acceptance criteria

To be settled when a sprint plans it, beginning with what the owner finds
convoluted: finding files on the disk, adding them, or finding a document
once it is in the library.

1. From inside Tome, a person picks a folder or a document and reads it,
   with no terminal and no file to edit.
2. Within the library, a document is found by its name in a few keystrokes.

## Rationale

A place to keep what one has written is only used if putting things into it
costs nothing. INT-0023 made finding and adding possible; it did not make
them simple.

## Alternatives

- **Leave the commands as they are.** The owner asked for better.

## Consequences

- Picking a folder from inside the desktop app is already described by
  [INT-0020](INT-0020-native-library-folder-management.md), which is still
  `proposed` (T-052). This intent is the owner's reason for it, and widens
  it from folders to single documents
  ([INT-0029](INT-0029-documents-as-tomes.md)).
- The browser build cannot pick a folder from the disk, so the simple path
  is the desktop app's.

## Transition history
- 2026-11-23: created as `proposed` in Sprint 24's Research, from the owner's
  words opening the sprint.
