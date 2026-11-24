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

// INT-0029 AC8 (T-074) — the guide tells a person how to add a document.
describe('adding a document, in the guide', () => {
  const chapter = read(CHAPTERS[0]!);
  // Wrapped lines are joined, so a phrase is found wherever the prose breaks.
  const section = chapter
    .slice(chapter.indexOf('## Add a document'), chapter.indexOf('## For agents'))
    .replace(/\s+/g, ' ');

  it('test_tutorial_covers_documents: files, folders, Google Docs, what is marked, what is not carried over', () => {
    expect(section.length).toBeGreaterThan(500);
    for (const topic of [
      '.md', // a Markdown file
      '.docx', // a Word document
      'tome.local.toml', // the same in the manifest
      'Google Docs', // downloaded as Word
      'README.md', // what opens a folder
      '2-notes.md', // how a folder is ordered
      'node_modules', // which folders are skipped
      '[equation not shown]',
      '[figure not shown]',
      '[image not shown]',
      '[document not shown]',
      'without the link', // cross-references become plain text
      'underlining', // not carried over
      'front matter',
      'does not lead to that note', // links between notes
      'restart', // npm run dev
    ]) {
      expect(section, topic).toContain(topic);
    }
    // A books:add line that names a Word file.
    expect(section).toMatch(/npm run books:add -- .*\.docx/);
    expect(readmeSection).toMatch(/npm run books:add -- .*\.docx/);
  });

  it('test_config_template_mentions_documents: the tracked manifest says a path may be a document', () => {
    const template = read('tome.config.toml');
    expect(template).toMatch(/^#.*\.docx/m);
    // Still a template: every line is a comment or blank, so it lists no book.
    const live = template.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('#'));
    expect(live).toEqual([]);
  });
});

// INT-0030 AC8 (T-083) — the guide says a Word document's equations are carried
// over. (How to write a formula is checked in tutorial-math.test.ts, which
// lays the chapter out and so runs where the Markdown parser can.)
describe('equations in a Word document, in the guide', () => {
  const path = 'src/content/books/tome/write-mathematics.md';

  it('test_tutorial_covers_documents: a Word document’s equations are carried over', () => {
    const guide = read(CHAPTERS[0]!).replace(/\s+/g, ' ');
    expect(guide).toContain('An equation is carried over and laid out as mathematics');
    expect(guide).toContain('[equation not shown]');
    expect(guide).toContain('](write-mathematics.md)');
    const about = readmeSection.replace(/\s+/g, ' ');
    expect(about).toContain('its equations carried over and laid out');
    expect(about).toContain('[equation not shown]');
    expect(readme).toContain(`](${path})`);
  });
});

// INT-0033 AC7 (T-094) — the guide says what a LaTeX or Typst paper becomes.
describe('a paper in LaTeX or Typst, in the guide', () => {
  const chapter = read(CHAPTERS[0]!);
  const section = chapter
    .slice(chapter.indexOf('## Add a document'), chapter.indexOf('## For agents'))
    .replace(/\s+/g, ' ');
  const papers = chapter
    .slice(
      chapter.indexOf('### What carries over from a LaTeX or Typst paper'),
      chapter.indexOf('### What to know about Markdown notes'),
    )
    .replace(/\s+/g, ' ');

  it('test_tutorial_covers_papers: what is read, what is marked, and what cannot be read', () => {
    expect(papers.length).toBeGreaterThan(1000);
    // A library entry may be a paper, and a books:add line names one.
    expect(section).toContain('a paper written in LaTeX (`.tex`) or Typst (`.typ`)');
    expect(section).toMatch(/npm run books:add -- \S+\.tex\b/);
    expect(section).toContain('chapter per `.md`, `.docx`, `.tex` and `.typ` file');
    // Which files of a folder are chapters.
    expect(section).toContain('A paper of several files is one chapter');
    expect(section).toContain('\\documentclass');
    expect(section).toContain('includes or imports');
    // What a paper keeps.
    for (const kept of [
      'sections',
      'Formulas',
      'Theorems',
      'lists',
      'tables',
      'figures',
      'footnotes',
      'reference',
      'citation',
    ]) {
      expect(papers, kept).toContain(kept);
    }
    // What is marked, each with its mark.
    for (const mark of [
      '[LaTeX not shown]',
      '[image not shown]',
      '[equation not shown]',
      '[document not shown]',
    ]) {
      expect(papers, mark).toContain(mark);
    }
    expect(papers).toContain('PDF or EPS');
    // The words the loader prints, as `describeLeftOut()` writes them.
    expect(papers).toContain('pieces of LaTeX not shown (tikzpicture, \\mycmd)');
    expect(papers).toContain('citation with no entry');
    // The limits.
    expect(papers).toContain('A Typst document that uses a package');
    expect(papers).toContain('cannot be read at all');
    expect(papers).toContain('may differ from the PDF');
    expect(papers).toContain('`.bbl`');
    expect(papers).toContain('\\resizebox');
    // By what the reading is done, and under what licence.
    expect(papers).toContain('pandoc-wasm');
    expect(papers).toContain('GPL');
    // Live reload is off for a paper as for any document.
    expect(section).toContain('a paper among them');
    expect(section).toContain('restart');
  });

  it('test_tutorial_equation_reference: a formula’s number can be referred to', () => {
    const mathematics = read('src/content/books/tome/write-mathematics.md');
    expect(mathematics).toContain('## Refer to an equation by its number');
    expect(mathematics).toContain('[](#eq:gauss)');
    expect(mathematics).toContain('\\label{eq:gauss}');
    expect(mathematics).toContain('[eq:gauss](#eq:gauss)');
    // The chapter does it itself, to one of its own equations.
    expect(mathematics).toContain('([](#eq:energy))');
    expect(mathematics.split('\\label{eq:energy}').length - 1).toBe(2);
    // It no longer says a number cannot be referred to.
    expect(mathematics).not.toContain('is not offered yet');
    expect(mathematics.replace(/\s+/g, ' ')).toContain(
      '`\\ref` and `\\eqref` inside a formula are not read',
    );
    expect(mathematics.replace(/\s+/g, ' ')).toContain(
      'how a paper written in LaTeX or Typst is read',
    );
  });

  it('test_readme_names_pandoc: what reads a paper, and under what licence', () => {
    const about = readmeSection.replace(/\s+/g, ' ');
    expect(about).toContain('LaTeX (`.tex`) or Typst (`.typ`)');
    expect(about).toContain('[LaTeX not shown]');
    expect(about).toContain('pandoc-wasm');
    expect(about).toContain('GPL (version 2 or later)');
    expect(about).toContain("it is not in Tome's built pages or in the desktop apps");
    expect(readmeSection).toMatch(/npm run books:add -- \S+\.tex\b/);
  });
});
