# Getting Started

Tome reads a book directory and turns it into a reader. The three pieces it
cares about:

1. `book.toml` — the book's metadata (optional for the viewer).
2. `src/SUMMARY.md` — the table of contents. This is the spine.
3. The chapter Markdown files linked from the summary.

## The summary is the spine

A `SUMMARY.md` is an ordinary nested list of links. Tome parses it into a tree,
preserving prefix chapters, part titles, nesting, drafts, and separators:

```markdown
# Summary

[Introduction](README.md)

# Guide

- [Getting Started](getting-started.md)
- [Sacred Components](components.md)
  - [Panels & Tables](components/panels.md)
```

## Running the parser

The parser is a pure function — no DOM, no I/O — so it is trivial to test:

```ts
import { parseSummary } from '../lib/summary';

const toc = parseSummary(summaryMarkdown);
console.log(toc.nodes.length);
```

Give it a `SUMMARY.md` string and it hands back the navigation model the sidebar
renders. That is the whole contract.
