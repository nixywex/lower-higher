import { describe, test, expect } from '@jest/globals';
import type { Fact } from '../types';

const { calculateScore } = require('../utils/scoring');

// helper functions for tests
const createFact = (id: number, answer: number): Fact => ({
  id,
  question: `Question ${id}`,
  answer: answer,
});

const facts = [createFact(1, 10), createFact(2, 20), createFact(3, 30)];
const maxPointsPerRightAnswer = 10000;

describe('calculateScore', () => {
  test('right order -> max points', () => {
    const result = calculateScore(facts, [1, 2, 3, 4, 5], maxPointsPerRightAnswer);
    expect(result).toBe(maxPointsPerRightAnswer * facts.length);
  });

  test('wrong order and big difference -> 0 points (not negative)', () => {
    // position 0: right=10000, user choose id:3 (answer:30000) → diff=20000 → 0
    // position 1: right=20000, user choose id:1 (answer:10000) → diff=10000 → 0
    // position 2: right=30000, user choose id:2 (answer:20000) → diff=10000 → 0
    const factsWithBigAnswers = [createFact(1, 10000), createFact(2, 20000), createFact(3, 30000)];
    const result = calculateScore(factsWithBigAnswers, [3, 1, 2], maxPointsPerRightAnswer);
    expect(result).toBe(0);
  });

  test('wrong order but small difference -> score is right', () => {
    // position 0: right=10, user choose id:2 (answer:20) → diff=10 → 100-10=90
    // position 1: right=20, user choose id:1 (answer:10) → diff=10 → 100-10=90
    // position 2: right=30, user choose id:3 (answer:30) → diff=0 → 100
    const result = calculateScore(facts, [2, 1, 3], 100);
    expect(result).toBe(280);
  });

  test('throws error if id does not exist', () => {
    expect(() => calculateScore(facts, [1, 2, 99], maxPointsPerRightAnswer)).toThrow(
      'User answer or right answer is undefined'
    );
  });
});
