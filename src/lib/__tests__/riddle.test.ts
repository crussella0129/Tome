import { describe, it, expect } from 'vitest';
import { matchRiddle, editDistance, answerWords, RIDDLE_RESPONSES } from '../riddle';

// INT-0022 AC2 — tolerant matching of the Black Door's answer.
describe('matchRiddle', () => {
  it.each([
    'Sanguine',
    'Sanguine, my Brother',
    'Sanguine, my Brother.',
    'sanguine my brother',
    'Sanguine, my Sister',
    'SANGUINE!',
    '  sanguine  ',
    'Sanguíne',
    'sanguin', // one deletion
    'sangiune', // one transposition
    'sanguine, o my brother',
  ])('test_riddle_accepts_variants: %j', (answer) => {
    expect(matchRiddle(answer)).toBe('accepted');
  });

  it.each(['red', 'blood', 'crimson', 'sanguine is a colour', 'my brother', 'sangria', 'black'])(
    'test_riddle_refuses_unrelated: %j',
    (answer) => {
      expect(matchRiddle(answer)).toBe('refused');
    },
  );

  it('test_riddle_silence_and_empty: Skyrim gets a nod; nothing gets a prompt', () => {
    expect(matchRiddle('Silence, my brother')).toBe('silence');
    expect(matchRiddle('silence')).toBe('silence');
    expect(matchRiddle('  ,. ')).toBe('empty');
    expect(matchRiddle('')).toBe('empty');
  });

  it('gives each verdict its own reply', () => {
    expect(RIDDLE_RESPONSES.accepted).toBe('Welcome home.');
    expect(RIDDLE_RESPONSES.refused).toBe('The door does not open.');
    expect(new Set(Object.values(RIDDLE_RESPONSES)).size).toBe(4);
  });
});

describe('riddle helpers', () => {
  it('normalizes to plain lowercase words', () => {
    expect(answerWords('Sanguíne, my—Brother!')).toEqual(['sanguine', 'my', 'brother']);
  });

  it('counts an adjacent transposition as one edit', () => {
    expect(editDistance('sanguine', 'sanguine')).toBe(0);
    expect(editDistance('sangiune', 'sanguine')).toBe(1);
    expect(editDistance('sanguin', 'sanguine')).toBe(1);
    expect(editDistance('sangria', 'sanguine')).toBeGreaterThan(1);
  });
});
