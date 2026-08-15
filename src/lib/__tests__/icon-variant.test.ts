import { describe, it, expect } from 'vitest';
import { resolveIconVariant, iconBasename } from '../../../electron/icon-variant.cjs';

describe('resolveIconVariant', () => {
  it('follows the system theme when no override is set', () => {
    expect(resolveIconVariant('auto', true)).toBe('dark');
    expect(resolveIconVariant('auto', false)).toBe('light');
    expect(resolveIconVariant(undefined, true)).toBe('dark');
    expect(resolveIconVariant(undefined, false)).toBe('light');
  });

  it('an explicit override wins over the system theme', () => {
    expect(resolveIconVariant('dark', false)).toBe('dark');
    expect(resolveIconVariant('light', true)).toBe('light');
  });

  it('override matching is case/space-insensitive', () => {
    expect(resolveIconVariant('  DARK ', false)).toBe('dark');
    expect(resolveIconVariant('Light', true)).toBe('light');
  });

  it('an unrecognized override falls back to the system theme', () => {
    expect(resolveIconVariant('sepia', true)).toBe('dark');
    expect(resolveIconVariant('', false)).toBe('light');
  });
});

describe('iconBasename', () => {
  it('uses .ico on Windows and .png elsewhere', () => {
    expect(iconBasename('dark', 'win32')).toBe('icon-dark.ico');
    expect(iconBasename('light', 'win32')).toBe('icon-light.ico');
    expect(iconBasename('dark', 'linux')).toBe('icon-dark.png');
    expect(iconBasename('light', 'darwin')).toBe('icon-light.png');
  });
});
