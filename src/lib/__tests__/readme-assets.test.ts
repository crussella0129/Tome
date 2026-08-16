import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Repo root, from src/lib/__tests__/.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');

describe('README assets', () => {
  // The showcase README embeds a banner + a screenshot gallery; guard against a
  // broken image reference (a renamed/removed asset) landing in the repo.
  it('test_readme_assets_resolve: every referenced docs/assets image exists', () => {
    const refs = new Set<string>();
    // matches  src="docs/assets/…"  and  ](docs/assets/…)
    for (const m of readme.matchAll(/(?:src="|\]\()(docs\/assets\/[^")\s]+)/g)) {
      refs.add(m[1]!);
    }
    expect(refs.size).toBeGreaterThan(0);
    const missing = [...refs].filter((ref) => !existsSync(join(ROOT, ref)));
    expect(missing, `missing README assets: ${missing.join(', ')}`).toEqual([]);
  });
});
