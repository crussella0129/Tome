import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import ReaderKeys from '../ReaderKeys';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

function key(el: Element, k: string, opts: KeyboardEventInit = {}) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...opts }));
}

describe('ReaderKeys', () => {
  // T-027 clause 1
  it('test_reader_keys_navigates: arrows / j·k move to next & previous', () => {
    const navigate = vi.fn();
    render(() => <ReaderKeys prevUrl="/a" nextUrl="/b" navigate={navigate} />);

    key(document.body, 'ArrowRight');
    expect(navigate).toHaveBeenLastCalledWith('/b');
    key(document.body, 'j');
    expect(navigate).toHaveBeenLastCalledWith('/b');
    key(document.body, 'ArrowLeft');
    expect(navigate).toHaveBeenLastCalledWith('/a');
    key(document.body, 'k');
    expect(navigate).toHaveBeenLastCalledWith('/a');
  });

  it('test_reader_keys_navigates: an absent neighbour is a no-op', () => {
    const navigate = vi.fn();
    render(() => <ReaderKeys nextUrl="/b" navigate={navigate} />); // no prevUrl
    key(document.body, 'ArrowLeft');
    expect(navigate).not.toHaveBeenCalled();
  });

  // T-027 clause 2
  it('test_reader_keys_guarded: inputs, modifiers, and an open dialog suppress nav', () => {
    const navigate = vi.fn();
    render(() => <ReaderKeys prevUrl="/a" nextUrl="/b" navigate={navigate} />);

    // Typing in a text field.
    const input = document.createElement('input');
    document.body.appendChild(input);
    key(input, 'ArrowRight');
    expect(navigate).not.toHaveBeenCalled();

    // A modifier held.
    key(document.body, 'ArrowRight', { ctrlKey: true });
    expect(navigate).not.toHaveBeenCalled();

    // A modal dialog is open.
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    key(document.body, 'ArrowRight');
    expect(navigate).not.toHaveBeenCalled();
  });
});
