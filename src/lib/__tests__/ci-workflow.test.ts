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
    // The external-book render is gated remotely (T-014).
    expect(ci).toMatch(/check-external-build\.mjs/);
    // Dependencies installed reproducibly.
    expect(ci).toMatch(/npm ci/);
    // Actions are on the non-deprecated (Node 24) majors — no @v4 (Node 20).
    expect(ci).toMatch(/actions\/checkout@v5/);
    expect(ci).toMatch(/actions\/setup-node@v5/);
    expect(ci).toMatch(/actions\/upload-artifact@v5/);
    expect(ci).not.toMatch(/actions\/[a-z-]+@v4/);
  });
});
