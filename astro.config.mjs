// @ts-check
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';

// Static output: the chapter body is server-rendered HTML with zero JS by
// default; only the sidebar island hydrates. Tailwind v4 is wired through the
// Vite plugin (not a PostCSS step).
export default defineConfig({
  site: 'https://example.com',
  integrations: [solid()],
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
