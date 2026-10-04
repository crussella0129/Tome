import { THEMES, DEFAULT_THEME, type ThemeColors } from '../styles/theme';

/**
 * The one place a theme is applied in the browser: swap the `body.theme-*`
 * class, persist the choice for the pre-paint restore (`init-theme.astro`), and
 * keep the browser chrome (`<meta name="theme-color">`) in the theme's ground.
 */

export const THEME_STORAGE_KEY = 'tome-theme';
/** Dispatched on `document` after a theme is applied, so every picker agrees. */
export const THEME_CHANGE_EVENT = 'tome:themechange';

export const THEME_CLASSES: readonly string[] = THEMES.map((t) => t.className);

export function themeByClass(className: string | null | undefined): ThemeColors | undefined {
  return THEMES.find((t) => t.className === className);
}

/** The theme class currently on `body` (the default when none is). */
export function appliedTheme(doc: Document = document): string {
  return THEME_CLASSES.find((c) => doc.body.classList.contains(c)) ?? DEFAULT_THEME.className;
}

/** Point `<meta name="theme-color">` at the theme's page ground. */
export function syncThemeColor(theme: ThemeColors, doc: Document = document): void {
  let meta = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = doc.createElement('meta');
    meta.name = 'theme-color';
    doc.head.appendChild(meta);
  }
  meta.content = theme.background;
}

/** Apply, persist, and announce a theme. Unknown classes fall back to the default. */
export function applyTheme(className: string, doc: Document = document): ThemeColors {
  const theme = themeByClass(className) ?? DEFAULT_THEME;
  doc.body.classList.remove(...THEME_CLASSES);
  doc.body.classList.add(theme.className);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.className);
  } catch {
    /* storage may be unavailable; the theme still applies for this page */
  }
  syncThemeColor(theme, doc);
  doc.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme.className }));
  return theme;
}

/** True when the reader asked the OS for reduced motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
