import type { Fact } from '../types/index';

export function calculateScore(
  factsInRightOrder: Fact[],
  idsOrderedByUser: number[],
  maxPointsPerRightAnswer: number
): number {
  let score = 0;
  for (let i = 0; i < factsInRightOrder.length; i++) {
    const rightAnswerValue = factsInRightOrder[i]?.answer;
    const userAnswerValue = factsInRightOrder.find(
      (fact) => fact.id == idsOrderedByUser[i]
    )?.answer;

    if (userAnswerValue == undefined || rightAnswerValue == undefined)
      throw Error('User answer or right answer is undefined');

    const answerScore = rightAnswerValue - userAnswerValue;

    if (maxPointsPerRightAnswer - Math.abs(answerScore) > 0) {
      score += maxPointsPerRightAnswer - Math.abs(answerScore);
    }
  }

  return score;
}
