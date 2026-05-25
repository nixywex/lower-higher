export function calculateScore(
  rightAnswers: number[],
  userAnswers: number[],
  maxScore: number,
): number {
  var score = 0;
  const maxPerAnswer = maxScore / rightAnswers.length;

  for (let i = 0; i < rightAnswers.length; i++) {
    var userAnswerValue = userAnswers[i];
    var rightAnswerValue = rightAnswers[i];

    if (userAnswerValue == undefined || rightAnswerValue == undefined)
      throw Error("User answer or right answer is undefined");

    var answerScore = rightAnswerValue - userAnswerValue;

    if (maxPerAnswer - Math.abs(answerScore) > 0) {
      score += maxPerAnswer - Math.abs(answerScore);
    }
  }

  return score;
}

module.exports = { calculateScore };
