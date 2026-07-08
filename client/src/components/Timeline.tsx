import type { FactSummary } from '../types';
import './Timeline.css';

interface TimelineProps {
  sortedAnswers: (FactSummary | null)[];
  factsLength: number;
  currentIndex: number;
  hardcore: boolean;
  dragOverSlot: number | null;
  pulsedSlot: number | null;
  selectedSlot: number | null;
  waveActive?: boolean;
  onDragOverSlot: (slotIndex: number) => void;
  onDragLeaveSlot: () => void;
  onDropSlot: (slotIndex: number) => void;
  onSlotClick: (slotIndex: number, slot: FactSummary | null) => void;
  onChipDragStart: (fact: FactSummary, slotIndex: number) => void;
}

export function Timeline({
  sortedAnswers,
  factsLength,
  currentIndex,
  hardcore,
  dragOverSlot,
  pulsedSlot,
  selectedSlot,
  waveActive = false,
  onDragOverSlot,
  onDragLeaveSlot,
  onDropSlot,
  onSlotClick,
  onChipDragStart,
}: TimelineProps) {
  return (
    <div className="timeline-area">
      <span className="timeline-label top">MAX</span>
      <div className="slots-row">
        <div
          className="progress-bar-wrapper"
          style={{ '--progress': `${(currentIndex / factsLength) * 100}%` } as React.CSSProperties}
        >
          <div className="progress-bar-fill" />
        </div>
        <div className="timeline-slots">
          {sortedAnswers.map((slot, i) => (
            <div key={i} className="slot-row">
              <div
                className={`timeline-slot ${slot ? 'filled' : ''} ${dragOverSlot === i ? 'drag-over' : ''} ${pulsedSlot === i ? 'pulse' : ''} ${waveActive ? 'wave' : ''} ${selectedSlot === i ? 'keyboard-selected-slot' : ''}`}
                style={waveActive ? { animationDelay: `${i * 100}ms` } : {}}
                onDragOver={(e) => {
                  e.preventDefault();
                  onDragOverSlot(i);
                }}
                onDragLeave={onDragLeaveSlot}
                onDrop={() => onDropSlot(i)}
                onClick={() => onSlotClick(i, slot)}
              >
                {slot ? (
                  <div
                    className={`answer-chip placed${hardcore ? ' locked' : ''}`}
                    draggable={!hardcore}
                    onDragStart={!hardcore ? () => onChipDragStart(slot, i) : undefined}
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
  );
}
