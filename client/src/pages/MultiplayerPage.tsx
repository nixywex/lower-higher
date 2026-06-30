import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ToastContainer';
import './MultiplayerPage.css';

interface Fact {
  id: number;
  question: string;
  answer?: number;
}

type Screen = 'lobby' | 'waiting' | 'game' | 'result';

let socket: Socket | null = null;

function MultiplayerPage() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('lobby');
  const [joinInput, setJoinInput] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const { toasts, addToast, removeToast } = useToast();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortedAnswers, setSortedAnswers] = useState<(Fact | null)[]>([]);
  const [dragItem, setDragItem] = useState<Fact | null>(null);
  const [dragSource, setDragSource] = useState<'stack' | number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [pulsedSlot, setPulsedSlot] = useState<number | null>(null);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [rightAnswers, setRightAnswers] = useState<Fact[]>([]);
  const [disconnected, setDisconnected] = useState(false);
  const didWin = (myScore ?? 0) > (opponentScore ?? 0);
  const isDraw = myScore === opponentScore;
  const [submitted, setSubmitted] = useState(false);
  const [myAnswers, setMyAnswers] = useState<Fact[]>([]);
  const [opponentAnswers, setOpponentAnswers] = useState<Fact[]>([]);
  const [keyboardSelected, setKeyboardSelected] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hardcore, setHardcore] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const autoSubmitted = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    socket = io(API_URL);

    socket.on('roomCode', ({ code }: { code: string }) => {
      setRoomCode(code);
      setScreen('waiting');
    });

    socket.on('roomReady', ({ facts, hardcore }: { facts: Fact[]; hardcore: boolean }) => {
      setFacts(facts);
      setSortedAnswers(new Array(facts.length).fill(null));
      setHardcore(hardcore);
      setScreen('game');
    });

    socket.on('gameResult', (data) => {
      const { rightAnswers, scores, hostId, guestId, orders } = data;
      const myId = socket!.id;
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
      socket?.disconnect();
      socket = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRoom = () => {
    if (!socket?.connected) {
      addToast('Keine Verbindung zum Server. Bitte warte oder lade die Seite neu.');
      return;
    }
    socket.emit('createRoom', { hardcore: localStorage.getItem('hardcoreMode') === 'true' });
  };

  const handleJoinRoom = () => {
    if (!joinInput.trim()) {
      addToast('Bitte einen Raumcode eingeben.');
      return;
    }
    if (!socket?.connected) {
      addToast('Keine Verbindung zum Server. Bitte warte oder lade die Seite neu.');
      return;
    }
    socket.emit('joinRoom', { code: joinInput.toUpperCase() });
  };

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
      const occupant = updated[slotIndex];
      updated[slotIndex] = dragItem;
      updated[dragSource] = occupant ?? null;
      setSortedAnswers(updated);
    }
    setDragItem(null);
    setDragSource(null);
  };

  const allAnswered = sortedAnswers.length > 0 && sortedAnswers.every((s) => s !== null);

  const handleSubmit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(null);
    const ids = sortedAnswers.filter(Boolean).map((f) => f!.id);
    socket?.emit('submitOrder', { ids });
    setSubmitted(true);
  };

  useEffect(() => {
    if (!hardcore || screen !== 'game') return;
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
  }, [screen]);

  useEffect(() => {
    if (timeLeft !== 0 || autoSubmitted.current || submitted) return;
    autoSubmitted.current = true;
    const remaining = facts.slice(currentIndex).sort(() => Math.random() - 0.5);
    const updated = [...sortedAnswers];
    let ri = 0;
    for (let i = 0; i < updated.length; i++) {
      if (!updated[i] && remaining[ri]) updated[i] = remaining[ri++];
    }
    setSortedAnswers(updated);
    const ids = updated.filter(Boolean).map((f) => f!.id);
    socket?.emit('submitOrder', { ids });
    setSubmitted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'game') return;

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
  }, [dragItem, sortedAnswers, facts, currentIndex]);

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
        {currentIndex >= facts.length ? (
          <div className="stack-done">
            <span className="stack-done-icon">✓</span>
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
                    className={`timeline-slot ${slot ? 'filled' : ''} ${dragOverSlot === i ? 'drag-over' : ''} ${pulsedSlot === i ? 'pulse' : ''} ${selectedSlot === i ? 'keyboard-selected-slot' : ''}`}
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
