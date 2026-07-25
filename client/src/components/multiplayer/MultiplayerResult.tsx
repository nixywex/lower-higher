import { useState } from 'react';
import type { Fact } from '../../types';

interface MultiplayerResultProps {
  disconnected: boolean;
  myScore: number | null;
  opponentScore: number | null;
  rightAnswers: Fact[];
  myAnswers: Fact[];
  opponentAnswers: Fact[];
  onExit: () => void;
}

export function MultiplayerResult({
  disconnected,
  myScore,
  opponentScore,
  rightAnswers,
  myAnswers,
  opponentAnswers,
  onExit,
}: MultiplayerResultProps) {
  const [showDetails, setShowDetails] = useState(false);
  const didWin = (myScore ?? 0) > (opponentScore ?? 0);
  const isDraw = myScore === opponentScore;

  return (
    <div className="mp-wrapper">
      <div className={`mp-card mp-result-card${showDetails ? ' mp-result-card--detail' : ''}`}>
        {disconnected && <p className="mp-error">Gegner hat das Spiel verlassen.</p>}
        {showDetails ? (
          <>
            <div className="mp-result-detail-wrapper">
              <div className="mp-col-result">
                <div className="mp-col-header-row">
                  <div className="mp-col-header">Du</div>
                  <div className="mp-col-header mp-col-header-center">Richtige Reihenfolge</div>
                  <div className="mp-col-header">Gegner</div>
                </div>
                {rightAnswers.map((rightFact, index) => {
                  const myFact = myAnswers[index];
                  const opponentFact = opponentAnswers[index];
                  const myCorrect = myFact?.id === rightFact.id;
                  const opponentCorrect = opponentFact?.id === rightFact.id;

                  return (
                    <div key={rightFact.id} className="mp-col-row">
                      <div className={`mp-col-cell mp-col-side ${myCorrect ? 'correct' : 'wrong'}`}>
                        {myFact?.question ?? '—'}
                      </div>
                      <div className="mp-col-cell mp-col-center">
                        <span className="mp-col-rank">{index + 1}</span>
                        <span className="mp-col-q">{rightFact.question}</span>
                        <span className="mp-col-val">
                          {rightFact.answer.toLocaleString('de-DE')}
                        </span>
                      </div>
                      <div
                        className={`mp-col-cell mp-col-side ${opponentCorrect ? 'correct' : 'wrong'}`}
                      >
                        {opponentFact?.question ?? '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mp-comparison">
                {rightAnswers.map((rightFact, index) => {
                  const myFact = myAnswers[index];
                  const opponentFact = opponentAnswers[index];
                  const myCorrect = myFact?.id === rightFact.id;
                  const opponentCorrect = opponentFact?.id === rightFact.id;

                  return (
                    <div
                      key={rightFact.id}
                      className="mp-compare-card"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="mp-compare-correct">
                        <span className="mp-compare-rank">{index + 1}</span>
                        <span className="mp-compare-question">{rightFact.question}</span>
                        <span className="mp-compare-value">
                          {rightFact.answer.toLocaleString('de-DE')}
                        </span>
                      </div>
                      <div className="mp-compare-players">
                        <div className={`mp-player-row ${myCorrect ? 'correct' : 'wrong'}`}>
                          <span className="mp-player-label">Du</span>
                          <span className="mp-compare-question">{myFact?.question}</span>
                        </div>
                        <div className={`mp-player-row ${opponentCorrect ? 'correct' : 'wrong'}`}>
                          <span className="mp-player-label">Gegner</span>
                          <span className="mp-compare-question">{opponentFact?.question}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mp-result-buttons">
              <button className="mp-btn secondary" onClick={onExit}>
                Exit
              </button>
              <button className="mp-btn outline" onClick={() => setShowDetails(false)}>
                ← Back
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className={`mp-title ${didWin ? 'win' : isDraw ? 'draw' : 'lose'}`}>
              {didWin ? '🏆 Du gewinnst!' : isDraw ? '🤝 Unentschieden!' : '😔 Nächstes Mal!'}
            </h2>
            <div className="mp-scores">
              <div className="mp-score-box">
                <span className="mp-score-label">Du</span>
                <span className="mp-score-value">{myScore}</span>
              </div>
              <div className="mp-score-box opponent">
                <span className="mp-score-label">Gegner</span>
                <span className="mp-score-value">{opponentScore}</span>
              </div>
            </div>
            <div className="mp-result-buttons">
              <button className="mp-btn secondary" onClick={onExit}>
                Exit
              </button>
              <button className="mp-btn outline" onClick={() => setShowDetails(true)}>
                Result
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
