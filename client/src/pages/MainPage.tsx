import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useToast } from '../hooks/useToast';
import { useDragDrop } from '../hooks/useDragDrop';
import { useHardcoreTimer } from '../hooks/useHardcoreTimer';
import { useGameKeyboard } from '../hooks/useGameKeyboard';
import { getHardcoreMode } from '../hooks/useHardcoreMode';
import { ToastContainer } from '../components/ToastContainer';
import { QuestionStack } from '../components/QuestionStack';
import { Timeline } from '../components/Timeline';
import type { Fact, FactSummary } from '../types';
import './MainPage.css';

function fetchWithTimeout(url: string, options?: RequestInit, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function MainPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [rightAnswers, setRightAnswers] = useState<Fact[]>([]);
  const [waveActive, setWaveActive] = useState(false);
  const [hardcore] = useState(getHardcoreMode);
  const { toasts, addToast, removeToast } = useToast();

  const {
    facts,
    currentIndex,
    sortedAnswers,
    dragItem,
    dragSource,
    dragOverSlot,
    pulsedSlot,
    allAnswered,
    loadFacts,
    startDragFromStack,
    startDragFromSlot,
    cancelDrag,
    dropOnSlot,
    removeFromSlot,
    autoFillRemaining,
    submittedIds,
    setDragOverSlot,
  } = useDragDrop(hardcore);

  const submitIds = useCallback(
    (ids: number[]) => {
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
        .catch(() =>
          addToast('Ergebnis konnte nicht übermittelt werden. Bitte versuche es erneut.')
        );
    },
    [addToast]
  );

  const { timeLeft, stop: stopTimer } = useHardcoreTimer({
    active: hardcore && facts.length > 0 && !loading,
    resetKey: facts,
    onExpire: useCallback(() => submitIds(autoFillRemaining()), [submitIds, autoFillRemaining]),
  });

  const handleSubmit = useCallback(() => {
    stopTimer();
    submitIds(submittedIds());
  }, [stopTimer, submitIds, submittedIds]);

  const { keyboardSelected, setKeyboardSelected, selectedSlot, setSelectedSlot } = useGameKeyboard({
    active: !showPopup && !showResult,
    hardcore,
    facts,
    sortedAnswers,
    dragItem,
    allAnswered,
    startDragFromStack,
    startDragFromSlot,
    dropOnSlot,
    removeFromSlot,
    onSubmit: handleSubmit,
  });

  const fetchRound = () =>
    fetchWithTimeout(`${API_URL}/api/facts/round`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: FactSummary[]) => {
        loadFacts(data);
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

  const handleNextGame = () => {
    setShowPopup(false);
    setShowResult(false);
    setScore(null);
    setRightAnswers([]);
    loadRound();
  };

  useEffect(() => {
    if (allAnswered && facts.length > 0) {
      const timer = setTimeout(() => setWaveActive(true), 0);
      setTimeout(() => setWaveActive(false), facts.length * 100 + 400);
      return () => clearTimeout(timer);
    }
  }, [allAnswered, facts.length]);

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
                        {rightFact?.answer.toLocaleString('de-DE')}
                      </span>
                    )}
                  </div>
                  {!isCorrect && (
                    <div className="result-item-row correct result-correct-row">
                      <span className="result-arrow">→</span>
                      <span className="result-question">{rightFact?.question}</span>
                      <span className="result-answer">
                        {rightFact?.answer.toLocaleString('de-DE')}
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
        <QuestionStack
          facts={facts}
          currentIndex={currentIndex}
          keyboardSelected={keyboardSelected}
          onDragStart={startDragFromStack}
          onCardClick={() => {
            if (dragItem && dragSource === 'stack') {
              cancelDrag();
              setKeyboardSelected(false);
            } else if (!dragItem && currentIndex < facts.length) {
              startDragFromStack();
              setKeyboardSelected(true);
            }
          }}
        />
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
                    <span className="result-answer">{fact.answer}</span>
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
        <Timeline
          sortedAnswers={sortedAnswers}
          factsLength={facts.length}
          currentIndex={currentIndex}
          hardcore={hardcore}
          dragOverSlot={dragOverSlot}
          pulsedSlot={pulsedSlot}
          selectedSlot={selectedSlot}
          waveActive={waveActive}
          onDragOverSlot={setDragOverSlot}
          onDragLeaveSlot={() => setDragOverSlot(null)}
          onDropSlot={dropOnSlot}
          onSlotClick={(i, slot) => {
            if (dragItem) {
              dropOnSlot(i);
              setKeyboardSelected(false);
              setSelectedSlot(null);
            } else if (slot && !hardcore) {
              startDragFromSlot(slot, i);
              setKeyboardSelected(true);
              setSelectedSlot(i);
            }
          }}
          onChipDragStart={startDragFromSlot}
        />

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
