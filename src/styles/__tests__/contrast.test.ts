import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  THEMES,
  SANGUINE_ATONEMENT,
  SANGUINE_ROLES,
  SANGUINE_SIDEBAR,
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

  it('interface text (bone, weathered bone, links, accent) meets AA (4.5:1) on every surface', () => {
    for (const role of ['text', 'subdued', 'link', 'accent'] as const) {
      for (const [name, ground] of Object.entries(grounds)) {
        expect(
          contrastRatio(SANGUINE_ROLES[role], ground),
          `${role} on ${name}`,
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    }
    // The current chapter's accent text also sits on its own tint over the panel.
    const currentRow = over(surfaces.panel, SANGUINE_ROLES.accent, SANGUINE_ROLES.accentTint);
    expect(contrastRatio(SANGUINE_ROLES.accent, currentRow)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });

  // T-061 / INT-0022 AC4 (revised): the inscription is hue-true blood, legible
  // as large text (≥ 24px) at ≥ 3.3:1 everywhere it can render.
  it('test_sanguine_inscription_contrast: crimson ink and its links clear 3.3:1 at inscription size', () => {
    expect(SANGUINE_ROLES.inscriptionPx).toBeGreaterThanOrEqual(24);
    for (const role of ['inscription', 'inscriptionLink'] as const) {
      for (const [name, ground] of Object.entries(grounds)) {
        expect(
          contrastRatio(SANGUINE_ROLES[role], ground),
          `${role} on ${name}`,
        ).toBeGreaterThanOrEqual(3.3);
      }
    }
    // Anatomically hue-true: red-dominant with almost no green or blue lift.
    const [r, g, b] = parseHex(SANGUINE_ROLES.inscription);
    expect(r).toBeGreaterThan(200);
    expect(Math.max(g, b)).toBeLessThanOrEqual(24);
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
    expect(block).toContain(
      `--theme-focused-foreground-subdued: rgba(255, 48, 48, ${SANGUINE_ROLES.accentTint})`,
    );
    expect(token('sanguine-ink')).toBe(SANGUINE_ROLES.inscription);
    expect(token('sanguine-vein')).toBe(SANGUINE_ROLES.inscriptionLink);
    expect(token('sanguine-pooled')).toBe(SANGUINE_ROLES.pooled);
    expect(token('sanguine-arterial')).toBe(SANGUINE_ROLES.headingTop);
    expect(SANGUINE_ATONEMENT.background).toBe(surfaces.page);
    expect(SANGUINE_ATONEMENT.text).toBe(SANGUINE_ROLES.text);

    const sanguine = readFileSync('src/styles/sanguine.css', 'utf8');
    const layer = sanguine.slice(sanguine.indexOf('body.theme-sanguine-atonement::before {'));
    expect(layer.match(/opacity:\s*([0-9.]+)/)?.[1]).toBe(String(surface.opacity));
  });
});

// INT-0025 — the Sanguine sidebar void and the salmon code chips.
describe('test_sanguine_sidebar_contrast', () => {
  const { grounds, tint, channel } = SANGUINE_SIDEBAR;

  it('the documented row tints are the channel composited over their grounds', () => {
    expect(over(grounds.void, channel, tint)).toBe(grounds.current);
    expect(over(grounds.sunken, channel, tint)).toBe(grounds.selected);
  });

  it('every sidebar text role meets AA (4.5:1) on each ground it renders on', () => {
    // Subdued text (part titles, drafts, captions) never sits on the current
    // row or the selected picker segment; those carry the accent.
    const rendersOn = {
      text: ['void', 'sunken', 'current', 'selected'],
      subdued: ['void', 'sunken'],
      accent: ['void', 'sunken', 'current', 'selected'],
    } as const;
    for (const [role, names] of Object.entries(rendersOn)) {
      for (const name of names) {
        const ratio = contrastRatio(
          SANGUINE_SIDEBAR[role as keyof typeof rendersOn],
          grounds[name as keyof typeof grounds],
        );
        expect(ratio, `${role} on ${name}`).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    }
  });

  it('the crimson channel is a visible non-text mark (3:1) on the void', () => {
    expect(contrastRatio(channel, grounds.void)).toBeGreaterThanOrEqual(3);
  });

  it('test_sanguine_chip_contrast: both stops of the salmon chip clear AA on its ground', () => {
    const { ground, top, bottom } = SANGUINE_SIDEBAR.chip;
    expect(contrastRatio(top, ground)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    expect(contrastRatio(bottom, ground)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });

  it('the contract matches the stylesheets (no drift)', () => {
    const sidebar = readFileSync('src/components/TocSidebar.module.css', 'utf8');
    const block = sidebar.slice(
      sidebar.indexOf(':global(body.theme-sanguine-atonement) .sidebar {'),
    );
    for (const [token, value] of [
      ['--theme-window-background', grounds.void],
      ['--theme-background-modal', grounds.sunken],
      ['--theme-text', SANGUINE_SIDEBAR.text],
      ['--theme-text-subdued', SANGUINE_SIDEBAR.subdued],
      ['--theme-focused-foreground', SANGUINE_SIDEBAR.accent],
    ] as const) {
      expect(block, token).toContain(`${token}: ${value};`);
    }
    expect(block).toContain(`--theme-focused-foreground-subdued: rgba(213, 2, 16, ${tint});`);
    expect(block).toContain(`border-left-color: ${channel};`);
    const chips = readFileSync('src/styles/sanguine.css', 'utf8');
    const { ground, top, bottom } = SANGUINE_SIDEBAR.chip;
    expect(chips).toContain(`linear-gradient(180deg, ${top}, ${bottom}) text`);
    expect(chips).toContain(`linear-gradient(${ground}, ${ground}) padding-box`);
  });
});
