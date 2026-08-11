import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const fontsCss = readFileSync(join(root, 'src/styles/fonts.css'), 'utf8');
const tokensCss = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8');

describe('font self-hosting', () => {
  // T-006 clause 1
  it('test_fonts_self_hosted: every @font-face src is same-origin /fonts/, no external host', () => {
    const srcUrls = [...fontsCss.matchAll(/src:\s*url\(([^)]+)\)/g)].map((m) =>
      m[1]!.replace(/['"]/g, '').trim(),
    );
    expect(srcUrls.length).toBeGreaterThan(0);
    for (const url of srcUrls) {
      expect(url.startsWith('/fonts/')).toBe(true);
    }
    // No absolute external URL anywhere in the font declarations.
    expect(fontsCss).not.toMatch(/https?:\/\//);
  });

  // T-006 clause 3
  it('test_font_fallback_present: --font-family-mono falls back to monospace', () => {
    const decl = tokensCss.match(/--font-family-mono:\s*([^;]+);/);
    expect(decl).not.toBeNull();
    expect(decl![1]!.toLowerCase()).toContain('monospace');
  });
});
