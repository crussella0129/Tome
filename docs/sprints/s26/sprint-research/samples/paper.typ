#set document(title: "A Short Paper on Sums", author: ("A. Writer", "B. Reader"))
#set heading(numbering: "1.")
#set math.equation(numbering: "(1)")

#let norm(x) = $lr(|| #x ||)$
#let RR = $bb(R)$

= A Short Paper on Sums

_A. Writer and B. Reader, November 2026_

We prove a closed form for the first $n$ whole numbers and note a bound in $RR^n$.

== Introduction <sec-intro>

The sum of the first $n$ whole numbers was known to Gauss @gauss.
It costs \$5 to print this paper, and 50% of it is formulas.
We write _emphasis_, *strong words* and `code` as usual,
and a footnote#footnote[A note at the foot, with $x^2$ in it.] too.
See @sec-result for the result and @eq-gauss for its statement.
More is at https://example.org/sums and in #link("https://example.org")[the archive].

== The result <sec-result>

*Theorem (Gauss).* For every whole number $n >= 1$,
$ sum_(i=1)^n i = (n(n+1))/2. $ <eq-gauss>

_Proof._ By induction. The case $n = 1$ is plain. If it holds for $n$, then
$ sum_(i=1)^(n+1) i &= (n(n+1))/2 + (n+1) \
                    &= ((n+1)(n+2))/2. $

*Lemma.* For $x, y in RR^n$ we have $norm(x + y) <= norm(x) + norm(y)$, and
$ tr mat(a, b; c, d) = a + d . $

=== Lists and a table

- A first point, with $alpha -> beta$.
- A second point:
  + numbered within;
  + and again.

/ Sum: what adding gives.
/ Product: what multiplying gives.

#figure(
  table(
    columns: 3,
    [$n$], [sum], [square],
    [1], [1], [1],
    [2], [3], [4],
    [3], [6], [9],
  ),
  caption: [The first three sums.],
) <tab-sums>

#figure(
  image("figures/triangle.png", width: 50%),
  caption: [A triangle of dots.],
) <fig-triangle>

@tab-sums and @fig-triangle show the pattern.

#quote(block: true)[Mathematics is the queen of the sciences.]

```python
def total(n):
    return n * (n + 1) // 2   # costs $0
```

#include "appendix.typ"

#bibliography("refs.yml")
