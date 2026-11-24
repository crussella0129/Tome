# A Short Paper on Sums

*A. Writer and B. Reader, November 2026*

We prove a closed form for the first $n$ whole numbers and note a bound in $\mathbb{R}^{n}$.

## Introduction

<span id="sec-intro"></span>

The sum of the first $n$ whole numbers was known to Gauss \[gauss\]. It costs \$5 to print this paper, and 50% of it is formulas. We write *emphasis*, **strong words** and `code` as usual, and a footnote[^1] too. See <a href="#sec-result" class="ref">[sec-result]</a> for the result and <a href="#eq-gauss" class="ref">[eq-gauss]</a> for its statement. More is at <https://example.org/sums> and in [the archive](https://example.org).

## The result

<span id="sec-result"></span>

**Theorem (Gauss).** For every whole number $n \geq 1$, $$\sum_{i = 1}^{n}i = \frac{n(n + 1)}{2.}$$ <span id="eq-gauss"></span>

*Proof.* By induction. The case $n = 1$ is plain. If it holds for $n$, then $$\begin{aligned}
\sum_{i = 1}^{n + 1}i & = \frac{n(n + 1)}{2} + (n + 1) \\
 & = \frac{(n + 1)(n + 2)}{2.}
\end{aligned}$$

**Lemma.** For $x,y \in \mathbb{R}^{n}$ we have $\left\| x + y \right\| \leq \left\| x \right\| + \left\| y \right\|$, and $$\operatorname{tr}\begin{pmatrix}
a & b \\
c & d
\end{pmatrix} = a + d.$$

### Lists and a table

- A first point, with $\alpha \rightarrow \beta$.

- A second point:

  1.  numbered within;

  2.  and again.

Sum  
what adding gives.

Product  
what multiplying gives.

|     |     |        |
|-----|-----|--------|
| $n$ | sum | square |
| 1   | 1   | 1      |
| 2   | 3   | 4      |
| 3   | 6   | 9      |

The first three sums.

<span id="tab-sums"></span>

<figure>
<p><img src="figures/triangle.png" style="width:50.0%" /></p>
<figcaption><p>A triangle of dots.</p></figcaption>
</figure>

<span id="fig-triangle"></span>

<a href="#tab-sums" class="ref">[tab-sums]</a> and <a href="#fig-triangle" class="ref">[fig-triangle]</a> show the pattern.

> Mathematics is the queen of the sciences.

``` python
def total(n):
    return n * (n + 1) // 2   # costs $0
```

## Appendix

<span id="sec-appendix"></span>

This section is read from a second file. It holds one more formula, $\int_{0}^{1}xdx = \frac{1}{2}$, and a case split: $$|x| = \begin{cases}
x & \text{ if }x \geq 0 \\
 - x & \text{ otherwise.}
\end{cases}$$

# References

<div id="refs">

</div>

[^1]: A note at the foot, with $x^{2}$ in it.
