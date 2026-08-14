// @ts-check
import { defineConfig } from 'astro/config';
import { join } from 'node:path';
import solid from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';
import { resolveBookSource, syncPath } from './scripts/book-source.mjs';
import { prepareChapterParentAssets } from './scripts/parent-assets.mjs';

const LIB_DEST = 'src/content/books';

/**
 * Dev-only live reload for an external `TOME_BOOK`: watch the book's source and
 * re-sync changed files into its `src/content/books/<slug>/` dir so edits appear
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
          const resolved = await resolveBookSource(bookRoot);
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
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
