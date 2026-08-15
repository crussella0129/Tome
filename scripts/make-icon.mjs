// Generates the Tome desktop-app icon: a capital "T" in the display font
// (Mekzantine) on the app's warm ground, rendered with the real woff2 so the
// letterform is exact. Produces a multi-size Windows `.ico` and a 512px `.png`
// (Linux window icon) under `electron/assets/`.
//
//   node scripts/make-icon.mjs
//
// Colours mirror the "Terminal (dark)" theme (src/styles/theme.ts). To switch to
// ink-on-parchment, set BG = '#f3e9d2' and FG = '#2b2018'.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT = join(ROOT, 'public', 'fonts', 'mekzantine.woff2');
const OUT_DIR = join(ROOT, 'electron', 'assets');

const BG = '#16130e'; // page ground (warm near-black)
const FG = '#e8dcc2'; // body ink (parchment)
const GLYPH = 'T';
const ICO_SIZES = [256, 128, 64, 48, 32, 16];
const PNG_SIZE = 512;

function pageHtml(size, fontDataUri) {
  // Optical sizing: a serif capital T reads best at ~0.72 of the tile, nudged
  // up a hair so the crossbar sits visually centred.
  const fontSize = Math.round(size * 0.72);
  return `<!doctype html><meta charset="utf-8"><style>
    @font-face { font-family:'Mekzantine'; src:url('${fontDataUri}') format('woff2'); font-weight:400; }
    html,body{margin:0;padding:0}
    .tile{width:${size}px;height:${size}px;background:${BG};display:flex;align-items:center;justify-content:center;overflow:hidden}
    .glyph{font-family:'Mekzantine',serif;font-weight:400;font-size:${fontSize}px;line-height:1;color:${FG};
           transform:translateY(-${Math.round(size * 0.03)}px)}
  </style><div class="tile"><span class="glyph">${GLYPH}</span></div>`;
}

async function renderPng(page, size, fontDataUri) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(pageHtml(size, fontDataUri), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const el = await page.$('.tile');
  return el.screenshot({ type: 'png' });
}

// Pack PNG buffers into a Vista-style PNG-compressed .ico.
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  for (let i = 0; i < count; i++) {
    const { size, png } = entries[i];
    const b = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, b + 0); // width (0 => 256)
    dir.writeUInt8(size >= 256 ? 0 : size, b + 1); // height
    dir.writeUInt8(0, b + 2); // palette
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // colour planes
    dir.writeUInt16LE(32, b + 6); // bits per pixel
    dir.writeUInt32LE(png.length, b + 8); // bytes in resource
    dir.writeUInt32LE(offset, b + 12); // offset
    offset += png.length;
  }
  return Buffer.concat([header, dir, ...entries.map((e) => e.png)]);
}

const fontDataUri = `data:font/woff2;base64,${(await readFile(FONT)).toString('base64')}`;
await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
try {
  const entries = [];
  for (const size of ICO_SIZES) {
    entries.push({ size, png: await renderPng(page, size, fontDataUri) });
  }
  await writeFile(join(OUT_DIR, 'icon.ico'), buildIco(entries));

  const png512 = await renderPng(page, PNG_SIZE, fontDataUri);
  await writeFile(join(OUT_DIR, 'icon.png'), png512);
  console.log(`icon.ico (${ICO_SIZES.join(',')}) + icon.png (${PNG_SIZE}) → ${OUT_DIR}`);
} finally {
  await browser.close();
}
