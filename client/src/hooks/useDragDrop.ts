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

  // drops the current card into a slot, swapping with whatever's already there if needed
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

  // puts the removed card back on top of the stack, not wherever it used to be
  // (that's what stops duplicates if slots got filled out of order)
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

  // shuffles the leftover cards into the empty slots, used when the hardcore timer hits 0
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
