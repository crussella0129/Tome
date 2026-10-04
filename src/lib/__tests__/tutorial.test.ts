// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

// INT-0023 AC6 — the find-and-deploy tutorial in the bundled Tome guide.
const CHAPTERS = [
  'src/content/books/tome/find-your-books.md',
  'src/content/books/tome/take-it-to-the-table.md',
  'src/content/books/tome/a-campaign-of-tablets.md',
];
const read = (path: string) => readFileSync(path, 'utf8');
const tutorial = CHAPTERS.map(read).join('\n');
const readme = read('README.md');
const readmeSection = readme.slice(
  readme.indexOf('## Bring your own books'),
  readme.indexOf('## Read any mdBook'),
);
const scripts = Object.keys(JSON.parse(read('package.json')).scripts as Record<string, string>);

describe('the find-and-deploy tutorial', () => {
  it('test_tutorial_commands_exist: every documented `npm run` script exists', () => {
    const documented = new Set(
      [...`${tutorial}\n${readmeSection}`.matchAll(/npm run ([a-z][\w:-]*)/g)].map((m) => m[1]!),
    );
    expect(documented.size).toBeGreaterThanOrEqual(6);
    for (const name of documented) expect(scripts, `npm run ${name}`).toContain(name);
  });

  it('test_tutorial_covers_topics: discovery, agents, manifest, desktop, tablet, live edits, hosting, campaign', () => {
    for (const topic of [
      'npm run books:find', // discovery (CLI)
      'Get-ChildItem', // manual search, PowerShell
      'find ~ -maxdepth', // manual search, bash
      '--json', // agent recipe
      '"version": 1',
      'npm run books:add', // adding
      'tome.local.toml',
      'npm run electron', // desktop
      'npm run preview -- --host', // tablet over Wi-Fi
      'Add to Home Screen',
      'TOME_BOOK=', // live edits
      'root of a domain', // static hosting + the base-path limitation
      'Uploading publishes', // privacy
      'offline', // no offline mode yet
      '(sealed)', // campaign recipe
      'Cheydinhal', // the rite, hinted
    ]) {
      expect(tutorial, topic).toContain(topic);
    }
    // Hint the riddle; never print its answer.
    expect(tutorial.toLowerCase()).not.toContain('sanguine');
  });

  it('test_readme_links_tutorial: the README points at the chapters and no longer claims an overwrite', () => {
    for (const chapter of CHAPTERS) {
      expect(readme).toContain(`](${chapter})`);
      expect(existsSync(chapter)).toBe(true);
    }
    expect(readme).not.toMatch(/overwrites the content library/);
    expect(readme).toContain('tome.local.toml');
  });
});
