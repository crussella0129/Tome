import {
  createSignal,
  createEffect,
  createUniqueId,
  onMount,
  onCleanup,
  For,
  Show,
} from 'solid-js';
import { Portal } from 'solid-js/web';
import { INK_PAPER, TERMINAL_DARK, SANGUINE_ATONEMENT, DEFAULT_THEME } from '../styles/theme';
import { applyTheme, appliedTheme, themeByClass, THEME_CHANGE_EVENT } from '../lib/theme-state';
import { matchRiddle, RIDDLE_QUESTION, RIDDLE_RESPONSES, type RiddleVerdict } from '../lib/riddle';
import styles from './ThemePicker.module.css';

/** How long the door's "Welcome home." stays up before the rite completes. */
export const WELCOME_MS = 900;

type Choice = 'light' | 'dark' | 'other';

const CHOICES: { id: Choice; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'other', label: 'Other…' },
];

/** Which segment a theme class lights up: hidden themes all live under Other. */
function choiceFor(className: string): Choice {
  if (className === TERMINAL_DARK.className) return 'dark';
  if (className === INK_PAPER.className) return 'light';
  return 'other';
}

/**
 * The colour-theme selector: Light · Dark · Other. Light and Dark switch at
 * once; Other opens the Black Door's riddle, and only its answer reveals the
 * hidden Sanguine Atonement theme (INT-0022). A radiogroup with roving focus —
 * arrows move focus, Enter/Space/click choose — so arrowing past Other never
 * springs the dialog by accident.
 */
export default function ThemePicker() {
  const [theme, setTheme] = createSignal(DEFAULT_THEME.className);
  const [open, setOpen] = createSignal(false);
  const [answer, setAnswer] = createSignal('');
  const [verdict, setVerdict] = createSignal<RiddleVerdict | null>(null);
  const ids = { question: createUniqueId(), answer: createUniqueId(), reply: createUniqueId() };
  const radios: HTMLButtonElement[] = [];
  let dialogEl: HTMLDivElement | undefined;
  let inputEl: HTMLInputElement | undefined;
  let welcomeTimer: ReturnType<typeof setTimeout> | undefined;

  const checked = () => choiceFor(theme());
  const label = () => themeByClass(theme())?.label ?? DEFAULT_THEME.label;

  onMount(() => {
    setTheme(appliedTheme());
    const sync = () => setTheme(appliedTheme());
    document.addEventListener(THEME_CHANGE_EVENT, sync);
    // Deterministic hydration signal for the E2E (avoids the client:idle race).
    document.documentElement.dataset.themeReady = 'true';
    onCleanup(() => {
      document.removeEventListener(THEME_CHANGE_EVENT, sync);
      clearTimeout(welcomeTimer);
    });
  });

  // Focus the answer field once the dialog has mounted.
  createEffect(() => {
    if (open()) inputEl?.focus();
  });

  const choose = (choice: Choice) => {
    if (choice === 'other') {
      setAnswer('');
      setVerdict(null);
      setOpen(true);
      return;
    }
    setTheme(
      applyTheme(choice === 'dark' ? TERMINAL_DARK.className : INK_PAPER.className).className,
    );
  };

  const close = () => {
    clearTimeout(welcomeTimer);
    setOpen(false);
    radios[2]?.focus();
  };

  const accept = () => {
    welcomeTimer = setTimeout(() => {
      setOpen(false);
      setTheme(applyTheme(SANGUINE_ATONEMENT.className).className);
      radios[2]?.focus();
    }, WELCOME_MS);
  };

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    if (verdict() === 'accepted') return; // the door is already opening
    const next = matchRiddle(answer());
    setVerdict(next);
    if (next === 'accepted') accept();
  };

  const onRadioKey = (e: KeyboardEvent, index: number) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) return;
    e.preventDefault();
    radios[(index + step + CHOICES.length) % CHOICES.length]?.focus();
  };

  // Escape leaves; Tab cycles within the dialog (the SearchOverlay pattern).
  const onDialogKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab' || !dialogEl) return;
    const focusables = dialogEl.querySelectorAll<HTMLElement>('button, input');
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
    <div class={styles.picker}>
      <div class={styles.group} role="radiogroup" aria-label="Colour theme">
        <For each={CHOICES}>
          {(choice, i) => (
            <button
              ref={(el) => (radios[i()] = el)}
              type="button"
              role="radio"
              class={`${styles.option} transition-token`}
              aria-checked={checked() === choice.id ? 'true' : 'false'}
              aria-haspopup={choice.id === 'other' ? 'dialog' : undefined}
              tabindex={checked() === choice.id ? 0 : -1}
              onKeyDown={(e) => onRadioKey(e, i())}
              onClick={() => choose(choice.id)}
            >
              {choice.label}
            </button>
          )}
        </For>
      </div>
      <p class={styles.current} aria-live="polite">
        {label()}
      </p>

      <Show when={open()}>
        <Portal>
          <div
            class={styles.backdrop}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div
              ref={dialogEl}
              class={styles.dialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby={ids.question}
              aria-describedby={ids.reply}
              onKeyDown={onDialogKey}
            >
              <h2 id={ids.question} class={styles.question}>
                {RIDDLE_QUESTION}
              </h2>
              <form class={styles.form} onSubmit={submit}>
                <label class={styles.visuallyHidden} for={ids.answer}>
                  Your answer
                </label>
                <input
                  ref={inputEl}
                  id={ids.answer}
                  class={styles.input}
                  type="text"
                  name="answer"
                  value={answer()}
                  onInput={(e) => setAnswer(e.currentTarget.value)}
                  autocomplete="off"
                  autocapitalize="off"
                  autocorrect="off"
                  spellcheck={false}
                  enterkeyhint="go"
                />
                <p
                  id={ids.reply}
                  class={styles.reply}
                  classList={{ [styles.welcome!]: verdict() === 'accepted' }}
                  role="status"
                >
                  {verdict() ? RIDDLE_RESPONSES[verdict()!] : ''}
                </p>
                <div class={styles.actions}>
                  <button type="button" class={`${styles.action} transition-token`} onClick={close}>
                    Leave
                  </button>
                  <button
                    type="submit"
                    class={`${styles.action} ${styles.primary} transition-token`}
                  >
                    Answer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
