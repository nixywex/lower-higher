import { useCallback, useState } from 'react';
import type { FactSummary } from '../types';
import {
  autoFillRemaining as fillRemainingSlots,
  dropOnSlot as calculateDrop,
} from '../utils/gameLogic';

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

      if (dragSource !== null) {
        const result = calculateDrop({
          sortedAnswers,
          facts,
          currentIndex,
          dragItem,
          dragSource,
          slotIndex,
          hardcore,
        });

        setSortedAnswers(result.sortedAnswers);
        setFacts(result.facts);
        setCurrentIndex(result.currentIndex);

        if (dragSource === 'stack' && result.sortedAnswers !== sortedAnswers) {
          setPulsedSlot(slotIndex);
          setTimeout(() => setPulsedSlot(null), 400);
        }
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

  const autoFillRemaining = useCallback(() => {
    const updated = fillRemainingSlots(facts, currentIndex, sortedAnswers);
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
