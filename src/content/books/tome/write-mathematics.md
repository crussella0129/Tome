# Write Mathematics

Tome lays out mathematics written in LaTeX notation. You write a formula
between dollar signs in any chapter, a note or a paper, and the page shows the
equation. It is laid out when the library is built, so the page needs no
script and nothing from the network.

## Within a line, and set apart

One dollar sign each side puts a formula within its line:

```text
The area is $\pi r^2$ and the circumference $2\pi r$.
```

The area is $\pi r^2$ and the circumference $2\pi r$.

Two dollar signs on lines of their own set a formula apart:

```text
$$
e^{i\pi} + 1 = 0
$$
```

$$
e^{i\pi} + 1 = 0
$$

A line that holds `$$` and nothing else opens a formula, and the next such
line closes it. Everything between is the formula, however its lines begin. A
short one can be written on one line, `$$x = y$$`, if that line holds nothing
else. A code block in the language `math` is set apart too, as it is on
GitHub:

````text
```math
a^2 + b^2 = c^2
```
````

```math
a^2 + b^2 = c^2
```

## What you can write

A fraction and a root:

```text
$$
\frac{a + b}{c} \qquad \sqrt{x^2 + 1} \qquad \sqrt[3]{8}
$$
```

$$
\frac{a + b}{c} \qquad \sqrt{x^2 + 1} \qquad \sqrt[3]{8}
$$

A sum with its limits, and a matrix:

```text
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
\qquad
\begin{pmatrix} a & b \\ c & d \end{pmatrix}
$$
```

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
\qquad
\begin{pmatrix} a & b \\ c & d \end{pmatrix}
$$

A derivation, its lines set under one another at the `&`:

```text
$$
\begin{align}
(a + b)^2 &= (a + b)(a + b) \\
          &= a^2 + 2ab + b^2
\end{align}
$$
```

$$
\begin{align}
(a + b)^2 &= (a + b)(a + b) \\
          &= a^2 + 2ab + b^2
\end{align}
$$

An equation with a number:

```text
$$
\begin{equation}
\label{eq:energy}
E = mc^2
\end{equation}
$$
```

$$
\begin{equation}
\label{eq:energy}
E = mc^2
\end{equation}
$$

Numbers count from one down each page, and stand at the right edge. `align`
numbers every line, `equation` its one; `align*` and `equation*` number none.
`\tag{A}` at the end of a line gives it the label you choose in place of a
number.

## Refer to an equation by its number

Give the equation a name with `\label`, and link to that name. The link shows
the equation's number and leads to it:

```text
$$
\begin{equation}
\label{eq:gauss}
1 + 2 + \dots + n = \frac{n(n+1)}{2}
\end{equation}
$$

Gauss is said to have found [](#eq:gauss) as a schoolboy.
```

Leave the link's words empty, or make them the name itself, as in
`[eq:gauss](#eq:gauss)`: the page writes the number in, in brackets. Inside a
pair of brackets it writes the number alone, so the brackets are not doubled.
A link with words of your own is left as you wrote it.

The numbered equation above is named `eq:energy` in this chapter's source, so
this sentence can refer to it as equation ([](#eq:energy)).

## Prices keep their dollar signs

A pair of dollar signs is a formula only when it looks like one: nothing but
the formula between them, no space just inside either sign, and no digit after
the closing one. So this line is left as you wrote it:

It costs $5 on Monday and $10 by Friday.

When a dollar sign must not start a formula, write `\$`. And put names such as
`$HOME` or `$B$2` in code, as here: two of them in one sentence, outside code,
would be read as a formula.

## In a table

In a table a `|` ends the cell, even inside a formula. Write `\vert` for it:

```text
| Name | Formula          |
|------|------------------|
| Norm | $\vert x \vert$  |
```

| Name | Formula          |
|------|------------------|
| Norm | $\vert x \vert$  |

## What to know

- Close what you open. A `$$` line with no later `$$` line takes the rest of
  the chapter, as an unclosed code block does. A formula of several lines is
  safest between `$$` lines of their own.
- Each formula is read on its own. A command you define in one, with `\def` or
  `\newcommand`, is not known in the next.
- A formula that cannot be read is shown as you typed it, underlined, and the
  build prints a line naming the chapter. A missing brace is the usual cause,
  as in `\frac{a}{`. The build goes on.
- Inside a formula `%` begins a comment, as it does in LaTeX, and the rest of
  the line is not shown. Write `\%` for a percent sign: `$5\%$` gives $5\%$.
- `\ref` and `\eqref` inside a formula are not read. Refer to an equation with
  a link, as above.
- A link or a picture cannot be put inside a formula.
- The form mdBook itself uses for mathematics, `\\(` and `\\)`, is not laid
  out. Write dollar signs.

In a sidebar, a tab or a search result, which are plain text, a formula in a
heading is written on one line: a heading with `$E = mc^2$` in it is listed as
`E = mc²`. Search finds a formula by what it shows, so `mc2` finds that
heading, and by the names of its symbols, so `alpha` finds `$\alpha$`.

## Equations in a Word document

A Word document's equations are carried over as LaTeX notation and laid out
the same way. [Find Your Books](find-your-books.md) says what else a Word
document keeps, and how a paper written in LaTeX or Typst is read.
