import type { APIRoute } from 'astro';
import { books } from '../lib/book';
import { buildSearchIndex } from '../lib/search-index';

// Every chapter's raw Markdown, eagerly imported for the build-time index. Keys
// are the library's `/src/content/library/<tome>/<file>.md`, matching
// `isContentKeyFor`.
const rawByKey = import.meta.glob('@library/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Prerender to a static `/search-index.json` in the build (the reader fetches it
// lazily on first search; it is never inlined into page HTML).
export const prerender = true;

export const GET: APIRoute = () => {
  const index = buildSearchIndex(books(), rawByKey);
  return new Response(JSON.stringify(index), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
