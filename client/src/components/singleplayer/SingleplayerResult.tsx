import type { Fact, FactSummary } from '../../types';

interface SingleplayerResultProps {
  sortedAnswers: (FactSummary | null)[];
  rightAnswers: Fact[];
  onExit: () => void;
  onNextGame: () => void;
}

export function SingleplayerResult({
  sortedAnswers,
  rightAnswers,
  onExit,
  onNextGame,
}: SingleplayerResultProps) {
  return (
    <div className="result-comparison">
      <div className="result-items">
        {sortedAnswers.map((fact, index) => {
          const rightFact = rightAnswers[index];
          const isCorrect = fact?.id === rightFact?.id;

          return (
            <div
              key={fact?.id ?? index}
              className="result-item-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`result-item-row ${isCorrect ? 'correct' : 'wrong'}`}>
                <span className="result-rank">{index + 1}</span>
                <span className="result-question">{fact?.question}</span>
                {isCorrect && (
                  <span className="result-answer">{rightFact?.answer.toLocaleString('de-DE')}</span>
                )}
              </div>
              {!isCorrect && (
                <div className="result-item-row correct result-correct-row">
                  <span className="result-arrow">→</span>
                  <span className="result-question">{rightFact?.question}</span>
                  <span className="result-answer">{rightFact?.answer.toLocaleString('de-DE')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="result-actions">
        <button className="popup-btn secondary" onClick={onExit}>
          Exit
        </button>
        <button className="popup-btn primary" onClick={onNextGame}>
          Next Game
        </button>
      </div>
    </div>
  );
}
