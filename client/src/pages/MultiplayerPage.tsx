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
import { GameTimer } from '../components/GameTimer';
import { KeyboardHint } from '../components/KeyboardHint';
import { MultiplayerLobby } from '../components/multiplayer/MultiplayerLobby';
import { MultiplayerWaitingRoom } from '../components/multiplayer/MultiplayerWaitingRoom';
import { MultiplayerResult } from '../components/multiplayer/MultiplayerResult';
import type { Fact, FactSummary } from '../types';
import './MultiplayerPage.css';

type Screen = 'lobby' | 'waiting' | 'game' | 'result';

interface MultiplayerGameResult {
  rightAnswers: Fact[];
  scores: Record<string, number>;
  orders: Record<string, Fact[]>;
  hostId: string;
  guestId: string;
}

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
  const [submitted, setSubmitted] = useState(false);
  const [myAnswers, setMyAnswers] = useState<Fact[]>([]);
  const [opponentAnswers, setOpponentAnswers] = useState<Fact[]>([]);
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

    socket.on('gameResult', (data: MultiplayerGameResult) => {
      const { rightAnswers, scores, hostId, guestId, orders } = data;
      const myId = socket.id;
      if (!myId) return;

      setMyScore(scores[myId] ?? 0);
      const opponentId = myId === hostId ? guestId : hostId;
      setOpponentScore(scores[opponentId] ?? 0);
      setMyAnswers(orders[myId] ?? []);
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
  }, [addToast, loadFacts]);

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

  if (screen === 'lobby')
    return (
      <>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <MultiplayerLobby
          joinInput={joinInput}
          onJoinInputChange={setJoinInput}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onExit={() => navigate('/')}
        />
      </>
    );

  if (screen === 'waiting')
    return (
      <>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <MultiplayerWaitingRoom roomCode={roomCode} onExit={() => navigate('/')} />
      </>
    );

  if (screen === 'result')
    return (
      <>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <MultiplayerResult
          disconnected={disconnected}
          myScore={myScore}
          opponentScore={opponentScore}
          rightAnswers={rightAnswers}
          myAnswers={myAnswers}
          opponentAnswers={opponentAnswers}
          onExit={() => navigate('/')}
        />
      </>
    );

  return (
    <div className="game-wrapper">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <button className="exit-btn" onClick={() => navigate('/')} aria-label="Spiel verlassen">
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
          onCardClick={handleCardClick}
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
          onSlotClick={(index, fact) => handleSlotClick(index, fact !== null)}
          onChipDragStart={startDragFromSlot}
        />
        <div className="action-buttons">
          {hardcore && !submitted && <GameTimer timeLeft={timeLeft} />}
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
          <KeyboardHint factsCount={facts.length} />
        </div>
      </div>
    </div>
  );
}

export default MultiplayerPage;
