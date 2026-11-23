import { describe, it, expect } from 'vitest';
import { ommlToLatex } from '../../../scripts/omml-to-latex.mjs';
import { formulaText, readable } from '../../../scripts/rehype-math.mjs';

// A Word equation becomes LaTeX notation (INT-0030, T-082). Each equation here
// is written in Word's own markup, Office Math, as it stands in a document.

const R = String.raw;
const math = (inner: string) => `<m:oMath>${inner}</m:oMath>`;
const r = (text: string, properties = '') => `<m:r>${properties}<m:t>${text}</m:t></m:r>`;
const UPRIGHT = '<m:rPr><m:sty m:val="p"/></m:rPr>';
const PLAIN_WORDS = '<m:rPr><m:nor/></m:rPr>';
const brackets = (open: string, close: string, inner: string) =>
  `<m:d><m:dPr><m:begChr m:val="${open}"/><m:endChr m:val="${close}"/></m:dPr><m:e>${inner}</m:e></m:d>`;
const MATRIX =
  `<m:m><m:mr><m:e>${r('a')}</m:e><m:e>${r('b')}</m:e></m:mr>` +
  `<m:mr><m:e>${r('c')}</m:e><m:e>${r('d')}</m:e></m:mr></m:m>`;
const accent = (mark: string) =>
  `<m:acc><m:accPr><m:chr m:val="${mark}"/></m:accPr><m:e>${r('x')}</m:e></m:acc>`;
const run = (style: string) => r('v', `<m:rPr>${style}</m:rPr>`);

/** The LaTeX for an equation, checked as the Word reader checks it. */
const latex = (inner: string) => ommlToLatex(math(inner), { readable });

describe('omml-to-latex.mjs — one rule for each element', () => {
  // T-082 clause 1
  it('test_omml_rules: each element of a Word equation has its LaTeX', () => {
    const cases: [string, string, string][] = [
      [
        'fraction',
        `<m:f><m:num>${r('a+b')}</m:num><m:den>${r('c')}</m:den></m:f>`,
        R`\frac{a+b}{c}`,
      ],
      [
        'slanted fraction',
        `<m:f><m:fPr><m:type m:val="skw"/></m:fPr><m:num>${r('a')}</m:num><m:den>${r('b')}</m:den></m:f>`,
        '{a}/{b}',
      ],
      [
        'fraction with no bar',
        `<m:f><m:fPr><m:type m:val="noBar"/></m:fPr><m:num>${r('n')}</m:num><m:den>${r('k')}</m:den></m:f>`,
        R`\genfrac{}{}{0pt}{}{n}{k}`,
      ],
      [
        'root',
        `<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>${r('x')}</m:e></m:rad>`,
        R`\sqrt{x}`,
      ],
      [
        'root with a degree',
        `<m:rad><m:deg>${r('3')}</m:deg><m:e>${r('x+1')}</m:e></m:rad>`,
        R`\sqrt[3]{x+1}`,
      ],
      [
        'sum with limits',
        `<m:nary><m:naryPr><m:chr m:val="∑"/><m:limLoc m:val="undOvr"/></m:naryPr><m:sub>${r('i=1')}</m:sub><m:sup>${r('n')}</m:sup><m:e>${r('i')}</m:e></m:nary>`,
        R`∑\limits_{i=1}^{n} i`,
      ],
      [
        'product with its upper limit hidden',
        `<m:nary><m:naryPr><m:chr m:val="∏"/><m:supHide m:val="1"/></m:naryPr><m:sub>${r('k')}</m:sub><m:sup>${r('n')}</m:sup><m:e>${r('k')}</m:e></m:nary>`,
        '∏_{k} k',
      ],
      [
        'integral, its sign not named',
        `<m:nary><m:naryPr><m:limLoc m:val="subSup"/></m:naryPr><m:sub>${r('0')}</m:sub><m:sup>${r('∞')}</m:sup><m:e>${r('f(x)dx')}</m:e></m:nary>`,
        R`∫\nolimits_{0}^{∞} f(x)dx`,
      ],
      [
        'superscript',
        `${r('E=m')}<m:sSup><m:e>${r('c')}</m:e><m:sup>${r('2')}</m:sup></m:sSup>`,
        'E=mc^{2}',
      ],
      ['subscript', `<m:sSub><m:e>${r('x')}</m:e><m:sub>${r('i')}</m:sub></m:sSub>`, 'x_{i}'],
      [
        'both',
        `<m:sSubSup><m:e>${r('x')}</m:e><m:sub>${r('i')}</m:sub><m:sup>${r('2')}</m:sup></m:sSubSup>`,
        'x_{i}^{2}',
      ],
      [
        'a base of several characters',
        `<m:sSup><m:e>${r('a+b')}</m:e><m:sup>${r('2')}</m:sup></m:sSup>`,
        '{a+b}^{2}',
      ],
      [
        'pre-script',
        `<m:sPre><m:sub>${r('6')}</m:sub><m:sup>${r('14')}</m:sup><m:e>${r('C')}</m:e></m:sPre>`,
        '{}_{6}^{14}C',
      ],
      ['round brackets', brackets('(', ')', r('a+b')), R`\left( a+b \right)`],
      ['square brackets', brackets('[', ']', r('a')), R`\left[ a \right]`],
      ['curly brackets', brackets('{', '}', r('a')), R`\left\{ a \right\}`],
      ['bars', brackets('|', '|', r('x')), R`\left\vert x \right\vert`],
      ['brackets with none named', `<m:d><m:e>${r('a')}</m:e></m:d>`, R`\left( a \right)`],
      ['a bracket with one side empty', brackets('{', '', r('a')), R`\left\{ a \right.`],
      [
        'matrix in round brackets',
        brackets('(', ')', MATRIX),
        R`\begin{pmatrix} a & b \\ c & d \end{pmatrix}`,
      ],
      [
        'matrix in square brackets',
        brackets('[', ']', MATRIX),
        R`\begin{bmatrix} a & b \\ c & d \end{bmatrix}`,
      ],
      [
        'matrix in curly brackets',
        brackets('{', '}', MATRIX),
        R`\begin{Bmatrix} a & b \\ c & d \end{Bmatrix}`,
      ],
      [
        'matrix in bars',
        brackets('|', '|', MATRIX),
        R`\begin{vmatrix} a & b \\ c & d \end{vmatrix}`,
      ],
      ['matrix in none', MATRIX, R`\begin{matrix} a & b \\ c & d \end{matrix}`],
      [
        'cases',
        brackets(
          '{',
          '',
          `<m:eqArr><m:e>${r('1&amp;x&gt;0')}</m:e><m:e>${r('0&amp;')}${r('otherwise', PLAIN_WORDS)}</m:e></m:eqArr>`,
        ),
        R`\begin{cases} 1&x>0 \\ 0&\text{otherwise} \end{cases}`,
      ],
      [
        'a function LaTeX has no command for',
        `<m:func><m:fName>${r('sgn', UPRIGHT)}</m:fName><m:e>${r('x')}</m:e></m:func>`,
        R`\operatorname{sgn} x`,
      ],
      [
        'a limit under another word',
        `<m:limLow><m:e>${r('x+y')}</m:e><m:lim>${r('k')}</m:lim></m:limLow>`,
        R`\underset{k}{x+y}`,
      ],
      ['hat', accent(String.fromCodePoint(0x0302)), R`\hat{x}`],
      [
        'the accent Word means when it names none',
        `<m:acc><m:e>${r('x')}</m:e></m:acc>`,
        R`\hat{x}`,
      ],
      ['tilde', accent(String.fromCodePoint(0x0303)), R`\tilde{x}`],
      ['vector', accent(String.fromCodePoint(0x20d7)), R`\vec{x}`],
      ['dot', accent(String.fromCodePoint(0x0307)), R`\dot{x}`],
      ['two dots', accent(String.fromCodePoint(0x0308)), R`\ddot{x}`],
      ['bar', accent(String.fromCodePoint(0x0304)), R`\bar{x}`],
      [
        'overline',
        `<m:bar><m:barPr><m:pos m:val="top"/></m:barPr><m:e>${r('x+y')}</m:e></m:bar>`,
        R`\overline{x+y}`,
      ],
      [
        'underline',
        `<m:bar><m:barPr><m:pos m:val="bot"/></m:barPr><m:e>${r('x')}</m:e></m:bar>`,
        R`\underline{x}`,
      ],
      ['bold', run('<m:sty m:val="b"/>'), R`\mathbf{v}`],
      ['double-struck', run('<m:scr m:val="double-struck"/>'), R`\mathbb{v}`],
      ['script', run('<m:scr m:val="script"/>'), R`\mathcal{v}`],
      ['fraktur', run('<m:scr m:val="fraktur"/>'), R`\mathfrak{v}`],
      ['plain words', `${r('x ')}${r('if n is even', PLAIN_WORDS)}`, R`x \text{if n is even}`],
    ];
    for (const [label, inner, expected] of cases) {
      expect(ommlToLatex(math(inner)), label).toBe(expected);
      expect(readable(expected), label).toBe(true);
      expect(latex(inner), label).toBe(expected);
    }

    // Several equations in one paragraph: one under another.
    expect(
      ommlToLatex(
        `<m:oMathPara><m:oMath>${r('a=b')}</m:oMath><m:oMath>${r('c=d')}</m:oMath></m:oMathPara>`,
        { readable },
      ),
    ).toBe(R`\begin{gathered} a=b \\ c=d \end{gathered}`);
    // One equation in a paragraph of its own is just that equation.
    expect(
      ommlToLatex(
        `<m:oMathPara><m:oMathParaPr><m:jc m:val="center"/></m:oMathParaPr><m:oMath>${r('a=b')}</m:oMath></m:oMathPara>`,
        { readable },
      ),
    ).toBe('a=b');

    // A fraction over a root as Word itself saves one: a font on every run,
    // control properties on every element, a mark of italic. Hand-written to
    // that shape; the same LaTeX as without them.
    const font = '<w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/><w:i/></w:rPr>';
    const control = `<m:ctrlPr>${font}</m:ctrlPr>`;
    const saved =
      `<m:f><m:fPr>${control}</m:fPr><m:num>${r('1', font)}</m:num><m:den>` +
      `<m:rad><m:radPr><m:degHide m:val="1"/>${control}</m:radPr><m:deg/>` +
      `<m:e>${r('x', `<m:rPr><m:sty m:val="i"/></m:rPr>${font}`)}</m:e></m:rad></m:den></m:f>`;
    const bare =
      `<m:f><m:num>${r('1')}</m:num><m:den>` +
      `<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>${r('x')}</m:e></m:rad></m:den></m:f>`;
    expect(latex(saved)).toBe(R`\frac{1}{\sqrt{x}}`);
    expect(latex(saved)).toBe(latex(bare));
    // As Word saved `x∈ℝ` (found at the Test phase, in a file Word wrote): a
    // double-struck run that holds the sign as well as the letter. Only the
    // letter is double-struck.
    const struck = latex(`${r('x')}${r('∈R', '<m:rPr><m:scr m:val="double-struck"/></m:rPr>')}`);
    expect(struck).toBe(R`x∈\mathbb{R}`);
    expect(formulaText(struck!)).toBe('x∈ℝ');
    expect(latex(r('a+b', '<m:rPr><m:sty m:val="b"/></m:rPr>'))).toBe(R`\mathbf{a}+\mathbf{b}`);
    // A bookmark inside an equation holds none of it, and is passed over.
    expect(latex(`<w:bookmarkStart w:id="0" w:name="x"/>${r('a')}<w:bookmarkEnd w:id="0"/>`)).toBe(
      'a',
    );
  });

  // T-082 clause 1
  it('test_omml_trial_faults: the four the off-the-shelf route got wrong', () => {
    expect(latex(brackets('(', ')', MATRIX))).toBe(R`\begin{pmatrix} a & b \\ c & d \end{pmatrix}`);
    expect(latex(`<m:eqArr><m:e>${r('a&amp;=b')}</m:e><m:e>${r('&amp;=c')}</m:e></m:eqArr>`)).toBe(
      R`\begin{aligned} a&=b \\ &=c \end{aligned}`,
    );
    const sine = latex(
      `<m:func><m:fName>${r('sin', UPRIGHT)}</m:fName><m:e>${r('θ')}</m:e></m:func>`,
    );
    expect(sine).toBe(R`\sin θ`);
    expect(sine).not.toContain('mathit');
    expect(
      latex(
        `<m:func><m:fName><m:limLow><m:e>${r('lim', UPRIGHT)}</m:e><m:lim>${r('n→∞')}</m:lim></m:limLow></m:fName><m:e>${r('a')}</m:e></m:func>`,
      ),
    ).toBe(R`\lim_{n→∞} a`);
  });

  // T-082 clause 2
  it('test_omml_characters: symbols are themselves, and LaTeX’s own characters are shown', () => {
    expect(latex(r('α+β≤γ→∞'))).toBe('α+β≤γ→∞');
    for (const [typed, shown] of [
      ['\\', '\\'],
      ['{', '{'],
      ['}', '}'],
      ['#', '#'],
      ['%', '%'],
      ['&amp;', '&'],
      ['_', '_'],
      ['^', '^'],
      ['~', '~'],
      ['$', '$'],
    ] as const) {
      const written = latex(r(`a${typed}b`));
      expect(written, typed).not.toBeNull();
      expect(formulaText(written!), typed).toBe(`a${shown}b`);
    }
  });

  // T-082 clause 3
  it('test_omml_unknown_is_nothing: what has no rule gives nothing, never part of an equation', () => {
    const nothing: [string, string][] = [
      ['an element with no rule', `<m:whatever>${r('a')}</m:whatever>`],
      [
        'one nested in a fraction',
        `<m:f><m:num><m:whatever/></m:num><m:den>${r('c')}</m:den></m:f>`,
      ],
      [
        'a tracked insertion round a run',
        `${r('a')}<w:ins w:id="1" w:author="x">${r('b')}</w:ins>`,
      ],
      ['a link round a run', `<w:hyperlink r:id="rId9">${r('a')}</w:hyperlink>`],
      ['a bracket with no rule', brackets('«', '»', r('a'))],
      ['an accent with no rule', accent(String.fromCodePoint(0x20db))],
      [
        'a grouping mark with no rule',
        `<m:groupChr><m:groupChrPr><m:chr m:val="⇒"/></m:groupChrPr><m:e>${r('a')}</m:e></m:groupChr>`,
      ],
      [
        'a kind of fraction with no rule',
        `<m:f><m:fPr><m:type m:val="tilted"/></m:fPr><m:num>${r('a')}</m:num><m:den>${r('b')}</m:den></m:f>`,
      ],
      ['a run style with no rule', run('<m:sty m:val="weird"/>')],
      ['a script with no rule', run('<m:scr m:val="curly"/>')],
    ];
    for (const [label, inner] of nothing) expect(latex(inner), label).toBeNull();

    // Not well formed.
    expect(ommlToLatex('<m:oMath><m:r>', { readable })).toBeNull();
    // An equation of nothing.
    expect(latex('')).toBeNull();
    // LaTeX the layout engine refuses: the whole equation is given up.
    expect(ommlToLatex(math(r('a')), { readable: () => false })).toBeNull();
    expect(ommlToLatex(math(r('a')), { readable: () => true })).toBe('a');
  });
});
