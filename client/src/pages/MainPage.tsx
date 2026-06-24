import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import './MainPage.css';

interface Fact {
  id: number;
  question: string;
  answer: number;
  unit: string;
}

function MainPage() {
  const navigate = useNavigate();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortedAnswers, setSortedAnswers] = useState<(Fact | null)[]>([]);
  const [dragItem, setDragItem] = useState<Fact | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [rightAnswers, setRightAnswers] = useState<Fact[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [dragSource, setDragSource] = useState<'stack' | number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [pulsedSlot, setPulsedSlot] = useState<number | null>(null);
  const [waveActive, setWaveActive] = useState(false);
  const [keyboardSelected, setKeyboardSelected] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  useEffect(() => {
    fetch(`${API_URL}/api/facts/round`)
      .then((res) => res.json())
      .then((data: Fact[]) => {
        setFacts(data);
        setSortedAnswers(new Array(data.length).fill(null));
        setLoading(false);
      });
  }, []);

  const allAnswered = sortedAnswers.every((slot) => slot !== null);

  const handleDragStartFromStack = () => {
    if (currentIndex >= facts.length) return;
    setDragItem(facts[currentIndex]);
    setDragSource('stack');
  };

  const handleDragStartFromSlot = (fact: Fact, slotIndex: number) => {
    setDragItem(fact);
    setDragSource(slotIndex);
  };

  const handleDropOnSlot = (slotIndex: number) => {
    if (!dragItem) return;
    const updated = [...sortedAnswers];

    if (dragSource === 'stack') {
      if (!updated[slotIndex]) {
        updated[slotIndex] = dragItem;
        setSortedAnswers(updated);
        setPulsedSlot(slotIndex);
        setTimeout(() => setPulsedSlot(null), 400);
        setCurrentIndex((i) => i + 1);
      }
    } else if (typeof dragSource === 'number') {
      const fromSlot = dragSource;
      const occupant = updated[slotIndex];
      updated[slotIndex] = dragItem;
      updated[fromSlot] = occupant ?? null;
      setSortedAnswers(updated);
    }

    setDragItem(null);
    setDragSource(null);
  };

  const handleSubmit = () => {
    const ids = sortedAnswers.filter(Boolean).map((f) => f!.id);
    fetch(`${API_URL}/api/facts/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
      .then((res) => res.json())
      .then((data) => {
        setScore(data.score);
        setRightAnswers(data.rightAnswers);
        setShowPopup(true);
      });
  };

  const handleNextGame = () => {
    setShowPopup(false);
    setShowResult(false);
    setScore(null);
    setRightAnswers([]);
    setCurrentIndex(0);
    setSortedAnswers([]);
    setLoading(true);
    fetch(`${API_URL}/api/facts/round`)
      .then((res) => res.json())
      .then((data: Fact[]) => {
        setFacts(data);
        setSortedAnswers(new Array(data.length).fill(null));
        setLoading(false);
      });
  };

  useEffect(() => {
    if (allAnswered && facts.length > 0) {
      const timer = setTimeout(() => setWaveActive(true), 0);
      setTimeout(() => setWaveActive(false), facts.length * 100 + 400);
      return () => clearTimeout(timer);
    }
  }, [allAnswered, facts.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showPopup || showResult) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleDragStartFromStack();
        setKeyboardSelected(true);
      }

      if (e.key === 'Enter' && allAnswered && !dragItem) {
        handleSubmit();
      }

      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= facts.length) {
        if (dragItem) {
          handleDropOnSlot(num - 1);
          setKeyboardSelected(false);
          setSelectedSlot(null);
        } else if (sortedAnswers[num - 1]) {
          setDragItem(sortedAnswers[num - 1]);
          setDragSource(num - 1);
          setKeyboardSelected(true);
          setSelectedSlot(num - 1);
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const firstFilled = sortedAnswers.findIndex((s) => s !== null);
        if (firstFilled !== -1) {
          const updated = [...sortedAnswers];
          updated[firstFilled] = null;
          setSortedAnswers(updated);
          setCurrentIndex((i) => i - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragItem, showPopup, showResult, sortedAnswers, facts.length, currentIndex]);
  if (showResult)
    return (
      <div className="game-wrapper">
        <div className="result-comparison">
          <div className="result-columns">
            <div className="result-col">
              <h3>Dein Ergebnis</h3>
              {sortedAnswers.map((fact, i) => {
                const isCorrect = fact?.id === rightAnswers[i]?.id;
                return (
                  <div
                    key={i}
                    className={`result-row ${isCorrect ? 'correct' : 'wrong'}`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <span className="result-rank">{i + 1}.</span>
                    <span className="result-question">{fact?.question}</span>
                  </div>
                );
              })}
            </div>
            <div className="result-col">
              <h3>Richtige Reihenfolge</h3>
              {rightAnswers.map((fact, i) => (
                <div
                  key={fact.id}
                  className="result-row correct"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <span className="result-rank">{i + 1}.</span>
                  <span className="result-question">{fact.question}</span>
                  <span className="result-answer">
                    {fact.answer} {fact.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="result-actions">
            <button className="popup-btn secondary" onClick={() => navigate('/')}>
              Exit
            </button>
            <button className="popup-btn primary" onClick={handleNextGame}>
              Next Game
            </button>
          </div>
        </div>
      </div>
    );

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="game-wrapper">
      <button className="exit-btn" onClick={() => navigate('/')}>
        ✕
      </button>

      <div className="progress-bar-wrapper">
        <div
          className="progress-bar-fill"
          style={{ height: `${(currentIndex / facts.length) * 100}%` }}
        />
      </div>

      <div className="question-stack">
        {facts.slice(currentIndex, currentIndex + 3).map((fact, i) => (
          <div
            key={fact.id}
            className={`question-card ${i === 0 ? 'active' : ''} ${i === 0 && keyboardSelected ? 'keyboard-selected' : ''}`}
            style={{
              zIndex: 3 - i,
              transform: `translateY(${i * 8}px) scale(${1 - i * 0.04})`,
              cursor: i === 0 ? 'grab' : 'default',
            }}
            draggable={i === 0}
            onDragStart={i === 0 ? handleDragStartFromStack : undefined}
          >
            {i === 0 && <p>{fact.question}</p>}
          </div>
        ))}
        {showPopup && !showResult && (
          <div className="popup-overlay">
            <div className="popup">
              <h2>Ergebnis</h2>
              <p className="popup-score">{score}</p>
              <p className="popup-label">Punkte</p>
              <div className="popup-buttons">
                <button className="popup-btn secondary" onClick={() => navigate('/')}>
                  Exit
                </button>
                <button
                  className="popup-btn outline"
                  onClick={() => {
                    setShowPopup(false);
                    setShowResult(true);
                  }}
                >
                  Result
                </button>
                <button className="popup-btn primary" onClick={handleNextGame}>
                  Next Game
                </button>
              </div>
            </div>
          </div>
        )}

        {showPopup && showResult && (
          <div className="popup-overlay">
            <div className="popup popup-result">
              <h2>Richtige Reihenfolge</h2>
              <div className="result-list">
                {rightAnswers.map((fact, i) => (
                  <div key={fact.id} className="result-item">
                    <span className="result-rank">{i + 1}.</span>
                    <span className="result-question">{fact.question}</span>
                    <span className="result-answer">
                      {fact.answer} {fact.unit}
                    </span>
                  </div>
                ))}
              </div>
              <div className="popup-buttons">
                <button className="popup-btn secondary" onClick={() => navigate('/')}>
                  Exit
                </button>
                <button className="popup-btn outline" onClick={() => setShowResult(false)}>
                  ← Back
                </button>
                <button className="popup-btn primary" onClick={handleNextGame}>
                  Next Game
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="game-area">
        <div className="timeline-area">
          <span className="timeline-label top">MAX</span>
          <div className="timeline-slots">
            {sortedAnswers.map((slot, i) => (
              <div
                key={i}
                className={`timeline-slot ${slot ? 'filled' : ''} ${dragOverSlot === i ? 'drag-over' : ''} ${pulsedSlot === i ? 'pulse' : ''} ${waveActive ? 'wave' : ''} ${selectedSlot === i ? 'keyboard-selected-slot' : ''}`}
                style={waveActive ? { animationDelay: `${i * 100}ms` } : {}}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSlot(i);
                }}
                onDragLeave={() => setDragOverSlot(null)}
                onDrop={() => {
                  handleDropOnSlot(i);
                  setDragOverSlot(null);
                }}
              >
                {slot ? (
                  <div
                    className="answer-chip placed"
                    draggable
                    onDragStart={() => handleDragStartFromSlot(slot, i)}
                  >
                    {slot.question}
                  </div>
                ) : (
                  <span className="slot-placeholder">—</span>
                )}
              </div>
            ))}
          </div>
          <span className="timeline-label bottom">MIN</span>
        </div>

        <div className="action-buttons">
          <button className="submit-btn" onClick={handleSubmit} disabled={!allAnswered}>
            Submit
          </button>
          <p className="keyboard-hint">
            Space = Karte nehmen &nbsp;|&nbsp; 1-{facts.length} = Position wählen &nbsp;|&nbsp;
            Delete = entfernen
          </p>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
