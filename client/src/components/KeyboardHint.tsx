import './KeyboardHint.css';

interface KeyboardHintProps {
  factsCount: number;
}

export function KeyboardHint({ factsCount }: KeyboardHintProps) {
  return (
    <p className="keyboard-hint">
      Leertaste = Karte nehmen &nbsp;|&nbsp; 1-{factsCount} = Position wählen &nbsp;|&nbsp; Entf =
      entfernen
    </p>
  );
}
