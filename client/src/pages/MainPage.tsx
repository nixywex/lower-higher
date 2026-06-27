import { useEffect, useState, useRef, Fragment } from 'react';
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
  const [hardcore] = useState(() => localStorage.getItem('hardcoreMode') === 'true');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const autoSubmitted = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      } else if (!hardcore) {
        const displaced = updated[slotIndex];
        updated[slotIndex] = dragItem;
        setSortedAnswers(updated);
        const newFacts = [...facts];
        newFacts[currentIndex] = displaced!;
        setFacts(newFacts);
        setPulsedSlot(slotIndex);
        setTimeout(() => setPulsedSlot(null), 400);
      }
    } else if (typeof dragSource === 'number' && !hardcore) {
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(null);
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
    if (!hardcore || facts.length === 0 || loading) return;
    autoSubmitted.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    const DURATION = 60;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
      }
    };
    const initialId = setTimeout(tick, 0);
    timerRef.current = setInterval(tick, 250);
    return () => {
      clearTimeout(initialId);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facts]);

  useEffect(() => {
    if (timeLeft !== 0 || autoSubmitted.current) return;
    autoSubmitted.current = true;
    const remaining = facts.slice(currentIndex).sort(() => Math.random() - 0.5);
    const updated = [...sortedAnswers];
    let ri = 0;
    for (let i = 0; i < updated.length; i++) {
      if (!updated[i] && remaining[ri]) updated[i] = remaining[ri++];
    }
    setSortedAnswers(updated);
    const ids = updated.filter(Boolean).map((f) => f!.id);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

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
        } else if (sortedAnswers[num - 1] && !hardcore) {
          setDragItem(sortedAnswers[num - 1]);
          setDragSource(num - 1);
          setKeyboardSelected(true);
          setSelectedSlot(num - 1);
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !hardcore) {
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
  }, [dragItem, showPopup, showResult, sortedAnswers, facts, currentIndex]);
  if (showResult)
    return (
      <div className="game-wrapper">
        <div className="result-comparison">
          <div className="result-grid">
            <div className="result-col-header">Dein Ergebnis</div>
            <div className="result-col-header">Richtige Reihenfolge</div>
            {sortedAnswers.map((fact, i) => {
              const rightFact = rightAnswers[i];
              const isCorrect = fact?.id === rightFact?.id;
              return (
                <Fragment key={i}>
                  <div
                    className={`result-row ${isCorrect ? 'correct' : 'wrong'}`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <span className="result-rank">{i + 1}.</span>
                    <span className="result-question">{fact?.question}</span>
                  </div>
                  <div className="result-row correct" style={{ animationDelay: `${i * 150}ms` }}>
                    <span className="result-rank">{i + 1}.</span>
                    <span className="result-question">{rightFact?.question}</span>
                    <span className="result-answer">
                      {rightFact?.answer.toLocaleString('de-DE')} {rightFact?.unit}
                    </span>
                  </div>
                </Fragment>
              );
            })}
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
        <div className="progress-bar-wrapper">
          <div
            className="progress-bar-fill"
            style={{ height: `${(currentIndex / facts.length) * 100}%` }}
          />
        </div>
        <div className="timeline-area">
          <span className="timeline-label top">MAX</span>
          <div className="timeline-slots">
            {sortedAnswers.map((slot, i) => (
              <div key={i} className="slot-row">
                <span className="slot-number">{i + 1}</span>
                <div
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
                      className={`answer-chip placed${hardcore ? ' locked' : ''}`}
                      draggable={!hardcore}
                      onDragStart={!hardcore ? () => handleDragStartFromSlot(slot, i) : undefined}
                    >
                      {slot.question}
                    </div>
                  ) : (
                    <span className="slot-placeholder">—</span>
                  )}
                </div>
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
          {hardcore && timeLeft !== null && (
            <div
              className={`game-timer${timeLeft <= 10 ? ' danger' : timeLeft <= 20 ? ' warning' : ''}`}
            >
              {timeLeft}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainPage;
