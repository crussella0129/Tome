import { onMount, onCleanup } from 'solid-js';

interface ReaderKeysProps {
  /** Adaptive URL of the previous chapter, if any. */
  prevUrl?: string;
  /** Adaptive URL of the next chapter, if any. */
  nextUrl?: string;
  /** Navigation, injectable for tests; defaults to a real page navigation. */
  navigate?: (url: string) => void;
}

/**
 * Keyboard chapter navigation (INT-0010): `ArrowRight`/`j` → next chapter,
 * `ArrowLeft`/`k` → previous. A behavior-only island (renders nothing). It stands
 * down while the reader is typing in a field or a modal dialog (e.g. the search
 * overlay) is open, and ignores modified/composing key presses.
 */
export default function ReaderKeys(props: ReaderKeysProps) {
  onMount(() => {
    const go = (url: string) =>
      props.navigate ? props.navigate(url) : window.location.assign(url);

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.isComposing) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) return; // a modal is open

      if (e.key === 'ArrowRight' || e.key === 'j') {
        if (props.nextUrl) {
          e.preventDefault();
          go(props.nextUrl);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        if (props.prevUrl) {
          e.preventDefault();
          go(props.prevUrl);
        }
      }
    };

    document.addEventListener('keydown', onKey);
    onCleanup(() => document.removeEventListener('keydown', onKey));
  });

  return null;
}
