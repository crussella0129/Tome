# A Campaign of Tablets

This recipe turns Tome into a stack of handouts that unseal as your players find
them. It suits inscriptions, letters, journals, and prophecies.

## Lay out the book

```text
tablets/
├── book.toml
└── src/
    ├── SUMMARY.md
    ├── i-the-vessel.md
    ├── ii-the-channel.md
    └── iii-the-atonement.md
```

```toml
# book.toml
[book]
title = "The Obsidian Tablets"
```

## Seal what hasn't been found

In `SUMMARY.md`, an entry with an empty link is a *draft*. It appears in the
sidebar but has no page and no search result:

```markdown
# The Obsidian Tablets

- [I · The Vessel](i-the-vessel.md)
- [II · The Channel]()
- [III · The Atonement]()
```

Players see three tablets and can read only the first. The others are marked
*(draft)*, or *(sealed)* in the right theme.

## Unseal when it's found

When the party finds the second tablet, give its entry a link:

```markdown
- [II · The Channel](ii-the-channel.md)
```

If you are serving live (`TOME_BOOK=… npm run dev -- --host`, see *Take It to
the Table*), it is readable on the tablet within about a second. Otherwise, run
`npm run build` and reload.

> [!WARNING]
> Sealing hides a chapter from the reader, its routes, and its search. It is not
> a lock. In development mode, the files in the book folder can still be
> requested from the laptop by someone who knows how. For text that must stay
> secret, keep the file *outside* the book until it is found, or serve a static
> build.

## Read them in blood

At the foot of the sidebar, or of the Bibliotheca, choose **Other…**. A door
will ask you a question. If you ever sought the Dark Brotherhood in Cheydinhal,
you already know the answer.

Answer well and the tablets are re-carved for the night. Sealed entries read
*(sealed)*, chapter text becomes large inscriptions in arterial crimson, and the
stone is obsidian. It suits a dim room. **Light** or **Dark** brings back the
daylight.
