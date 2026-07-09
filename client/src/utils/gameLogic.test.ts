import { describe, test, expect } from 'bun:test';
import { dropOnSlot, autoFillRemaining } from './gameLogic';

interface TestFact {
  id: number;
  question: string;
}

const A: TestFact = { id: 1, question: 'A' };
const B: TestFact = { id: 2, question: 'B' };
const C: TestFact = { id: 3, question: 'C' };

describe('dropOnSlot', () => {
  test('places a card from the stack into an empty slot and advances the stack', () => {
    const result = dropOnSlot({
      sortedAnswers: [null, null],
      facts: [A, B],
      currentIndex: 0,
      dragItem: A,
      dragSource: 'stack',
      slotIndex: 0,
      hardcore: false,
    });

    expect(result.sortedAnswers).toEqual([A, null]);
    expect(result.currentIndex).toBe(1);
    expect(result.facts).toEqual([A, B]);
  });

  test('swaps a card from the stack with whatever already sits in the slot', () => {
    const result = dropOnSlot({
      sortedAnswers: [B, null],
      facts: [B, A],
      currentIndex: 1,
      dragItem: A,
      dragSource: 'stack',
      slotIndex: 0,
      hardcore: false,
    });

    expect(result.sortedAnswers).toEqual([A, null]);
    expect(result.currentIndex).toBe(1);
    expect(result.facts[1]).toEqual(B);
  });

  test('hardcore mode blocks displacing a card already in a slot', () => {
    const state = {
      sortedAnswers: [B, null],
      facts: [B, A],
      currentIndex: 1,
    };
    const result = dropOnSlot({
      ...state,
      dragItem: A,
      dragSource: 'stack',
      slotIndex: 0,
      hardcore: true,
    });

    expect(result).toEqual(state);
  });

  test('swaps two already-placed cards when dragging slot to slot', () => {
    const result = dropOnSlot({
      sortedAnswers: [A, B],
      facts: [A, B],
      currentIndex: 2,
      dragItem: A,
      dragSource: 0,
      slotIndex: 1,
      hardcore: false,
    });

    expect(result.sortedAnswers).toEqual([B, A]);
  });

  test('hardcore mode blocks slot-to-slot swaps entirely', () => {
    const state = {
      sortedAnswers: [A, B],
      facts: [A, B],
      currentIndex: 2,
    };
    const result = dropOnSlot({
      ...state,
      dragItem: A,
      dragSource: 0,
      slotIndex: 1,
      hardcore: true,
    });

    expect(result).toEqual(state);
  });
});

describe('autoFillRemaining', () => {
  test('fills only the empty slots and leaves placed ones untouched', () => {
    const result = autoFillRemaining([A, B, C], 1, [A, null, null]);

    expect(result[0]).toEqual(A);
    expect(result.filter((f) => f !== null)).toHaveLength(3);
  });

  test('uses each remaining fact exactly once, with no duplicates or omissions', () => {
    const result = autoFillRemaining([A, B, C], 0, [null, null, null]);
    const ids = result.map((f) => f!.id).sort();

    expect(ids).toEqual([A.id, B.id, C.id].sort());
  });
});
