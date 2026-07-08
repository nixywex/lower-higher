import type { FactSummary } from '../types';
import './QuestionStack.css';

interface QuestionStackProps {
  facts: FactSummary[];
  currentIndex: number;
  keyboardSelected: boolean;
  emptyIcon?: string;
  onDragStart: () => void;
  onCardClick: () => void;
}

export function QuestionStack({
  facts,
  currentIndex,
  keyboardSelected,
  emptyIcon,
  onDragStart,
  onCardClick,
}: QuestionStackProps) {
  if (currentIndex >= facts.length) {
    return (
      <div className="stack-done">
        {emptyIcon && <span className="stack-done-icon">{emptyIcon}</span>}
        <p>Alle Fragen platziert!</p>
        <p className="stack-done-sub">
          Drücke <strong>Submit</strong>, um fortzufahren.
        </p>
      </div>
    );
  }

  return (
    <>
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
          onDragStart={i === 0 ? onDragStart : undefined}
          onClick={i === 0 ? onCardClick : undefined}
        >
          {i === 0 && <p>{fact.question}</p>}
        </div>
      ))}
    </>
  );
}
