import { createSignal, onMount, createEffect, For, Show, Switch, Match } from 'solid-js';
import type { BookToc, TocNode, ChapterNode } from '../lib/summary.types';
import { chapterUrlIn, hrefToSlug } from '../lib/paths';
import { THEMES, DEFAULT_THEME } from '../styles/theme';
import styles from './TocSidebar.module.css';

interface TocSidebarProps {
  toc: BookToc;
  activeSlug: string;
  bookTitle: string;
  /** Namespace prefix for chapter links; `''` in a single-tome library. */
  bookSlug?: string;
}

const THEME_CLASSES = THEMES.map((t) => t.className);
const NAV_STORAGE_KEY = 'tome-nav-open';
const THEME_STORAGE_KEY = 'tome-theme';

/** One chapter row: a link (or a plain label for drafts), indented by depth. */
function ChapterRow(props: {
  node: ChapterNode;
  activeSlug: string;
  bookSlug: string;
}) {
  const isCurrent = () =>
    !props.node.draft &&
    props.node.href !== undefined &&
    hrefToSlug(props.node.href) === props.activeSlug;

  return (
    <Show
      when={!props.node.draft && props.node.href !== undefined}
      fallback={
        <span
          class={styles.draft}
          style={{ '--toc-depth': String(props.node.depth) }}
        >
          {props.node.title}
        </span>
      }
    >
      <a
        class={styles.link}
        classList={{ [styles.current!]: isCurrent() }}
        href={chapterUrlIn(props.bookSlug, props.node.href!)}
        style={{ '--toc-depth': String(props.node.depth) }}
        aria-current={isCurrent() ? 'page' : undefined}
      >
        {props.node.title}
      </a>
    </Show>
  );
}

/** Recursively render a list of TOC nodes. */
function TocList(props: {
  nodes: TocNode[];
  activeSlug: string;
  bookSlug: string;
}) {
  return (
    <ul class={styles.list}>
      <For each={props.nodes}>
        {(node) => (
          <Switch>
            <Match when={node.kind === 'separator'}>
              <li class={styles.separator} role="separator" />
            </Match>
            <Match when={node.kind === 'part-title'}>
              <li class={styles.partTitle}>{(node as { title: string }).title}</li>
            </Match>
            <Match when={node.kind === 'chapter'}>
              <li class={styles.item}>
                <ChapterRow
                  node={node as ChapterNode}
                  activeSlug={props.activeSlug}
                  bookSlug={props.bookSlug}
                />
                <Show when={(node as ChapterNode).children.length > 0}>
                  <TocList
                    nodes={(node as ChapterNode).children}
                    activeSlug={props.activeSlug}
                    bookSlug={props.bookSlug}
                  />
                </Show>
              </li>
            </Match>
          </Switch>
        )}
      </For>
    </ul>
  );
}

export default function TocSidebar(props: TocSidebarProps) {
  // Default open so the SSR'd markup shows the nav (progressive enhancement:
  // links work with no JS). On mount we narrow to the drawer default on small
  // viewports.
  const [open, setOpen] = createSignal(true);
  const [theme, setTheme] = createSignal(DEFAULT_THEME.className);

  onMount(() => {
    // Enable drawer behaviour now that JS is running.
    document.body.classList.add('js-nav');

    // Sync the theme signal to whatever init-theme applied pre-paint.
    const applied = THEME_CLASSES.find((c) => document.body.classList.contains(c));
    if (applied) setTheme(applied);

    // On narrow screens the nav starts collapsed; a saved preference wins.
    const saved = localStorage.getItem(NAV_STORAGE_KEY);
    if (saved === 'true' || saved === 'false') {
      setOpen(saved === 'true');
    } else if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 48rem)').matches
    ) {
      setOpen(false);
    }
  });

  // Reflect open-state onto the body so the static layout CSS can respond.
  createEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('tome-nav-open', open());
    try {
      localStorage.setItem(NAV_STORAGE_KEY, String(open()));
    } catch {
      /* storage may be unavailable; non-fatal */
    }
  });

  // Apply theme changes to the body and persist them.
  createEffect(() => {
    if (typeof document === 'undefined') return;
    const next = theme();
    document.body.classList.remove(...THEME_CLASSES);
    document.body.classList.add(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* non-fatal */
    }
  });

  const toggleOpen = () => setOpen((v) => !v);
  const cycleTheme = () => {
    const i = THEME_CLASSES.indexOf(theme());
    setTheme(THEME_CLASSES[(i + 1) % THEME_CLASSES.length]!);
  };
  const currentThemeLabel = () =>
    THEMES.find((t) => t.className === theme())?.label ?? DEFAULT_THEME.label;

  return (
    <nav
      class={styles.sidebar}
      classList={{ [styles.open!]: open() }}
      aria-label="Table of contents"
      data-open={open() ? 'true' : 'false'}
    >
      <div class={styles.header}>
        <a class={styles.brand} href={props.bookSlug ? `/${props.bookSlug}` : '/'}>
          {props.bookTitle}
        </a>
        <button
          type="button"
          class={`${styles.iconButton} transition-token`}
          aria-label="Toggle table of contents"
          aria-expanded={open() ? 'true' : 'false'}
          onClick={toggleOpen}
        >
          <span aria-hidden="true">{open() ? '×' : '≡'}</span>
        </button>
      </div>

      <div class={styles.scroll}>
        <TocList
          nodes={props.toc.nodes}
          activeSlug={props.activeSlug}
          bookSlug={props.bookSlug ?? ''}
        />
      </div>

      <div class={styles.footer}>
        <button
          type="button"
          class={`${styles.themeButton} transition-token`}
          aria-label="Switch colour theme"
          onClick={cycleTheme}
        >
          <span aria-hidden="true">◑</span>
          <span>{currentThemeLabel()}</span>
        </button>
      </div>
    </nav>
  );
}
