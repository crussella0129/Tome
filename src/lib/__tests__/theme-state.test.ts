import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme, appliedTheme, THEME_STORAGE_KEY, THEME_CHANGE_EVENT } from '../theme-state';
import {
  THEMES,
  PREPAINT_THEMES,
  INK_PAPER,
  TERMINAL_DARK,
  SANGUINE_ATONEMENT,
} from '../../styles/theme';

beforeEach(() => {
  document.body.className = INK_PAPER.className;
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  localStorage.clear();
});

// INT-0022 AC1/AC6 — one place applies, persists, and announces a theme.
describe('applyTheme', () => {
  it('test_theme_state_syncs_meta: sets exactly one theme class, storage, and theme-color', () => {
    const seen: string[] = [];
    document.addEventListener(THEME_CHANGE_EVENT, (e) =>
      seen.push((e as CustomEvent<string>).detail),
    );

    applyTheme(TERMINAL_DARK.className);
    expect(document.body.classList.contains(TERMINAL_DARK.className)).toBe(true);
    expect(document.body.classList.contains(INK_PAPER.className)).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(TERMINAL_DARK.className);
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      TERMINAL_DARK.background,
    );

    applyTheme(SANGUINE_ATONEMENT.className);
    const applied = THEMES.filter((t) => document.body.classList.contains(t.className));
    expect(applied).toEqual([SANGUINE_ATONEMENT]);
    expect(appliedTheme()).toBe(SANGUINE_ATONEMENT.className);
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(seen).toEqual([TERMINAL_DARK.className, SANGUINE_ATONEMENT.className]);
  });

  it('falls back to the default theme for an unknown class', () => {
    expect(applyTheme('theme-nonexistent').className).toBe(INK_PAPER.className);
    expect(appliedTheme()).toBe(INK_PAPER.className);
  });
});

describe('pre-paint restore table', () => {
  it('test_init_theme_valid_classes: derived from THEMES, including the hidden theme', () => {
    expect(Object.keys(PREPAINT_THEMES)).toEqual(THEMES.map((t) => t.className));
    expect(PREPAINT_THEMES[SANGUINE_ATONEMENT.className]).toBe(SANGUINE_ATONEMENT.background);
    expect(SANGUINE_ATONEMENT.hidden).toBe(true);
  });
});
