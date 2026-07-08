import { useEffect, useState } from 'react';
import type { FactSummary } from '../types';

interface UseGameKeyboardOptions {
  active: boolean;
  hardcore: boolean;
  facts: FactSummary[];
  sortedAnswers: (FactSummary | null)[];
  dragItem: FactSummary | null;
  allAnswered: boolean;
  startDragFromStack: () => void;
  startDragFromSlot: (fact: FactSummary, slotIndex: number) => void;
  dropOnSlot: (slotIndex: number) => void;
  removeFromSlot: (slotIndex: number) => void;
  onSubmit: () => void;
}

// wires up space/enter/number/delete shortcuts so the game is playable without dragging
export function useGameKeyboard({
  active,
  hardcore,
  facts,
  sortedAnswers,
  dragItem,
  allAnswered,
  startDragFromStack,
  startDragFromSlot,
  dropOnSlot,
  removeFromSlot,
  onSubmit,
}: UseGameKeyboardOptions) {
  const [keyboardSelected, setKeyboardSelected] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        startDragFromStack();
        setKeyboardSelected(true);
      }

      if (e.key === 'Enter' && allAnswered && !dragItem) {
        onSubmit();
      }

      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= facts.length) {
        if (dragItem) {
          dropOnSlot(num - 1);
          setKeyboardSelected(false);
          setSelectedSlot(null);
        } else if (sortedAnswers[num - 1] && !hardcore) {
          startDragFromSlot(sortedAnswers[num - 1]!, num - 1);
          setKeyboardSelected(true);
          setSelectedSlot(num - 1);
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !hardcore) {
        const firstFilled = sortedAnswers.findIndex((s) => s !== null);
        if (firstFilled !== -1) {
          removeFromSlot(firstFilled);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    active,
    hardcore,
    facts,
    sortedAnswers,
    dragItem,
    allAnswered,
    startDragFromStack,
    startDragFromSlot,
    dropOnSlot,
    removeFromSlot,
    onSubmit,
  ]);

  return { keyboardSelected, setKeyboardSelected, selectedSlot, setSelectedSlot };
}
