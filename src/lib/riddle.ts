/**
 * The Black Door's riddle (The Elder Scrolls IV: Oblivion, Cheydinhal
 * Sanctuary): "What is the color of night?" — "Sanguine, my Brother." Answering
 * it unlocks the hidden Sanguine Atonement theme (INT-0022).
 *
 * Matching is deliberately forgiving: case, punctuation, spacing, and
 * diacritics are ignored, "sanguine" survives one typo, and the address that
 * follows may be any of a few forms of kin ("my Brother", "my Sister", …).
 * This is a flourish, not access control — the answer ships in the bundle.
 */

export type RiddleVerdict = 'accepted' | 'silence' | 'refused' | 'empty';

export const RIDDLE_QUESTION = 'What is the color of Night?';

/** The door's reply to each verdict. */
export const RIDDLE_RESPONSES: Record<RiddleVerdict, string> = {
  accepted: 'Welcome home.',
  // Skyrim's door asks a different question; it hears the answer, not the rite.
  silence: 'That is the music of life. This door asks of the night.',
  refused: 'The door does not open.',
  empty: 'The door awaits an answer.',
};

const KEY = 'sanguine';
const SILENCE = 'silence';
/** Words allowed after the key word: the address to a sibling of the Brotherhood. */
const KIN = new Set(['my', 'brother', 'sister', 'sibling', 'kin', 'friend', 'dear', 'o']);

/** Lowercase ASCII words, with diacritics and punctuation removed. */
export function answerWords(answer: string): string[] {
  return answer
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * Optimal-string-alignment distance: Levenshtein plus adjacent transposition,
 * so "sangiune" is one edit from "sanguine".
 */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
      }
    }
  }
  return d[a.length]![b.length]!;
}

/** Judge an answer to the riddle. */
export function matchRiddle(answer: string): RiddleVerdict {
  const words = answerWords(answer);
  if (words.length === 0) return 'empty';
  const [head, ...rest] = words as [string, ...string[]];
  const addressedToKin = rest.every((word) => KIN.has(word));
  if (addressedToKin && editDistance(head, KEY) <= 1) return 'accepted';
  if (addressedToKin && head === SILENCE) return 'silence';
  return 'refused';
}
