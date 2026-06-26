import { describe, test, expect } from '@jest/globals';
import type { Fact } from '../types';

const { getRightAnswers } = require('../utils/facts_handling');

describe('getRightAnswers', () => {
  test('returns facts sorted by answer ascending', async () => {
    const result: Fact[] = await getRightAnswers([1, 2, 3]);
    const answers = result.map((f) => f.answer);
    expect(answers).toEqual([...answers].sort((a, b) => a - b));
  });

  test('filters to only the requested ids', async () => {
    const result: Fact[] = await getRightAnswers([1, 2]);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.id)).not.toContain(3);
  });
});
