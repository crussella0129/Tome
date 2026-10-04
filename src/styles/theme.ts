/**
 * Canonical colour values for Tome's shipped themes.
 *
 * These mirror the `--theme-background` / `--theme-text` tokens defined per
 * `body.theme-*` selector in `tokens.css`. `tokens.css` is the runtime source
 * of truth for the whole `--theme-*` surface; this module is the *documented*
 * contract for the reader-critical pair (page ground + body ink) and the input
 * to the WCAG-contrast unit test. The `test_paper_theme_active` /
 * `test_dark_theme_active` E2E checks guard against drift between the two.
 */

export interface ThemeColors {
  /** The `body` class that activates this theme. */
  readonly className: string;
  /** Human-facing label. */
  readonly label: string;
  /** `--theme-background` — the page ground. */
  readonly background: string;
  /** `--theme-text` — body ink. */
  readonly text: string;
  /** Hidden themes are reached through the "Other" rite, never listed. */
  readonly hidden?: boolean;
}

export const INK_PAPER: ThemeColors = {
  className: 'theme-ink-paper',
  label: 'Ink on old paper',
  background: '#f3e9d2',
  text: '#2b2018',
};

export const TERMINAL_DARK: ThemeColors = {
  className: 'theme-terminal-dark',
  label: 'Terminal (dark)',
  background: '#16130e',
  text: '#e8dcc2',
};

/**
 * Blood letters cut into obsidian (INT-0022), unlocked by answering the Black
 * Door's riddle. `text` is the interface ink (bone); chapter text is the
 * crimson inscription in SANGUINE_ROLES, set large enough for large-text AA.
 */
export const SANGUINE_ATONEMENT: ThemeColors = {
  className: 'theme-sanguine-atonement',
  label: 'Sanguine Atonement',
  background: '#0a0708',
  text: '#cbb5ab',
  hidden: true,
};

/**
 * Sanguine Atonement's role colours and the bounds of its obsidian surface,
 * mirrored from `tokens.css` / `sanguine.css`. The contrast test checks every
 * role against each surface, including the brightest tone the texture can
 * reach (`sheen`, from compositing `surface.highlight` at `surface.opacity`
 * plus the candle glow over the page).
 *
 * Interface roles (`text`, `subdued`, `link`, `accent`) meet normal-text AA.
 * The inscription roles are hue-true blood with no green/blue lift, so they
 * meet AA only as large text: chapter prose is set at `inscriptionPx` or more.
 */
export const SANGUINE_ROLES = {
  surfaces: { page: '#0a0708', panel: '#110b0c', input: '#170e0f' },
  text: '#cbb5ab',
  subdued: '#9d8a82',
  link: '#ff5c4d',
  accent: '#ff3030',
  /** The current-chapter row: `accent` text over its own tint on the panel. */
  accentTint: 0.15,
  inscription: '#d50210',
  inscriptionLink: '#ff3b2f',
  /** WCAG's large-text size for regular weight (18pt). */
  inscriptionPx: 24,
  /** Large carved letters fade from arterial to pooled; pooled is the darkest stop. */
  headingTop: '#ff2a1a',
  pooled: '#ba1a1a',
  surface: {
    /** The obsidian layer's brightest specular colour. */
    highlight: '#3a2a2c',
    /** `body::before` opacity in Sanguine. */
    opacity: 0.3,
    /** The candle glow at its strongest. */
    glow: '#ff3c28',
    glowAlpha: 0.03,
  },
} as const;

/** Every theme Tome ships, in display order. Default is the first. */
export const THEMES: readonly ThemeColors[] = [INK_PAPER, TERMINAL_DARK, SANGUINE_ATONEMENT];

export const DEFAULT_THEME = INK_PAPER;

/**
 * The pre-paint restore table (`init-theme.astro`): every valid theme class
 * mapped to its page ground, for `<meta name="theme-color">`.
 */
export const PREPAINT_THEMES: Readonly<Record<string, string>> = Object.fromEntries(
  THEMES.map((theme) => [theme.className, theme.background]),
);

/** Parse a `#rrggbb` (or `#rgb`) string into 0–255 channels. */
export function parseHex(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Not a hex colour: ${hex}`);
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Relative luminance per WCAG 2.1, from a `#rrggbb` string. */
export function relativeLuminance(hex: string): number {
  const channels = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = channels as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two `#rrggbb` colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA threshold for normal-size body text. */
export const WCAG_AA_NORMAL = 4.5;
