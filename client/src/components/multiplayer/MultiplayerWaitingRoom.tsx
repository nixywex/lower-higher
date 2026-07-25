interface MultiplayerWaitingRoomProps {
  roomCode: string;
  onExit: () => void;
}

export function MultiplayerWaitingRoom({ roomCode, onExit }: MultiplayerWaitingRoomProps) {
  return (
    <div className="mp-wrapper">
      <button className="exit-btn" onClick={onExit} aria-label="Verlassen">
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
}
