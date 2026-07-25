interface ScorePopupProps {
  score: number | null;
  onExit: () => void;
  onShowResult: () => void;
  onNextGame: () => void;
}

export function ScorePopup({ score, onExit, onShowResult, onNextGame }: ScorePopupProps) {
  return (
    <div className="popup-overlay">
      <div className="popup">
        <h2>Ergebnis</h2>
        <p className="popup-score">{score}</p>
        <p className="popup-label">Punkte</p>
        <div className="popup-buttons">
          <button className="popup-btn secondary" onClick={onExit}>
            Exit
          </button>
          <button className="popup-btn outline" onClick={onShowResult}>
            Result
          </button>
          <button className="popup-btn primary" onClick={onNextGame}>
            Next Game
          </button>
        </div>
      </div>
    </div>
  );
}
