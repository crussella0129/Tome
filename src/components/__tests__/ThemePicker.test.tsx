import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@solidjs/testing-library';
import ThemePicker, { WELCOME_MS, POUR_MS, DRAIN_MS } from '../ThemePicker';
import { INK_PAPER, TERMINAL_DARK, SANGUINE_ATONEMENT } from '../../styles/theme';
import { THEME_STORAGE_KEY } from '../../lib/theme-state';

beforeEach(() => {
  document.body.className = INK_PAPER.className;
  document.querySelectorAll('[data-sanguine-wash]').forEach((node) => node.remove());
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const radio = (name: string) => screen.getByRole('radio', { name });

function openDoor() {
  render(() => <ThemePicker />);
  fireEvent.click(radio('Other…'));
  return screen.getByRole('dialog');
}

function answer(text: string) {
  const field = screen.getByLabelText('Your answer') as HTMLInputElement;
  fireEvent.input(field, { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Answer' }));
}

// INT-0022 AC1 — Light and Dark switch at once; the radios report the choice.
describe('ThemePicker', () => {
  it('test_theme_picker_switches_directly: Light/Dark set class + storage; aria-checked follows', () => {
    render(() => <ThemePicker />);
    expect(screen.getByRole('radiogroup', { name: 'Colour theme' })).toBeInTheDocument();
    expect(radio('Light')).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(radio('Dark'));
    expect(document.body).toHaveClass(TERMINAL_DARK.className);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(TERMINAL_DARK.className);
    expect(radio('Dark')).toHaveAttribute('aria-checked', 'true');
    expect(radio('Light')).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(radio('Light'));
    expect(document.body).toHaveClass(INK_PAPER.className);
    expect(document.body).not.toHaveClass(TERMINAL_DARK.className);
  });

  it('test_theme_picker_other_opens_dialog: a labelled modal asks the question; the answer field has focus', () => {
    const dialog = openDoor();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('What is the color of Night?');
    expect(document.activeElement).toBe(screen.getByLabelText('Your answer'));
    // Opening the door alone changes nothing.
    expect(document.body).toHaveClass(INK_PAPER.className);
  });

  it('test_riddle_input_attributes: no auto-capitalize, auto-correct, or spellcheck', () => {
    openDoor();
    const field = screen.getByLabelText('Your answer');
    expect(field).toHaveAttribute('autocapitalize', 'off');
    expect(field).toHaveAttribute('autocorrect', 'off');
    expect(field).toHaveAttribute('spellcheck', 'false');
    expect(field).toHaveAttribute('autocomplete', 'off');
  });

  it('test_riddle_dialog_outcomes: refused and Silence keep the theme; the answer opens the door', () => {
    vi.useFakeTimers();
    openDoor();

    answer('crimson');
    expect(screen.getByRole('status')).toHaveTextContent('The door does not open.');
    expect(document.body).toHaveClass(INK_PAPER.className);

    answer('Silence, my brother');
    expect(screen.getByRole('status')).toHaveTextContent('music of life');
    expect(document.body).toHaveClass(INK_PAPER.className);

    answer('Sanguine, my Brother');
    expect(screen.getByRole('status')).toHaveTextContent('Welcome home.');
    vi.advanceTimersByTime(WELCOME_MS + POUR_MS + 400);
    expect(document.body).toHaveClass(SANGUINE_ATONEMENT.className);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(SANGUINE_ATONEMENT.className);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(radio('Other…')).toHaveAttribute('aria-checked', 'true');
  });

  it('test_riddle_dialog_escape_restores_focus: Escape and Leave close and refocus Other', () => {
    const dialog = openDoor();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(radio('Other…'));

    fireEvent.click(radio('Other…'));
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(radio('Other…'));
    expect(document.body).toHaveClass(INK_PAPER.className);
  });

  it('test_riddle_dialog_focus_trap: Tab wraps within the dialog', () => {
    const dialog = openDoor();
    const field = screen.getByLabelText('Your answer');
    const submit = screen.getByRole('button', { name: 'Answer' });

    submit.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(field);

    field.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(submit);
  });

  it('moves focus with arrow keys without choosing', () => {
    render(() => <ThemePicker />);
    radio('Light').focus();
    fireEvent.keyDown(radio('Light'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radio('Dark'));
    fireEvent.keyDown(radio('Dark'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radio('Other…'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body).toHaveClass(INK_PAPER.className);
  });

  it('test_theme_picker_wash_covers_then_clears: the theme changes beneath the wash, which then leaves', () => {
    vi.useFakeTimers();
    openDoor();
    answer('sanguine');
    vi.advanceTimersByTime(WELCOME_MS + 10);
    const wash = document.querySelector('[data-sanguine-wash]');
    expect(wash).not.toBeNull();
    expect(wash).toHaveAttribute('aria-hidden', 'true');
    expect(document.body).not.toHaveClass(SANGUINE_ATONEMENT.className); // still pouring
    vi.advanceTimersByTime(POUR_MS + 400);
    expect(document.body).toHaveClass(SANGUINE_ATONEMENT.className); // changed under cover
    vi.advanceTimersByTime(DRAIN_MS + 400);
    expect(document.querySelector('[data-sanguine-wash]')).toBeNull();
  });

  it('test_theme_picker_reduced_motion_skips_wash: the theme applies with no overlay', () => {
    vi.useFakeTimers();
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    try {
      openDoor();
      answer('Sanguine, my Sister');
      vi.advanceTimersByTime(WELCOME_MS + 10);
      expect(document.body).toHaveClass(SANGUINE_ATONEMENT.className);
      expect(document.querySelector('[data-sanguine-wash]')).toBeNull();
    } finally {
      window.matchMedia = original;
    }
  });
});
