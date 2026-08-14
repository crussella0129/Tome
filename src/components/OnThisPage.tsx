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
    if (props.headings.length === 0 || typeof IntersectionObserver !== 'function') return;

    const recompute = () => {
      const tops = props.headings.map((h) => {
        const el = document.getElementById(h.slug);
        return el ? el.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
      });
      setActive(activeHeadingSlug(props.headings, tops));
    };

    // Fire as headings cross the top band of the viewport; recompute from live
    // positions so scrolling within a long section still resolves correctly.
    const observer = new IntersectionObserver(recompute, {
      rootMargin: '0px 0px -85% 0px',
    });
    for (const h of props.headings) {
      const el = document.getElementById(h.slug);
      if (el) observer.observe(el);
    }
    recompute();
    onCleanup(() => observer.disconnect());
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
