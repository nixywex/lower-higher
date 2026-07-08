import './GameTimer.css';

interface GameTimerProps {
  timeLeft: number | null;
}

export function GameTimer({ timeLeft }: GameTimerProps) {
  if (timeLeft === null) return null;

  return (
    <div className={`game-timer${timeLeft <= 10 ? ' danger' : timeLeft <= 20 ? ' warning' : ''}`}>
      {timeLeft}
    </div>
  );
}
