// @ts-check
import { defineConfig } from 'astro/config';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import solid from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';
import { syncPath } from './scripts/book-source.mjs';
import { liveReloadNotice, resolveSource } from './scripts/document-source.mjs';
import { prepareChapterParentAssets } from './scripts/parent-assets.mjs';
import rehypeMath from './scripts/rehype-math.mjs';
import remarkAlerts from './scripts/remark-alerts.mjs';
import remarkMathDollars from './scripts/remark-math-dollars.mjs';

// The generated, git-ignored library (scripts/load-books.mjs publishes it); the
// committed sample at src/content/books/ is only ever read.
const LIB_DEST = 'src/content/library';

/**
 * Dev-only live reload for an external `TOME_BOOK`: watch the book's source and
 * re-sync changed files into its `src/content/library/<slug>/` dir so edits appear
 * in the reader without a restart. `astro:server:setup` fires only in `dev`, so
 * this has zero effect on `build`/prod.
 * @returns {import('astro').AstroIntegration}
 */
function tomeLiveReload() {
  return {
    name: 'tome-live-reload',
    hooks: {
      'astro:server:setup': async ({ server, logger }) => {
        const bookRoot = process.env.TOME_BOOK;
        if (!bookRoot) return;
        let root;
        let sourceDir;
        let dest;
        try {
          const resolved = await resolveSource(bookRoot);
          // A Markdown file, a Word document, or a folder of them (INT-0029) is
          // read and converted on its way into the library, so it is served but
          // not watched: say so, and add no watcher.
          if (resolved.kind !== 'book') {
            logger.info(liveReloadNotice(resolved) ?? 'live reload is off');
            return;
          }
          root = resolved.root;
          sourceDir = resolved.sourceDir;
          dest = join(LIB_DEST, resolved.slug);
        } catch (err) {
          logger.warn(`live reload disabled: ${err instanceof Error ? err.message : err}`);
          return;
        }
        const reload = async (/** @type {string} */ changed) => {
          try {
            const target = await syncPath(changed, sourceDir, dest);
            if (!target) return; // not under the book source
            // A synced chapter loses the build-time parent-asset rewrite, so
            // re-apply it (INT-0009) before reloading — else `../assets/x` 404s.
            if (/\.md(?:own)?$/i.test(target)) {
              await prepareChapterParentAssets({
                root,
                sourceDir,
                stagedTome: dest,
                sourceFile: changed,
                stagedFile: target,
              });
            }
            logger.info(`synced ${changed} → reloading`);
            const hot = server.hot ?? server.ws;
            hot?.send?.({ type: 'full-reload' });
          } catch (err) {
            logger.warn(`live reload sync failed: ${err instanceof Error ? err.message : err}`);
          }
        };
        server.watcher.add(sourceDir);
        server.watcher.on('change', reload);
        server.watcher.on('add', reload);
        server.watcher.on('unlink', reload);
        logger.info(`live reload watching ${sourceDir}`);
      },
    },
  };
}

// Static output: the chapter body is server-rendered HTML with zero JS by
// default; only the sidebar island hydrates. Tailwind v4 is wired through the
// Vite plugin (not a PostCSS step).
export default defineConfig({
  site: 'https://example.com',
  integrations: [solid(), tomeLiveReload()],
  markdown: {
    // Disable Shiki: it injects inline colours that would bypass the token
    // layer. Code renders as plain <pre><code>, styled monochrome in ink by
    // prose.css — the sacred / ink-on-paper look.
    syntaxHighlight: false,
    // GitHub-style admonitions (`> [!NOTE]` …) → titled sacred blocks; and
    // formulas, `$…$` and `$$…$$`, read by Tome's rule for dollar signs.
    remarkPlugins: [remarkAlerts, remarkMathDollars],
    // Each formula is laid out here, as the browser's own mathematics, so a
    // chapter's page holds the finished equation and no script.
    rehypePlugins: [rehypeMath],
  },
  vite: {
    plugins: [tailwindcss()],
    // Every library glob reads `@library/…`. Vitest maps the same alias to the
    // committed sample (vitest.config.ts), so tests never see a personal library.
    resolve: {
      alias: { '@library': fileURLToPath(new URL('./src/content/library', import.meta.url)) },
    },
  },
});
