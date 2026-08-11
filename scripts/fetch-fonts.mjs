// Fetch the Mekzantine fonts into public/fonts/ at build time so the deployed
// site serves them from its own origin (no runtime CDN dependency). The font
// binaries are NOT committed (public/fonts/ is git-ignored) because Mekzantine
// has no published licence — this fetches for the local/CI build only.
//
// Idempotent (skips an existing file) and NON-FATAL: any network error warns and
// exits 0 so a blocked CDN can never break a build; the `monospace` fallback in
// tokens.css then covers the reader.
import { mkdir, access, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FONTS = [
  {
    url: 'https://intdev-global.s3.us-west-2.amazonaws.com/public/internet-dev/0e704e0e-fc0f-41b1-80fb-746909651d9e.woff2',
    file: 'mekzantine-mono.woff2',
  },
  {
    url: 'https://intdev-global.s3.us-west-2.amazonaws.com/public/internet-dev/a05d9994-b988-49f4-9030-cd11a3bc7226.woff2',
    file: 'mekzantine.woff2',
  },
];

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'fonts');

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  for (const { url, file } of FONTS) {
    const dest = join(outDir, file);
    if (await exists(dest)) {
      console.log(`fetch-fonts: ${file} already present, skipping`);
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      console.log(`fetch-fonts: wrote ${file} (${buf.length} bytes)`);
    } catch (err) {
      console.warn(
        `fetch-fonts: WARN could not fetch ${file}: ${err.message}. The monospace fallback will be used.`,
      );
    }
  }
}

main().catch((err) => {
  console.warn(`fetch-fonts: WARN ${err.message}`);
  process.exit(0);
});
