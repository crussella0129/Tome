import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  THEMES,
  SANGUINE_ATONEMENT,
  SANGUINE_ROLES,
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

// INT-0022 AC4 — every Sanguine reading role on every surface it can sit on,
// including the brightest tone the obsidian texture can composite to.

/** Source-over compositing of `top` at `alpha` onto opaque `base`, in sRGB. */
function over(base: string, top: string, alpha: number): string {
  const b = parseHex(base);
  const t = parseHex(top);
  return (
    '#' +
    b
      .map((v, i) => Math.round(v + alpha * (t[i]! - v)))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

describe('test_sanguine_role_contrast', () => {
  const { surfaces, surface } = SANGUINE_ROLES;
  const sheen = over(
    over(surfaces.page, surface.highlight, surface.opacity),
    surface.glow,
    surface.glowAlpha,
  );
  const grounds = { ...surfaces, sheen };

  it('body text is at least 5:1 on page, panel, input, and sheen', () => {
    for (const [name, ground] of Object.entries(grounds)) {
      expect(contrastRatio(SANGUINE_ROLES.text, ground), name).toBeGreaterThanOrEqual(5);
    }
  });

  it('subdued and link text meet AA (4.5:1) on every surface', () => {
    for (const role of ['subdued', 'link'] as const) {
      for (const [name, ground] of Object.entries(grounds)) {
        expect(
          contrastRatio(SANGUINE_ROLES[role], ground),
          `${role} on ${name}`,
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    }
  });

  it('the pooled foot of a carved letter keeps large-text AA (3:1) on the page', () => {
    expect(contrastRatio(SANGUINE_ROLES.pooled, surfaces.page)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(SANGUINE_ROLES.headingTop, surfaces.page)).toBeGreaterThan(
      contrastRatio(SANGUINE_ROLES.pooled, surfaces.page),
    );
  });

  it('the documented roles match the Sanguine token block (no drift)', () => {
    const css = readFileSync('src/styles/tokens.css', 'utf8');
    const block = css.slice(css.indexOf('body.theme-sanguine-atonement {'));
    const token = (name: string) =>
      block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();
    expect(token('theme-background')).toBe(surfaces.page);
    expect(token('theme-window-background')).toBe(surfaces.panel);
    expect(token('theme-background-input')).toBe(surfaces.input);
    expect(token('theme-text')).toBe(SANGUINE_ROLES.text);
    expect(token('theme-text-subdued')).toBe(SANGUINE_ROLES.subdued);
    expect(token('theme-link')).toBe(SANGUINE_ROLES.link);
    expect(token('theme-focused-foreground')).toBe(SANGUINE_ROLES.accent);
    expect(token('sanguine-pooled')).toBe(SANGUINE_ROLES.pooled);
    expect(token('sanguine-arterial')).toBe(SANGUINE_ROLES.headingTop);
    expect(SANGUINE_ATONEMENT.background).toBe(surfaces.page);
    expect(SANGUINE_ATONEMENT.text).toBe(SANGUINE_ROLES.text);

    const sanguine = readFileSync('src/styles/sanguine.css', 'utf8');
    const layer = sanguine.slice(sanguine.indexOf('body.theme-sanguine-atonement::before {'));
    expect(layer.match(/opacity:\s*([0-9.]+)/)?.[1]).toBe(String(surface.opacity));
  });
});
