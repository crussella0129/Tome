# Sprint 25 research trial: laying out mathematics

A trial run outside the repository, on 23 November 2026. Nothing here is
Tome's code yet. It records what was tried, what was measured, and what each
finding asks of the build. Captures are in [`evidence/`](evidence/).

## 1. The sample

One Markdown page holding what INT-0030 asks for: two formulas within a
line; a fraction, a root, a sum with limits and a matrix; an aligned
derivation (`align`); a numbered equation (`equation`); `cases`; a line
about money ("It costs $5 and then $10 for two things."); a formula with a
mistake in it (`$\frac{a}{$`); inline code holding `$x$`; and a code block
holding `'$5'`.

Every engine was run when the page was built, through `remark-math` and one
rehype step, so the page a reader loads carries no script.

## 2. Three engines on the sample

| | KaTeX | MathJax (drawn shapes) | MathML written by Temml |
|---|---|---|---|
| Versions tried | katex 0.16 (inside rehype-katex 7.0.1) and 0.19.1 | mathjax-full 3.2.1 (rehype-mathjax) | temml 0.14.0 |
| Licence | MIT | Apache-2.0 | MIT |
| HTML for the sample | 21.7 KB | 45.7 KB | 4.5 KB |
| Also shipped | a 25 KB stylesheet and its own fonts (about 300 KB as WOFF2) | nothing | a mathematical font (STIX Two Math, OFL, about 400 KB as WOFF2) and a short stylesheet |
| Follows the theme's colour | yes | yes | yes |
| Can be set in another mathematical font | no | no | yes: it uses whatever font with a MATH table it is given |
| Text of a formula can be selected | yes | no | yes |
| Same in every browser engine | yes, by construction | yes, by construction | no: each engine lays it out itself |
| A formula with a mistake | the source in red | the source in a yellow box | an error is thrown; Tome decides what to show |
| Equation numbers | by a stylesheet counter; rehype-katex's copy shows (1) for every equation until the page resets the counter | by the engine, when asked for (`tags: 'ams'`) | by a stylesheet counter (see section 4) |

Captures of all three side by side, in two browser engines and on two
grounds:

- [`evidence/compare-chromium-paper.png`](evidence/compare-chromium-paper.png)
- [`evidence/compare-webkit-paper.png`](evidence/compare-webkit-paper.png)
- [`evidence/compare-chromium-sanguine.png`](evidence/compare-chromium-sanguine.png)
- [`evidence/compare-webkit-sanguine.png`](evidence/compare-webkit-sanguine.png)

In those captures the MathML column already carries the corrections of
section 4.

Without any mathematical font (the page's text font only), MathML still
shows every formula, but brackets and roots do not stretch to their
contents. The font's MATH table is what drives the layout. That is the
reason a bundled font is needed, and the reason this route can later take
Cruor.

## 3. Sums of money

`remark-math`'s rule for a single dollar sign pairs the first with the
next, whatever stands between. On the sample every engine therefore set
"5 and then " as a formula.

A stricter rule was written as a small addition to the Markdown reader,
placed ahead of `remark-math`. At a single `$` it looks ahead to the `$`
that would be paired with it. The pair is a formula only if no space
follows the opening sign, no space stands before the closing sign, and no
digit follows the closing sign (the rule pandoc uses). Otherwise the sign
is left as text and reading goes on, so a real formula later in the same
line is still found.

```js
const DOLLAR = 36;
const isSpace = (code) => code === null || code < 0 || code === 32;
const isDigit = (code) => code !== null && code >= 48 && code <= 57;

/** Succeeds when the `$` here would open a formula. */
function tokenizePairing(effects, ok, nok) {
  let previous = null;
  const done = (next) => (code) => (effects.exit('moneyProbe'), next(code));
  const inside = (code) => {
    if (code === null) return done(ok)(code); // unpaired: left as text anyway
    if (code === DOLLAR) {
      if (isSpace(previous)) return done(nok)(code);
      effects.consume(code);
      return afterCloser;
    }
    previous = code;
    effects.consume(code);
    return inside;
  };
  const afterCloser = (code) => {
    if (code === DOLLAR) {
      previous = code; // a `$$` run does not close a single `$`
      effects.consume(code);
      return inside;
    }
    return done(isDigit(code) ? nok : ok)(code);
  };
  return (code) => {
    effects.enter('moneyProbe');
    effects.consume(code);
    return (next) =>
      next === DOLLAR ? done(ok)(next) : isSpace(next) ? done(nok)(next) : inside(next);
  };
}

function remarkMoneyDollars() {
  (this.data().micromarkExtensions ??= []).push({
    text: {
      [DOLLAR]: {
        name: 'moneyDollar',
        tokenize(effects, ok, nok) {
          const literal = (code) => (
            effects.enter('data'), effects.consume(code), effects.exit('data'), ok
          );
          return (code) =>
            effects.check({ tokenize: tokenizePairing, partial: true }, nok, literal)(code);
        },
      },
    },
  });
}
```

What each rule found, line by line:

| Line | `remark-math` alone | with the rule |
|---|---|---|
| `It costs $5 and then $10 for two things.` | `5 and then ` | no formula |
| `It costs $5 and $x$ is a number.` | `5 and ` | `x` |
| `$2x+1$ and $a$ are both formulas.` | `2x+1`, `a` | `2x+1`, `a` |
| `Price $5, formula $x^2$, price $7.` | `5, formula `, `, price ` | `x^2` |
| `Between $5 and$10 nothing.` | `5 and` | no formula |
| `Just $5$ alone.` | `5` | `5` |
| `A $ b $ c.` | `b` | no formula |
| `` Code `$x$` stays code. `` | no formula | no formula |
| a formula over two lines | found | found |
| `Double $$x$$ inline.` | `x` | `x` |
| `Escaped \$5 and \$10 here, then $y$.` | `y` | `y` |
| `Paid $5.00 (was $7.50); so $d = 2.5$.` | `5.00 (was `, `d = 2.5` | `d = 2.5` |
| `USD$5 and CAD$6.` | `5 and CAD` | no formula |
| `**bold $5 and $x$ here** and $z$.` | `5 and `, `here** and` | `x`, `z` |
| `Ends with a price of $5` | no formula | no formula |

A formula set apart with `$$` on its own lines is untouched by the rule.
Tome's bundled books hold a dollar sign only inside code today.

## 4. Safari's engine (WebKit)

Tome's Linux and macOS desktop builds, and every browser on an iPhone or
iPad, lay pages out with WebKit. Chromium 151 and WebKit 26.5 were both
tried; Firefox was not (its browser for the test runner is not installed).

With the bundled font, Chromium laid out every construct correctly as Temml
wrote it. WebKit showed three faults, each traced to one cause:

| What was seen in WebKit | Cause | Correction, tested |
|---|---|---|
| The aligned derivation and the numbered equation were blank | Temml's option to keep the LaTeX source inside the formula (`annotate`) wraps the formula; WebKit does not paint a table of formulas inside that wrapper | leave the option off; keep the source elsewhere if it is wanted |
| Equation numbers stood hard against their equation, not at the right | WebKit gives a formula table a percent width of nothing whenever the formula is inside a grid or flex item, and Tome's reader is a grid | put each set-apart formula in a wrapper that is a size container, and give the table its width in container units (`100cqi`) |
| Every equation numbered (1) | the wrapper above starts a stylesheet counter afresh | write the numbers into the page when it is built, counted down the page |

Writing the numbers at build time also makes it possible to refer to an
equation by number later, which no engine here does on its own.

Measured, for one numbered equation: the gap between the formula and its
number was 179 px in a plain block in both engines; inside a grid item it
was 75 px in Chromium and 1 px in WebKit; with the wrapper and container
units it was 75 px in both.

Nine constructs (`align`, `align*`, `aligned`, `equation`, `equation*`,
`\tag`, `gather`, `cases`, `pmatrix`) were laid out in both engines with
the annotation off; all nine showed in both.

These corrections are Tome's to keep. A gate that lays the sample out in
WebKit as well as Chromium is the only way to know they still hold.

## 5. Equations in a Word document

Word stores an equation in its own markup, which Sprint 24's converter
replaces by `[equation not shown]`. Two existing packages were chained:
`omml2mathml` 1.3.0 (Apache-2.0, last published in 2022) turns that markup
into MathML, and `mathml-to-latex` 1.8.0 (MIT) turns MathML into LaTeX.

| Word equation | LaTeX from the chain | Right? |
|---|---|---|
| fraction | `\frac{a + b}{c}` | yes |
| root | `\sqrt{x}` | yes |
| cube root | `\sqrt[3]{x}` | yes |
| sum with limits | `\sum_{i = 1}^{n} i` | yes |
| integral | `\int_{0}^{\infty} f \left(x\right) d x` | yes |
| matrix in round brackets | `\begin{bmatrix} a & b \\ c & d \end{bmatrix}` | no: square brackets |
| subscript and superscript | `x_{i}^{2}` | yes |
| accent | `\hat{x}` | yes |
| aligned lines | `\begin{matrix} a = b \\ = c\end{matrix}` | no: the alignment is lost |
| named function | `\mathit{sin} \theta` | no: should be `\sin` |
| Greek and relations | `\alpha + \beta \leq \gamma` | yes |
| bar | `\bar{x}` | yes |
| limit | `\underset{n \rightarrow \infty}{\mathit{lim}} a` | no: should be `\lim_{n \to \infty}` |

Capture: [`evidence/word-equations-chromium.png`](evidence/word-equations-chromium.png)
(the Word equation, straight to MathML, as LaTeX, and that LaTeX laid out).

The MathML that `omml2mathml` writes also uses elements today's browsers no
longer lay out (`mfenced`, alignment marks), so it could not be shown as it
is either.

Word's equation markup has about thirty elements, each a plain structure (a
fraction holds a numerator and a denominator). Temml and KaTeX both accept
the symbols themselves (`α`, `≤`, `∑`, `∞`, `→`) with no command needed;
that was checked. A converter of Tome's own, from Word's markup straight to
LaTeX, is therefore a table of about thirty rules, and each wrong row above
becomes one rule with a test. An element it does not know leaves the
existing `[equation not shown]` mark and is counted in the build's report.

## 6. What this asks of the build

1. `remark-math`, the money rule, and one rehype step that lays each
   formula out when the page is built.
2. A bundled mathematical font, taken from `npm`, not committed.
3. Equation numbers written at build time.
4. A formula that cannot be read: shown as typed, in a marked style, and
   named in the build's output.
5. Search: a formula's source is in the chapter's Markdown, which the
   search index reads; what it should make of `$\frac{a}{b}$` is to be
   decided.
6. A gate that builds a page of formulas and checks it in Chromium and in
   WebKit.
7. A converter from Word's equation markup to LaTeX, in place of the mark.
