interface MultiplayerLobbyProps {
  joinInput: string;
  onJoinInputChange: (value: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onExit: () => void;
}

export function MultiplayerLobby({
  joinInput,
  onJoinInputChange,
  onCreateRoom,
  onJoinRoom,
  onExit,
}: MultiplayerLobbyProps) {
  return (
    <div className="mp-wrapper">
      <button className="exit-btn" onClick={onExit} aria-label="Verlassen">
        ✕
      </button>
      <div className="mp-card">
        <h1 className="mp-title">Multiplayer</h1>
        <div className="mp-divider" />
        <button className="mp-btn primary" onClick={onCreateRoom}>
          <span aria-hidden="true">🎮</span> Create Room
        </button>
        <div className="mp-or">oder</div>
        <div className="mp-join-row">
          <input
            className="mp-input"
            placeholder="Room Code"
            aria-label="Raumcode"
            value={joinInput}
            onChange={(event) => onJoinInputChange(event.target.value)}
            maxLength={4}
            onKeyDown={(event) => event.key === 'Enter' && onJoinRoom()}
          />
          <button className="mp-btn secondary" onClick={onJoinRoom}>
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
