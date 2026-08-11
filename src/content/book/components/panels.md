# Panels & Tables

This is a nested chapter — `components/panels.md` sits under *Sacred Components*
in the summary, and the sidebar shows it indented one level.

## Panels

A fenced code block renders as a bordered sacred panel with a hard drop shadow:

```rust
fn main() {
    // The tome is a machine for reading.
    println!("ink on old paper");
}
```

## Figures

An image renders as a bordered plate. Here is Tome's own pipeline — the summary
becomes a tree becomes the reader:

![Tome pipeline: SUMMARY.md to parseSummary to nav tree to Reader](/images/sacred-diagram.svg)

## Rules and quotes

A block quote is a marginal note, ruled in the accent colour:

> Keep the box-drawing borders in the component; inherit every colour from the
> theme tokens. — the porting rule, paraphrased

A horizontal rule divides sections:

---

That rule above is a `<hr>`, styled as a thin aged line rather than a heavy bar.
