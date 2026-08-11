/**
 * Map an mdBook chapter link (`intro.md`, `./ch1/one.md`, `README.md`) to a
 * Tome route slug and URL. Shared by the sidebar (link targets) and the route
 * generator so both agree on the same mapping.
 */

/**
 * `./ch1/one.md` → `ch1/one`; a root/section `README`/`index` → its folder.
 * Segments are normalized so `.`/`..` can never escape the book root: a link
 * like `../secret.md` resolves without a leading `..`, so no generated route
 * points outside the book (external books may contain hostile links).
 */
export function hrefToSlug(href: string): string {
  let s = href.trim();
  s = s.replace(/#.*$/, ''); // drop any in-page anchor
  s = s.replace(/\.(md|markdown|html)$/i, ''); // drop the extension
  // A folder's README/index chapter is that folder's own page.
  s = s.replace(/(^|\/)(README|index)$/i, '$1');
  // Resolve path segments, collapsing `.`/`..` so the slug never escapes root.
  const parts: string[] = [];
  for (const segment of s.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return parts.join('/');
}

/** Route URL for a chapter link. The root chapter maps to `/`. */
export function chapterUrl(href: string): string {
  const slug = hrefToSlug(href);
  return slug === '' ? '/' : `/${slug}`;
}

/** Normalize an incoming route param (`undefined` at the index) to a slug. */
export function paramToSlug(param: string | undefined): string {
  if (!param) return '';
  return param.replace(/^\/+/, '').replace(/\/+$/, '');
}
