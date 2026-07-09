import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ToastContainer';
import { dropOnSlot, autoFillRemaining } from '../utils/gameLogic';
import './MainPage.css';

interface Fact {
  id: number;
  question: string;
  answer: number;
  unit: string;
}

function fetchWithTimeout(url: string, options?: RequestInit, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function MainPage() {
  const navigate = useNavigate();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
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
  const { toasts, addToast, removeToast } = useToast();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRound = () =>
    fetchWithTimeout(`${API_URL}/api/facts/round`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Fact[]) => {
        setFacts(data);
        setSortedAnswers(new Array(data.length).fill(null));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setLoadFailed(true);
        addToast('Server nicht erreichbar. Bitte überprüfe deine Verbindung.');
      });

  const loadRound = () => {
    setLoadFailed(false);
    setLoading(true);
    fetchRound();
  };

  useEffect(() => {
    fetchRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const wasEmpty = !sortedAnswers[slotIndex];
    const result = dropOnSlot({
      sortedAnswers,
      facts,
      currentIndex,
      dragItem,
      dragSource: dragSource!,
      slotIndex,
      hardcore,
    });
    setSortedAnswers(result.sortedAnswers);
    setFacts(result.facts);
    setCurrentIndex(result.currentIndex);
    if (dragSource === 'stack' && (wasEmpty || !hardcore)) {
      setPulsedSlot(slotIndex);
      setTimeout(() => setPulsedSlot(null), 400);
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
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setScore(data.score);
        setRightAnswers(data.rightAnswers);
        setShowPopup(true);
      })
      .catch(() => addToast('Ergebnis konnte nicht übermittelt werden. Bitte versuche es erneut.'));
  };

  const handleNextGame = () => {
    setShowPopup(false);
    setShowResult(false);
    setScore(null);
    setRightAnswers([]);
    setCurrentIndex(0);
    setSortedAnswers([]);
    loadRound();
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
    const updated = autoFillRemaining(facts, currentIndex, sortedAnswers);
    setSortedAnswers(updated);
    const ids = updated.filter(Boolean).map((f) => f!.id);
    fetch(`${API_URL}/api/facts/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setScore(data.score);
        setRightAnswers(data.rightAnswers);
        setShowPopup(true);
      })
      .catch(() => addToast('Ergebnis konnte nicht übermittelt werden. Bitte versuche es erneut.'));
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
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="result-comparison">
          <div className="result-items">
            {sortedAnswers.map((fact, i) => {
              const rightFact = rightAnswers[i];
              const isCorrect = fact?.id === rightFact?.id;
              return (
                <div
                  key={i}
                  className="result-item-card"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`result-item-row ${isCorrect ? 'correct' : 'wrong'}`}>
                    <span className="result-rank">{i + 1}</span>
                    <span className="result-question">{fact?.question}</span>
                    {isCorrect && (
                      <span className="result-answer">
                        {rightFact?.answer.toLocaleString('de-DE')} {rightFact?.unit}
                      </span>
                    )}
                  </div>
                  {!isCorrect && (
                    <div className="result-item-row correct result-correct-row">
                      <span className="result-arrow">→</span>
                      <span className="result-question">{rightFact?.question}</span>
                      <span className="result-answer">
                        {rightFact?.answer.toLocaleString('de-DE')} {rightFact?.unit}
                      </span>
                    </div>
                  )}
                </div>
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

  if (loading)
    return (
      <div className="loading">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        Loading...
      </div>
    );

  if (loadFailed)
    return (
      <div className="loading">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <p className="load-error-title">Server nicht erreichbar.</p>
        <div className="load-error-buttons">
          <button className="popup-btn secondary" onClick={() => navigate('/')}>
            Zurück
          </button>
          <button className="popup-btn primary" onClick={loadRound}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );

  return (
    <div className="game-wrapper">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <button className="exit-btn" onClick={() => navigate('/')}>
        ✕
      </button>

      <div className="question-stack">
        {currentIndex >= facts.length ? (
          <div className="stack-done">
            <p>Alle Fragen platziert!</p>
            <p className="stack-done-sub">
              Drücke <strong>Submit</strong>, um fortzufahren.
            </p>
          </div>
        ) : (
          facts.slice(currentIndex, currentIndex + 3).map((fact, i) => (
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
              onClick={
                i === 0
                  ? () => {
                      if (dragItem && dragSource === 'stack') {
                        setDragItem(null);
                        setDragSource(null);
                        setKeyboardSelected(false);
                      } else if (!dragItem && currentIndex < facts.length) {
                        handleDragStartFromStack();
                        setKeyboardSelected(true);
                      }
                    }
                  : undefined
              }
            >
              {i === 0 && <p>{fact.question}</p>}
            </div>
          ))
        )}
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
          <div className="slots-row">
            <div
              className="progress-bar-wrapper"
              style={
                { '--progress': `${(currentIndex / facts.length) * 100}%` } as React.CSSProperties
              }
            >
              <div className="progress-bar-fill" />
            </div>
            <div className="timeline-slots">
              {sortedAnswers.map((slot, i) => (
                <div key={i} className="slot-row">
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
                    onClick={() => {
                      if (dragItem) {
                        handleDropOnSlot(i);
                        setDragOverSlot(null);
                        setKeyboardSelected(false);
                        setSelectedSlot(null);
                      } else if (slot && !hardcore) {
                        handleDragStartFromSlot(slot, i);
                        setKeyboardSelected(true);
                        setSelectedSlot(i);
                      }
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
                      <span className="slot-placeholder">{i + 1}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <span className="timeline-label bottom">MIN</span>
        </div>

        <div className="action-buttons">
          {hardcore && timeLeft !== null && (
            <div
              className={`game-timer${timeLeft <= 10 ? ' danger' : timeLeft <= 20 ? ' warning' : ''}`}
            >
              {timeLeft}
            </div>
          )}
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
