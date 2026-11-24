# Introduction

The sum of the first $n$ whole numbers was known to Gauss . It costs \$5 to print this paper, and 50% of it is formulas. We write *emphasis*, **strong words** and `code` as usual, and a footnote[^1] too. See Section <a href="#sec:result" data-reference-type="ref" data-reference="sec:result">2</a> for the result and <a href="#eq:gauss" data-reference-type="eqref" data-reference="eq:gauss">[eq:gauss]</a> for its statement. More is at <https://example.org/sums> and in [the archive](https://example.org).

# The result

<div id="thm:gauss" class="theorem">

**Theorem 1** (Gauss). *For every whole number $n \ge 1$, $$\begin{equation}
\label{eq:gauss}
  \sum_{i=1}^{n} i = \frac{n(n+1)}{2}.
\end{equation}$$*

</div>

<div class="proof">

*Proof.* By induction. The case $n = 1$ is plain. If it holds for $n$, then $$\begin{align}
  \sum_{i=1}^{n+1} i &= \frac{n(n+1)}{2} + (n+1) \\
                     &= \frac{(n+1)(n+2)}{2}. \nonumber
\end{align}$$ ◻

</div>

<div id="lem:norm" class="lemma">

**Lemma 2**. *For $x, y \in \mathbb{R}^n$ we have $\left\lVert x + y \right\rVert \le \left\lVert x \right\rVert + \left\lVert y \right\rVert$, and $$\mathop{\mathrm{tr}}\begin{pmatrix} a & b \\ c & d \end{pmatrix} = a + d .$$*

</div>

Theorem <a href="#thm:gauss" data-reference-type="ref" data-reference="thm:gauss">1</a> and Lemma <a href="#lem:norm" data-reference-type="ref" data-reference="lem:norm">2</a> are all we need.

## Lists and a table

- A first point, with $\alpha \to \beta$.

- A second point:

  1.  numbered within;

  2.  and again.

Sum  
what adding gives.

Product  
what multiplying gives.

| $n$ | sum | square |
|:----|----:|-------:|
| 1   |   1 |      1 |
| 2   |   3 |      4 |
| 3   |   6 |      9 |

The first three sums. {#tab:sums}

<figure id="fig:triangle" data-latex-placement="h">
<img src="figures/triangle.png" style="width:50.0%" />
<figcaption>A triangle of dots.</figcaption>
</figure>

Table <a href="#tab:sums" data-reference-type="ref" data-reference="tab:sums">1</a> and Figure <a href="#fig:triangle" data-reference-type="ref" data-reference="fig:triangle">1</a> show the pattern.

> Mathematics is the queen of the sciences.

    def total(n):
        return n * (n + 1) // 2   # costs $0

``` python
print(total(100))
```

# Appendix

This section is read from a second file. It holds one more formula, $\int_0^1 x\,dx = \tfrac12$, and a case split: $$|x| = \begin{cases} x & \text{if } x \ge 0, \\ -x & \text{otherwise.} \end{cases}$$

<div class="thebibliography">

9 C. F. Gauss, *Disquisitiones Arithmeticae*, 1801.

</div>

[^1]: A note at the foot, with $x^2$ in it.
