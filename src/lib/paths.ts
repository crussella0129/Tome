/**
 * Map an mdBook chapter link (`intro.md`, `./ch1/one.md`, `README.md`) to a
 * Tome route slug and URL. Shared by the sidebar (link targets) and the route
 * generator so both agree on the same mapping.
 */

/** `./ch1/one.md` → `ch1/one`; a root/section `README`/`index` → its folder. */
export function hrefToSlug(href: string): string {
  let s = href.trim();
  s = s.replace(/^\.\//, '').replace(/^\/+/, '');
  s = s.replace(/#.*$/, ''); // drop any in-page anchor
  s = s.replace(/\.(md|markdown|html)$/i, '');
  // A folder's README/index chapter is that folder's own page.
  s = s.replace(/(^|\/)(README|index)$/i, '$1');
  s = s.replace(/\/+$/, '');
  return s;
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
