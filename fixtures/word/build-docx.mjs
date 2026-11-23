// Build a Word file from its parts. A `.docx` is a zip of XML files; the test
// fixture is kept as those files (fixtures/word/paper/) so a diff can show it,
// and is zipped here when a test or a gate needs the real thing.
//
//   node fixtures/word/build-docx.mjs <parts-folder> <out.docx>
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import JSZip from 'jszip';

/** The parts of the sample paper. */
export const PAPER_PARTS = join(dirname(fileURLToPath(import.meta.url)), 'paper');

/** Every file under `dir`, as `/`-separated paths from it, sorted. */
async function listParts(dir) {
  const out = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else out.push(relative(dir, full).split(sep).join('/'));
    }
  }
  await walk(dir);
  return out.sort();
}

/**
 * Zip a folder of Word parts into the bytes of a `.docx`.
 * @param {string} [partsDir] the folder of parts (default: the sample paper)
 * @param {{ replace?: Record<string, string | Buffer | ((text: string) => string)> }} [options]
 *   `replace` swaps a part's content, or maps its text, for a test's variant;
 *   a name that is not among the parts is added.
 * @returns {Promise<Buffer>}
 */
export async function buildDocx(partsDir = PAPER_PARTS, { replace = {} } = {}) {
  const zip = new JSZip();
  const names = await listParts(partsDir);
  for (const name of names) {
    let content = await readFile(join(partsDir, ...name.split('/')));
    const swap = replace[name];
    if (typeof swap === 'function') content = Buffer.from(swap(content.toString('utf8')));
    else if (swap !== undefined) content = Buffer.from(swap);
    zip.file(name, content);
  }
  for (const [name, swap] of Object.entries(replace)) {
    if (!names.includes(name) && typeof swap !== 'function') zip.file(name, Buffer.from(swap));
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [parts, out] = process.argv.slice(2);
  if (!parts || !out) {
    console.error('usage: node fixtures/word/build-docx.mjs <parts-folder> <out.docx>');
    process.exit(1);
  }
  await writeFile(out, await buildDocx(parts));
}
