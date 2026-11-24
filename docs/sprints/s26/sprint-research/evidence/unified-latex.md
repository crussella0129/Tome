We prove a closed form for the first

$n$

whole numbers and note a bound in

$\R^{n}$

.

### Introduction

sec:intro

The sum of the first $n$ whole numbers was known to Gauss gauss. It costs $5 to print this paper, and 50%of it is formulas. We write *emphasis*, **strong words** and code as usual, and a footnoteA note at the foot, with $x^{2}$ in it. too. See Section sec:result for the result and eq:gauss for its statement. More is at <https://example.org/sums> and in [the archive](https://example.org).

### The result

sec:result

thm:gauss For every whole number

$n \ge 1$

,

```math
\begin{equation}\label{eq:gauss}\sum_{i=1}^{n}i = \frac{n(n+1)}{2}.\end{equation}
```

By induction. The case

$n = 1$

is plain. If it holds for

$n$

, then

```math
\begin{align}\sum_{i=1}^{n+1}i&= \frac{n(n+1)}{2}+ (n+1) \\&= \frac{(n+1)(n+2)}{2}. \nonumber\end{align}
```

lem:norm For

$x, y \in \R^{n}$

we have

$\norm{x + y}\le \norm{x}+ \norm{y}$

, and

```math
\tr\begin{pmatrix}a & b \\ c & d\end{pmatrix} = a + d .
```

Theorem thm:gauss and Lemma lem:norm are all we need.

#### Lists and a table

* A first point, with $\alpha \to \beta$.

* A second point:

  1. numbered within;

  2. and again.

Sum what adding gives.\
Product what multiplying gives.

|     |     |        |
| --- | --- | ------ |
| $n$ | sum | square |
|     |     |        |
| 1   | 1   | 1      |
| 2   | 3   | 4      |
| 3   | 6   | 9      |

The first three sums.tab:sums![](figures/triangle.png) A triangle of dots.fig:triangle

Table tab:sums and Figure fig:triangle show the pattern.

> Mathematics is the queen of the sciences.

```

def total(n):
    return n * (n + 1) // 2   # costs $0
```

print(total(100))

appendix

gauss C. F. Gauss, \html-tag:em{\html-attr:className{"emph"}Disquisitiones Arithmeticae}, 1801.
