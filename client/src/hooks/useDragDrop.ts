import { useCallback, useState } from 'react';
import type { FactSummary } from '../types';

export type DragSource = 'stack' | number | null;

export function useDragDrop(hardcore: boolean) {
  const [facts, setFacts] = useState<FactSummary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortedAnswers, setSortedAnswers] = useState<(FactSummary | null)[]>([]);
  const [dragItem, setDragItem] = useState<FactSummary | null>(null);
  const [dragSource, setDragSource] = useState<DragSource>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [pulsedSlot, setPulsedSlot] = useState<number | null>(null);

  const allAnswered = sortedAnswers.length > 0 && sortedAnswers.every((slot) => slot !== null);

  const loadFacts = useCallback((newFacts: FactSummary[]) => {
    setFacts(newFacts);
    setSortedAnswers(new Array(newFacts.length).fill(null));
    setCurrentIndex(0);
    setDragItem(null);
    setDragSource(null);
  }, []);

  const startDragFromStack = useCallback(() => {
    if (currentIndex >= facts.length) return;
    setDragItem(facts[currentIndex]);
    setDragSource('stack');
  }, [facts, currentIndex]);

  const startDragFromSlot = useCallback((fact: FactSummary, slotIndex: number) => {
    setDragItem(fact);
    setDragSource(slotIndex);
  }, []);

  const cancelDrag = useCallback(() => {
    setDragItem(null);
    setDragSource(null);
  }, []);

  const dropOnSlot = useCallback(
    (slotIndex: number) => {
      if (!dragItem) return;
      const updated = [...sortedAnswers];

      if (dragSource === 'stack') {
        if (!updated[slotIndex]) {
          updated[slotIndex] = dragItem;
          setSortedAnswers(updated);
          setPulsedSlot(slotIndex);
          setTimeout(() => setPulsedSlot(null), 400);
          setCurrentIndex((i) => i + 1);
        } else if (!hardcore) {
          const displaced = updated[slotIndex];
          updated[slotIndex] = dragItem;
          setSortedAnswers(updated);
          const newFacts = [...facts];
          newFacts[currentIndex] = displaced!;
          setFacts(newFacts);
          setPulsedSlot(slotIndex);
          setTimeout(() => setPulsedSlot(null), 400);
        }
      } else if (typeof dragSource === 'number' && !hardcore) {
        const occupant = updated[slotIndex];
        updated[slotIndex] = dragItem;
        updated[dragSource] = occupant ?? null;
        setSortedAnswers(updated);
      }

      setDragItem(null);
      setDragSource(null);
      setDragOverSlot(null);
    },
    [dragItem, dragSource, sortedAnswers, facts, currentIndex, hardcore]
  );

  // Puts the exact fact that occupied `slotIndex` back at the top of the
  // stack and rewinds currentIndex by one slot — regardless of *which* slot
  // was cleared. Keying off "the most recently drawn card" instead (as the
  // old duplicated code in both pages did) breaks as soon as slots are
  // filled out of order, since the wrong fact gets reintroduced while the
  // removed one stays orphaned in another slot.
  const removeFromSlot = useCallback(
    (slotIndex: number) => {
      const removed = sortedAnswers[slotIndex];
      if (!removed) return;

      const newIndex = currentIndex - 1;
      const updatedAnswers = [...sortedAnswers];
      updatedAnswers[slotIndex] = null;

      const newFacts = [...facts];
      newFacts[newIndex] = removed;

      setSortedAnswers(updatedAnswers);
      setFacts(newFacts);
      setCurrentIndex(newIndex);
    },
    [sortedAnswers, facts, currentIndex]
  );

  const autoFillRemaining = useCallback(() => {
    const remaining = facts.slice(currentIndex).sort(() => Math.random() - 0.5);
    const updated = [...sortedAnswers];
    let ri = 0;
    for (let i = 0; i < updated.length; i++) {
      if (!updated[i] && remaining[ri]) updated[i] = remaining[ri++];
    }
    setSortedAnswers(updated);
    return updated.filter((f): f is FactSummary => f !== null).map((f) => f.id);
  }, [facts, currentIndex, sortedAnswers]);

  const submittedIds = useCallback(
    () => sortedAnswers.filter((f): f is FactSummary => f !== null).map((f) => f.id),
    [sortedAnswers]
  );

  return {
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
  };
}
