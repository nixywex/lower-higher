import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
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
import './MultiplayerPage.css';

type Screen = 'lobby' | 'waiting' | 'game' | 'result';

function MultiplayerPage() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('lobby');
  const [joinInput, setJoinInput] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const { toasts, addToast, removeToast } = useToast();
  const [myScore, setMyScore] = useState<number | null>(null);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [rightAnswers, setRightAnswers] = useState<Fact[]>([]);
  const [disconnected, setDisconnected] = useState(false);
  const didWin = (myScore ?? 0) > (opponentScore ?? 0);
  const isDraw = myScore === opponentScore;
  const [submitted, setSubmitted] = useState(false);
  const [myAnswers, setMyAnswers] = useState<Fact[]>([]);
  const [opponentAnswers, setOpponentAnswers] = useState<Fact[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [hardcore, setHardcore] = useState(false);
  const socketRef = useRef<Socket | null>(null);

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

  useEffect(() => {
    const socket = io(API_URL);
    socketRef.current = socket;

    socket.on('roomCode', ({ code }: { code: string }) => {
      setRoomCode(code);
      setScreen('waiting');
    });

    socket.on('roomReady', ({ facts, hardcore }: { facts: FactSummary[]; hardcore: boolean }) => {
      loadFacts(facts);
      setHardcore(hardcore);
      setScreen('game');
    });

    socket.on('gameResult', (data) => {
      const { rightAnswers, scores, hostId, guestId, orders } = data;
      const myId = socket.id;
      setMyScore(scores[myId!] ?? 0);
      const opponentId = myId === hostId ? guestId : hostId;
      setOpponentScore(scores[opponentId] ?? 0);
      setMyAnswers(orders[myId!] ?? []);
      setOpponentAnswers(orders[opponentId] ?? []);
      setRightAnswers(rightAnswers);
      setScreen('result');
    });

    socket.on('playerDisconnected', () => {
      setDisconnected(true);
      addToast('Gegner hat die Verbindung getrennt.');
    });

    socket.on('gameError', ({ message }: { message: string }) => addToast(message));

    socket.on('connect_error', () => {
      addToast('Server nicht erreichbar. Überprüfe deine Verbindung.');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRoom = () => {
    if (!socketRef.current?.connected) {
      addToast('Keine Verbindung zum Server. Bitte warte oder lade die Seite neu.');
      return;
    }
    socketRef.current.emit('createRoom', { hardcore: getHardcoreMode() });
  };

  const handleJoinRoom = () => {
    if (!joinInput.trim()) {
      addToast('Bitte einen Raumcode eingeben.');
      return;
    }
    if (!socketRef.current?.connected) {
      addToast('Keine Verbindung zum Server. Bitte warte oder lade die Seite neu.');
      return;
    }
    socketRef.current.emit('joinRoom', { code: joinInput.toUpperCase() });
  };

  const submitIds = useCallback((ids: number[]) => {
    socketRef.current?.emit('submitOrder', { ids });
    setSubmitted(true);
  }, []);

  const { timeLeft, stop: stopTimer } = useHardcoreTimer({
    active: hardcore && screen === 'game',
    resetKey: screen,
    onExpire: useCallback(() => {
      if (submitted) return;
      submitIds(autoFillRemaining());
    }, [submitted, submitIds, autoFillRemaining]),
  });

  const handleSubmit = useCallback(() => {
    stopTimer();
    submitIds(submittedIds());
  }, [stopTimer, submitIds, submittedIds]);

  const { keyboardSelected, setKeyboardSelected, selectedSlot, setSelectedSlot } = useGameKeyboard({
    active: screen === 'game',
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

  // --- LOBBY ---
  if (screen === 'lobby')
    return (
      <div className="mp-wrapper">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <button className="exit-btn" onClick={() => navigate('/')}>
          ✕
        </button>
        <div className="mp-card">
          <h1 className="mp-title">Multiplayer</h1>
          <div className="mp-divider" />
          <button className="mp-btn primary" onClick={handleCreateRoom}>
            <span>🎮</span> Create Room
          </button>
          <div className="mp-or">oder</div>
          <div className="mp-join-row">
            <input
              className="mp-input"
              placeholder="Room Code"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              maxLength={4}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
            <button className="mp-btn secondary" onClick={handleJoinRoom}>
              Join
            </button>
          </div>
        </div>
      </div>
    );

  // --- WAITING ---
  if (screen === 'waiting')
    return (
      <div className="mp-wrapper">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <button className="exit-btn" onClick={() => navigate('/')}>
          ✕
        </button>
        <div className="mp-card">
          <h2 className="mp-subtitle">Raum erstellt</h2>
          <p className="mp-code-label">Teile diesen Code:</p>
          <div className="mp-code">{roomCode}</div>
          <p className="mp-waiting-text">Warte auf Gegner...</p>
          <div className="mp-spinner" />
        </div>
      </div>
    );
  // --- RESULT ---
  if (screen === 'result')
    return (
      <div className="mp-wrapper">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className={`mp-card mp-result-card${showResult ? ' mp-result-card--detail' : ''}`}>
          {disconnected && <p className="mp-error">Gegner hat das Spiel verlassen.</p>}
          {!showResult ? (
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
                <button className="mp-btn secondary" onClick={() => navigate('/')}>
                  Exit
                </button>
                <button className="mp-btn outline" onClick={() => setShowResult(true)}>
                  Result
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mp-result-detail-wrapper">
                {/* Desktop: 3-column grid */}
                <div className="mp-col-result">
                  <div className="mp-col-header-row">
                    <div className="mp-col-header">Du</div>
                    <div className="mp-col-header mp-col-header-center">Richtige Reihenfolge</div>
                    <div className="mp-col-header">Gegner</div>
                  </div>
                  {rightAnswers.map((rightFact, i) => {
                    const myFact = myAnswers[i];
                    const opFact = opponentAnswers[i];
                    const myCorrect = myFact?.id === rightFact?.id;
                    const opCorrect = opFact?.id === rightFact?.id;
                    return (
                      <div key={i} className="mp-col-row">
                        <div
                          className={`mp-col-cell mp-col-side ${myCorrect ? 'correct' : 'wrong'}`}
                        >
                          {myFact?.question ?? '—'}
                        </div>
                        <div className="mp-col-cell mp-col-center">
                          <span className="mp-col-rank">{i + 1}</span>
                          <span className="mp-col-q">{rightFact.question}</span>
                          <span className="mp-col-val">
                            {rightFact.answer?.toLocaleString('de-DE')}
                          </span>
                        </div>
                        <div
                          className={`mp-col-cell mp-col-side ${opCorrect ? 'correct' : 'wrong'}`}
                        >
                          {opFact?.question ?? '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Mobile: card list */}
                <div className="mp-comparison">
                  {rightAnswers.map((rightFact, i) => {
                    const myFact = myAnswers[i];
                    const opFact = opponentAnswers[i];
                    const myCorrect = myFact?.id === rightFact?.id;
                    const opCorrect = opFact?.id === rightFact?.id;
                    return (
                      <div
                        key={i}
                        className="mp-compare-card"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="mp-compare-correct">
                          <span className="mp-compare-rank">{i + 1}</span>
                          <span className="mp-compare-question">{rightFact.question}</span>
                          <span className="mp-compare-value">
                            {rightFact.answer?.toLocaleString('de-DE')}
                          </span>
                        </div>
                        <div className="mp-compare-players">
                          <div className={`mp-player-row ${myCorrect ? 'correct' : 'wrong'}`}>
                            <span className="mp-player-label">Du</span>
                            <span className="mp-compare-question">{myFact?.question}</span>
                          </div>
                          <div className={`mp-player-row ${opCorrect ? 'correct' : 'wrong'}`}>
                            <span className="mp-player-label">Gegner</span>
                            <span className="mp-compare-question">{opFact?.question}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mp-result-buttons">
                <button className="mp-btn secondary" onClick={() => navigate('/')}>
                  Exit
                </button>
                <button className="mp-btn outline" onClick={() => setShowResult(false)}>
                  ← Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );

  // --- GAME ---
  return (
    <div className="game-wrapper">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <button className="exit-btn" onClick={() => navigate('/')}>
        ✕
      </button>
      {disconnected && <div className="mp-disconnect-banner">Gegner hat das Spiel verlassen.</div>}
      <div className="question-stack">
        <QuestionStack
          facts={facts}
          currentIndex={currentIndex}
          keyboardSelected={keyboardSelected}
          emptyIcon="✓"
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
          {hardcore && timeLeft !== null && !submitted && (
            <div
              className={`game-timer${timeLeft <= 10 ? ' danger' : timeLeft <= 20 ? ' warning' : ''}`}
            >
              {timeLeft}
            </div>
          )}
          {submitted ? (
            <div className="mp-waiting-submitted">
              <div className="mp-spinner" />
              <p>Warten auf Gegner...</p>
            </div>
          ) : (
            <button className="submit-btn" onClick={handleSubmit} disabled={!allAnswered}>
              Submit
            </button>
          )}
          <p className="keyboard-hint">
            Leertaste = Karte nehmen &nbsp;|&nbsp; 1-{facts.length} = Position wählen &nbsp;|&nbsp;
            Entf = entfernen
          </p>
        </div>
      </div>
    </div>
  );
}

export default MultiplayerPage;
