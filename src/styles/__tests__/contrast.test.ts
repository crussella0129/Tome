import { describe, it, expect } from 'vitest';
import {
  THEMES,
  contrastRatio,
  relativeLuminance,
  parseHex,
  WCAG_AA_NORMAL,
} from '../theme';

describe('theme colour math', () => {
  it('parses shorthand and full hex', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('#2b2018')).toEqual([43, 32, 24]);
  });

  it('luminance is ordered black < grey < white', () => {
    expect(relativeLuminance('#000000')).toBeLessThan(relativeLuminance('#808080'));
    expect(relativeLuminance('#808080')).toBeLessThan(relativeLuminance('#ffffff'));
  });

  it('contrast of black on white is ~21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
});

// EARS (T-002, clause 1): body ink on the paper ground must meet WCAG AA in
// EACH shipped theme.
describe('test_ink_on_paper_contrast_aa', () => {
  for (const theme of THEMES) {
    it(`${theme.className}: text on background ≥ AA (${WCAG_AA_NORMAL}:1)`, () => {
      const ratio = contrastRatio(theme.text, theme.background);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  }
});
