import {
  createSignal,
  createMemo,
  createEffect,
  onMount,
  onCleanup,
  For,
  Show,
} from 'solid-js';
import { search, type SearchHit } from '../lib/search';
import type { SearchRecord } from '../lib/search-index';
import styles from './SearchOverlay.module.css';

interface SearchOverlayProps {
  /** Injected records bypass the lazy fetch (used by tests). Production omits it. */
  records?: SearchRecord[];
}

const INDEX_URL = `${import.meta.env.BASE_URL ?? '/'}search-index.json`;

/**
 * Library-wide search: a visible trigger + a `/`-key shortcut open a focus-trapped
 * dialog that ranks results (via the pure `search`) and links into each chapter's
 * adaptive URL, deep-linking to the matching heading. The index is fetched lazily
 * on first open, so a page ships no search data until the reader asks for it.
 */
export default function SearchOverlay(props: SearchOverlayProps) {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal('');
  const [records, setRecords] = createSignal<SearchRecord[]>(props.records ?? []);
  const [loaded, setLoaded] = createSignal(props.records != null);
  const [active, setActive] = createSignal(0);

  let inputEl: HTMLInputElement | undefined;
  let triggerEl: HTMLButtonElement | undefined;
  let dialogEl: HTMLDivElement | undefined;

  const results = createMemo<SearchHit[]>(() => (open() ? search(query(), records()) : []));

  const loadIndex = async () => {
    if (loaded()) return;
    try {
      const res = await fetch(INDEX_URL);
      setRecords((await res.json()) as SearchRecord[]);
    } catch {
      setRecords([]);
    } finally {
      setLoaded(true);
    }
  };

  const openOverlay = () => {
    setOpen(true);
    void loadIndex();
  };
  const closeOverlay = () => {
    setOpen(false);
    setQuery('');
    setActive(0);
    triggerEl?.focus();
  };

  // Focus the query input when the overlay opens. This runs as a user effect,
  // after Solid's render effect (the `<Show>`) has mounted + connected the input.
  createEffect(() => {
    if (open()) inputEl?.focus();
  });

  // Keep the active option in range as results change.
  createEffect(() => {
    const n = results().length;
    if (active() > n - 1) setActive(n > 0 ? n - 1 : 0);
  });

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return; // don't hijack "/" while the reader is typing
      }
      e.preventDefault();
      openOverlay();
    };
    document.addEventListener('keydown', onKey);
    // Deterministic hydration signal (used by the E2E to avoid the idle race).
    document.documentElement.dataset.searchReady = 'true';
    onCleanup(() => document.removeEventListener('keydown', onKey));
  });

  const onInputKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeOverlay();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results().length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const hit = results()[active()];
      if (hit) {
        e.preventDefault();
        window.location.assign(hit.url);
      }
    }
  };

  // Focus trap: Tab cycles within the dialog.
  const onDialogKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogEl) return;
    const focusables = dialogEl.querySelectorAll<HTMLElement>(
      'a[href], button, input, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div class={styles.root}>
      <button
        ref={(el) => (triggerEl = el)}
        type="button"
        class={`${styles.trigger} transition-token`}
        onClick={openOverlay}
        aria-haspopup="dialog"
        aria-keyshortcuts="/"
      >
        <span aria-hidden="true" class={styles.triggerIcon}>⌕</span>
        <span class={styles.triggerLabel}>Search the library</span>
        <kbd class={styles.kbd}>/</kbd>
      </button>

      <Show when={open()}>
        <div class={styles.backdrop} onClick={closeOverlay}>
          <div
            ref={(el) => (dialogEl = el)}
            class={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Search the library"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onDialogKey}
          >
            <div class={styles.field}>
              <span aria-hidden="true" class={styles.fieldIcon}>⌕</span>
              <input
                ref={(el) => (inputEl = el)}
                class={styles.input}
                type="text"
                placeholder="Search chapters, headings, text…"
                value={query()}
                onInput={(e) => {
                  setQuery(e.currentTarget.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                role="combobox"
                aria-expanded={results().length > 0 ? 'true' : 'false'}
                aria-controls="tome-search-results"
                aria-activedescendant={
                  results().length ? `tome-search-opt-${active()}` : undefined
                }
                autocomplete="off"
                spellcheck={false}
              />
              <button
                type="button"
                class={styles.close}
                onClick={closeOverlay}
                aria-label="Close search"
              >
                ×
              </button>
            </div>

            <Show
              when={query().trim().length > 0}
              fallback={
                <p class={styles.hint}>Search every tome — titles, headings, and text.</p>
              }
            >
              <Show
                when={results().length > 0}
                fallback={<p class={styles.empty}>No matches for “{query().trim()}”.</p>}
              >
                <ul
                  id="tome-search-results"
                  class={styles.results}
                  role="listbox"
                  aria-label="Search results"
                >
                  <For each={results()}>
                    {(hit, i) => (
                      <li role="option" id={`tome-search-opt-${i()}`} aria-selected={i() === active()}>
                        <a
                          class={styles.result}
                          classList={{ [styles.resultActive!]: i() === active() }}
                          href={hit.url}
                          onMouseEnter={() => setActive(i())}
                        >
                          <span class={styles.resultTitle}>{hit.record.chapterTitle}</span>
                          <Show when={hit.heading}>
                            <span class={styles.resultHeading}>{hit.heading!.text}</span>
                          </Show>
                          <span class={styles.resultTome}>{hit.record.tomeTitle}</span>
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
