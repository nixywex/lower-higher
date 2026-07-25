import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useDragDrop } from '../hooks/useDragDrop';
import { useHardcoreTimer } from '../hooks/useHardcoreTimer';
import { useGameKeyboard } from '../hooks/useGameKeyboard';
import { getHardcoreMode } from '../hooks/useHardcoreMode';
import { ToastContainer } from '../components/ToastContainer';
import { QuestionStack } from '../components/QuestionStack';
import { Timeline } from '../components/Timeline';
import { GameTimer } from '../components/GameTimer';
import { KeyboardHint } from '../components/KeyboardHint';
import { ScorePopup } from '../components/singleplayer/ScorePopup';
import { SingleplayerResult } from '../components/singleplayer/SingleplayerResult';
import { fetchRound, submitRound } from '../services/factsApi';
import type { Fact } from '../types';
import './MainPage.css';

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
      submitRound(ids)
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

  const loadRoundFromServer = useCallback(
    () =>
      fetchRound()
        .then((data) => {
          loadFacts(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setLoadFailed(true);
          addToast('Server nicht erreichbar. Bitte überprüfe deine Verbindung.');
        }),
    [addToast, loadFacts]
  );

  const loadRound = useCallback(() => {
    setLoadFailed(false);
    setLoading(true);
    loadRoundFromServer();
  }, [loadRoundFromServer]);

  useEffect(() => {
    loadRoundFromServer();
  }, [loadRoundFromServer]);

  const handleNextGame = () => {
    setShowPopup(false);
    setShowResult(false);
    setScore(null);
    setRightAnswers([]);
    loadRound();
  };

  const handleCardClick = () => {
    if (dragItem && dragSource === 'stack') {
      cancelDrag();
      setKeyboardSelected(false);
    } else if (!dragItem && currentIndex < facts.length) {
      startDragFromStack();
      setKeyboardSelected(true);
    }
  };

  const handleSlotClick = (index: number, hasFact: boolean) => {
    if (dragItem) {
      dropOnSlot(index);
      setKeyboardSelected(false);
      setSelectedSlot(null);
    } else if (hasFact && !hardcore) {
      startDragFromSlot(sortedAnswers[index]!, index);
      setKeyboardSelected(true);
      setSelectedSlot(index);
    }
  };

  useEffect(() => {
    if (allAnswered && facts.length > 0) {
      const startTimer = setTimeout(() => setWaveActive(true), 0);
      const endTimer = setTimeout(() => setWaveActive(false), facts.length * 100 + 400);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    }
  }, [allAnswered, facts.length]);

  if (showResult)
    return (
      <div className="game-wrapper">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <SingleplayerResult
          sortedAnswers={sortedAnswers}
          rightAnswers={rightAnswers}
          onExit={() => navigate('/')}
          onNextGame={handleNextGame}
        />
      </div>
    );

  if (loading)
    return (
      <div className="loading" role="status" aria-live="polite">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="loading-spinner" aria-hidden="true" />
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
      <button className="exit-btn" onClick={() => navigate('/')} aria-label="Spiel verlassen">
        ✕
      </button>

      <div className="question-stack">
        <QuestionStack
          facts={facts}
          currentIndex={currentIndex}
          keyboardSelected={keyboardSelected}
          onDragStart={startDragFromStack}
          onCardClick={handleCardClick}
        />
        {showPopup && (
          <ScorePopup
            score={score}
            onExit={() => navigate('/')}
            onShowResult={() => {
              setShowPopup(false);
              setShowResult(true);
            }}
            onNextGame={handleNextGame}
          />
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
          onSlotClick={(index, fact) => handleSlotClick(index, fact !== null)}
          onChipDragStart={startDragFromSlot}
        />

        <div className="action-buttons">
          {hardcore && <GameTimer timeLeft={timeLeft} />}
          <button className="submit-btn" onClick={handleSubmit} disabled={!allAnswered}>
            Submit
          </button>
          <KeyboardHint factsCount={facts.length} />
        </div>
      </div>
    </div>
  );
}

export default MainPage;
