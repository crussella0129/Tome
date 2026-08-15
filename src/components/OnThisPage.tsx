import { createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import styles from './OnThisPage.module.css';

/** A chapter section heading, as Astro's `getHeadings()` returns it. */
export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

/**
 * The active section slug given each heading's viewport `top` (px): the last
 * heading at or above `offset`, or the first heading when all are still below
 * (top of the chapter). Pure — unit-tested without a DOM.
 */
export function activeHeadingSlug(
  headings: Heading[],
  tops: number[],
  offset = 96,
): string | undefined {
  let active = headings[0]?.slug;
  for (let i = 0; i < headings.length; i++) {
    if (tops[i]! <= offset) active = headings[i]!.slug;
  }
  return active;
}

interface OnThisPageProps {
  headings: Heading[];
}

/**
 * The "on this page" rail: the chapter's H2/H3 headings as anchor links
 * (server-rendered, so they work with no JS), with the section in view marked
 * `aria-current` as the reader scrolls (the only client JS, via an
 * `IntersectionObserver` that re-derives the active heading with
 * {@link activeHeadingSlug}).
 */
export default function OnThisPage(props: OnThisPageProps) {
  const [active, setActive] = createSignal<string | undefined>(props.headings[0]?.slug);

  onMount(() => {
    if (props.headings.length === 0 || typeof window === 'undefined') return;

    let ticking = false;
    const recompute = () => {
      ticking = false;
      const tops = props.headings.map((h) => {
        const el = document.getElementById(h.slug);
        return el ? el.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
      });
      setActive(activeHeadingSlug(props.headings, tops));
    };
    // A passive scroll listener, throttled to one recompute per frame, reliably
    // re-derives the active section from live positions (an IntersectionObserver
    // misses fast jump-scrolls that skip a thin trigger band). No motion.
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(recompute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    recompute();
    // Deterministic hydration signal (used by the E2E scroll-sync check).
    document.documentElement.dataset.onThisPage = 'true';
    onCleanup(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
  });

  return (
    <Show when={props.headings.length > 0}>
      <nav class={styles.rail} aria-label="On this page">
        <p class={styles.label}>On this page</p>
        <ul class={styles.list}>
          <For each={props.headings}>
            {(heading) => (
              <li>
                <a
                  class={styles.link}
                  classList={{ [styles.active!]: active() === heading.slug }}
                  style={{ '--otp-depth': String(Math.max(0, heading.depth - 2)) }}
                  href={`#${heading.slug}`}
                  aria-current={active() === heading.slug ? 'true' : undefined}
                >
                  {heading.text}
                </a>
              </li>
            )}
          </For>
        </ul>
      </nav>
    </Show>
  );
}
