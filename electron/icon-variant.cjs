// Pure decision logic for which app-icon variant to show. Kept out of main.cjs
// (which pulls in electron) so it is unit-testable in isolation.

/** Valid explicit overrides; anything else means "follow the system theme". */
const OVERRIDES = new Set(['dark', 'light']);

/**
 * Choose the icon variant.
 *
 * @param {string|undefined} override        `TOME_ICON` — `dark` | `light` | `auto` (default).
 * @param {boolean}          systemPrefersDark  `nativeTheme.shouldUseDarkColors`.
 * @returns {'dark'|'light'} A forced variant, else the one matching the system theme.
 */
function resolveIconVariant(override, systemPrefersDark) {
  const o = String(override ?? '').trim().toLowerCase();
  if (OVERRIDES.has(o)) return o;
  return systemPrefersDark ? 'dark' : 'light';
}

/** Platform-correct icon filename for a variant (`.ico` on Windows, else `.png`). */
function iconBasename(variant, platform) {
  const ext = platform === 'win32' ? 'ico' : 'png';
  return `icon-${variant}.${ext}`;
}

module.exports = { resolveIconVariant, iconBasename };
