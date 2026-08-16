// Renders the Tome brand banner for the README: the "TOME" wordmark in the
// reader's own display font (Mekzantine) over the ink-on-parchment palette, with
// a rubric rule and a mono-set tagline. The type is baked into the raster, so the
// image renders on GitHub with no web-font dependency. Same technique as
// scripts/make-icon.mjs. Regenerate with:
//
//   node scripts/make-banner.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DISPLAY = join(ROOT, 'public', 'fonts', 'mekzantine.woff2');
const MONO = join(ROOT, 'public', 'fonts', 'mekzantine-mono.woff2');
const OUT = join(ROOT, 'docs', 'assets', 'banner.png');

// Ink-on-old-paper palette (src/styles/theme.ts / tokens.css).
const PARCHMENT = '#f3e9d2';
const INK = '#2b2018';
const FADED = '#6b5d48';
const RUBRIC = '#a83a2b';
const RULE = '#cdbb95';

const W = 1200;
const H = 380;

function html(displayUri, monoUri) {
  return `<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:'Mekz';src:url('${displayUri}') format('woff2')}
    @font-face{font-family:'MekzMono';src:url('${monoUri}') format('woff2')}
    html,body{margin:0;padding:0}
    .banner{width:${W}px;height:${H}px;background:${PARCHMENT};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      box-sizing:border-box;position:relative;overflow:hidden}
    /* a quiet printed-page frame */
    .frame{position:absolute;inset:18px;border:1px solid ${RULE}}
    .frame::before{content:'';position:absolute;inset:6px;border:1px solid ${RULE};opacity:.6}
    .wordmark{font-family:'Mekz',serif;font-size:168px;line-height:1;color:${INK};
      letter-spacing:.06em;margin:0 0 6px 6px}
    .rule{width:190px;height:3px;background:${RUBRIC};margin:6px 0 20px}
    .tagline{font-family:'MekzMono',ui-monospace,monospace;font-size:22px;color:${FADED};
      letter-spacing:.34em;text-transform:uppercase}
  </style>
  <div class="banner">
    <div class="frame"></div>
    <div class="wordmark">TOME</div>
    <div class="rule"></div>
    <div class="tagline">an ink-on-old-paper mdBook reader</div>
  </div>`;
}

const displayUri = `data:font/woff2;base64,${(await readFile(DISPLAY)).toString('base64')}`;
const monoUri = `data:font/woff2;base64,${(await readFile(MONO)).toString('base64')}`;
await mkdir(dirname(OUT), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
try {
  await page.setContent(html(displayUri, monoUri), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const el = await page.$('.banner');
  await el.screenshot({ path: OUT });
  console.log(`banner → ${OUT} (${W}x${H} @2x)`);
} finally {
  await browser.close();
}
