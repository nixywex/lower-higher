import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
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
  const [error, setError] = useState('');
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

  useEffect(() => {
    socket = io(API_URL);

    socket.on('roomCode', ({ code }: { code: string }) => {
      setRoomCode(code);
      setScreen('waiting');
    });

    socket.on('roomReady', ({ facts }: { facts: Fact[] }) => {
      setFacts(facts);
      setSortedAnswers(new Array(facts.length).fill(null));
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

    socket.on('playerDisconnected', () => setDisconnected(true));

    socket.on('error', ({ message }: { message: string }) => setError(message));

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, []);

  const handleCreateRoom = () => {
    setError('');
    socket?.emit('createRoom');
  };

  const handleJoinRoom = () => {
    setError('');
    socket?.emit('joinRoom', { code: joinInput.toUpperCase() });
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
      }
    } else if (typeof dragSource === 'number') {
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
    const ids = sortedAnswers.filter(Boolean).map((f) => f!.id);
    socket?.emit('submitOrder', { ids });
    setSubmitted(true);
  };

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
  }, [dragItem, sortedAnswers, facts.length, currentIndex]);

  // --- LOBBY ---
  if (screen === 'lobby')
    return (
      <div className="mp-wrapper">
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
          {error && <p className="mp-error">{error}</p>}
        </div>
      </div>
    );

  // --- WAITING ---
  if (screen === 'waiting')
    return (
      <div className="mp-wrapper">
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
        <div className="mp-card mp-result-card">
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
              <div className="result-columns">
                <div className="result-col">
                  <h3>Du</h3>
                  {myAnswers.map((fact, i) => {
                    const isCorrect = fact?.id === rightAnswers[i]?.id;
                    return (
                      <div
                        key={fact.id}
                        className={`result-row ${isCorrect ? 'correct' : 'wrong'}`}
                        style={{ animationDelay: `${i * 150}ms` }}
                      >
                        <span className="result-rank">{i + 1}.</span>
                        <span className="result-question">{fact.question}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="result-col middle">
                  <h3>Richtig</h3>
                  {rightAnswers.map((fact, i) => (
                    <div
                      key={fact.id}
                      className="result-row correct"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      <span className="result-rank">{i + 1}.</span>
                      <span className="result-question">{fact.question}</span>
                      <span className="result-answer">{fact.answer}</span>
                    </div>
                  ))}
                </div>
                <div className="result-col">
                  <h3>Gegner</h3>
                  {opponentAnswers.map((fact, i) => {
                    const isCorrect = fact?.id === rightAnswers[i]?.id;
                    return (
                      <div
                        key={fact.id}
                        className={`result-row ${isCorrect ? 'correct' : 'wrong'}`}
                        style={{ animationDelay: `${i * 150}ms` }}
                      >
                        <span className="result-rank">{i + 1}.</span>
                        <span className="result-question">{fact.question}</span>
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
      <button className="exit-btn" onClick={() => navigate('/')}>
        ✕
      </button>
      <div className="progress-bar-wrapper">
        <div
          className="progress-bar-fill"
          style={{ height: `${(currentIndex / facts.length) * 100}%` }}
        />
      </div>
      {disconnected && <div className="mp-disconnect-banner">Gegner hat das Spiel verlassen.</div>}
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
      </div>
      <div className="game-area">
        <div className="timeline-area">
          <span className="timeline-label top">MAX</span>
          <div className="timeline-slots">
            {sortedAnswers.map((slot, i) => (
              <div
                key={i}
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
