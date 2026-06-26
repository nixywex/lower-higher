import { describe, test, expect } from '@jest/globals';
import type { Fact } from '../types';

const { mapClientFacts } = require('../utils/mapping');

const facts: Fact[] = [
  { id: 1, question: 'Q1', answer: 100 },
  { id: 2, question: 'Q2', answer: 200 },
];

describe('mapClientFacts', () => {
  test('keeps id and question, strips answer', () => {
    const result = mapClientFacts(facts);
    expect(result).toEqual([
      { id: 1, question: 'Q1' },
      { id: 2, question: 'Q2' },
    ]);
    result.forEach((f: Record<string, unknown>) => expect(f).not.toHaveProperty('answer'));
  });
});
