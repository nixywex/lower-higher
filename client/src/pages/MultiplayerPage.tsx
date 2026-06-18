import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
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
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [myOrder, setMyOrder] = useState<Fact[]>([]);
  const [opponentOrder, setOpponentOrder] = useState<Fact[]>([]);

  useEffect(() => {
    socket = io('http://localhost:3000');

    socket.on('roomCode', ({ code }: { code: string }) => {
      setRoomCode(code);
      setScreen('waiting');
    });

    socket.on('roomReady', ({ facts }: { facts: Fact[] }) => {
      setFacts(facts);
      setSortedAnswers(new Array(facts.length).fill(null));
      setScreen('game');
    });

    socket.on(
      'gameResult',
      ({
        rightAnswers,
        scores,
        orders,
        hostId,
        guestId,
      }: {
        rightAnswers: Fact[];
        scores: Record<string, number>;
        orders: Record<string, Fact[]>;
        hostId: string;
        guestId: string;
      }) => {
        const myId = socket!.id;
        const opponentId = myId === hostId ? guestId : hostId;
        setMyScore(scores[myId!] ?? 0);
        setOpponentScore(scores[opponentId] ?? 0);
        setMyOrder(orders[myId!] ?? []);
        setOpponentOrder(orders[opponentId] ?? []);
        setRightAnswers(rightAnswers);
        setWaitingForOpponent(false);
        setScreen('result');
      }
    );

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
    setWaitingForOpponent(true);
  };

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
        <div className="popup-overlay">
          <div className="popup mp-result-popup">
            {disconnected && <p className="mp-error">Gegner hat das Spiel verlassen.</p>}
            <h2>Ergebnis</h2>

            <div className="mp-result-grid">
              {/* Kolona levo — Du */}
              <div className="mp-result-side">
                <span className="mp-grid-label">Du</span>
                {myOrder.map((fact, i) => (
                  <div
                    key={fact.id}
                    className={`result-item ${fact.id === rightAnswers[i]?.id ? 'correct-row' : 'wrong-row'}`}
                  >
                    <span className="result-rank">{i + 1}.</span>
                    <span className="result-question">{fact.question}</span>
                  </div>
                ))}
              </div>

              {/* Kolona sredina — tačan redosled */}
              <div className="mp-result-center">
                <span className="mp-grid-label">✓ Richtig</span>
                {rightAnswers.map((fact, i) => (
                  <div key={fact.id} className="result-item">
                    <span className="result-rank">{i + 1}.</span>
                    <span className="result-question">{fact.question}</span>
                    <span className="result-answer">{fact.answer}</span>
                  </div>
                ))}
              </div>

              {/* Kolona desno — Gegner */}
              <div className="mp-result-side">
                <span className="mp-grid-label">Gegner</span>
                {opponentOrder.map((fact, i) => (
                  <div
                    key={fact.id}
                    className={`result-item ${fact.id === rightAnswers[i]?.id ? 'correct-row' : 'wrong-row'}`}
                  >
                    <span className="result-rank">{i + 1}.</span>
                    <span className="result-question">{fact.question}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scorevi */}
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

            <div className="popup-buttons">
              <button className="popup-btn secondary" onClick={() => navigate('/')}>
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // --- GAME ---
  return (
    <div className="game-wrapper">
      <button className="exit-btn" onClick={() => navigate('/')}>
        ✕
      </button>
      {waitingForOpponent && <div className="mp-waiting-banner">⏳ Warte auf Gegner...</div>}
      {disconnected && <div className="mp-disconnect-banner">Gegner hat das Spiel verlassen.</div>}
      <div className="question-stack">
        {facts.slice(currentIndex, currentIndex + 3).map((fact, i) => (
          <div
            key={fact.id}
            className={`question-card ${i === 0 ? 'active' : ''}`}
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
        <div className="question-counter">
          {currentIndex + 1} / {facts.length}
        </div>
      </div>
      <div className="game-area">
        <div className="timeline-area">
          <span className="timeline-label top">MAX</span>
          <div className="timeline-slots">
            {sortedAnswers.map((slot, i) => (
              <div
                key={i}
                className={`timeline-slot ${slot ? 'filled' : ''} ${dragOverSlot === i ? 'drag-over' : ''} ${pulsedSlot === i ? 'pulse' : ''}`}
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
        </div>
      </div>
    </div>
  );
}

export default MultiplayerPage;
