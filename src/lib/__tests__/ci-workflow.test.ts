import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ci = readFileSync(join(process.cwd(), '.github/workflows/ci.yml'), 'utf8');

describe('CI workflow', () => {
  // T-009 clause 1
  it('test_ci_workflow_valid: runs astro check + vitest + playwright on PRs to main / pushes to dev', () => {
    // Triggers
    expect(ci).toMatch(/pull_request:/);
    expect(ci).toMatch(/branches:\s*\[\s*main\s*\]/);
    expect(ci).toMatch(/push:/);
    expect(ci).toMatch(/branches:\s*\[\s*dev\s*\]/);
    // Gates — a red gate fails the check because each is a plain `run:` step.
    expect(ci).toMatch(/astro check/);
    expect(ci).toMatch(/vitest run/);
    expect(ci).toMatch(/playwright test/);
    // Dependencies installed reproducibly.
    expect(ci).toMatch(/npm ci/);
  });
});
