export type DragSource = 'stack' | number;

export interface DropOnSlotParams<T> {
  sortedAnswers: (T | null)[];
  facts: T[];
  currentIndex: number;
  dragItem: T;
  dragSource: DragSource;
  slotIndex: number;
  hardcore: boolean;
}

export interface DropOnSlotResult<T> {
  sortedAnswers: (T | null)[];
  facts: T[];
  currentIndex: number;
}

// figures out the new board state after dropping a card on a slot: places it if the
// slot is empty, swaps it with whatever's there otherwise (unless hardcore mode blocks that)
export function dropOnSlot<T>({
  sortedAnswers,
  facts,
  currentIndex,
  dragItem,
  dragSource,
  slotIndex,
  hardcore,
}: DropOnSlotParams<T>): DropOnSlotResult<T> {
  const updated = [...sortedAnswers];

  if (dragSource === 'stack') {
    if (!updated[slotIndex]) {
      updated[slotIndex] = dragItem;
      return { sortedAnswers: updated, facts, currentIndex: currentIndex + 1 };
    }
    if (hardcore) {
      return { sortedAnswers, facts, currentIndex };
    }
    const displaced = updated[slotIndex];
    updated[slotIndex] = dragItem;
    const newFacts = [...facts];
    newFacts[currentIndex] = displaced!;
    return { sortedAnswers: updated, facts: newFacts, currentIndex };
  }

  if (hardcore) {
    return { sortedAnswers, facts, currentIndex };
  }
  const occupant = updated[slotIndex];
  updated[slotIndex] = dragItem;
  updated[dragSource] = occupant ?? null;
  return { sortedAnswers: updated, facts, currentIndex };
}

// shuffles the still-unplaced facts into the empty slots, used when the hardcore timer hits 0
export function autoFillRemaining<T>(
  facts: T[],
  currentIndex: number,
  sortedAnswers: (T | null)[]
): (T | null)[] {
  const remaining = facts.slice(currentIndex).sort(() => Math.random() - 0.5);
  const updated = [...sortedAnswers];
  let ri = 0;
  for (let i = 0; i < updated.length; i++) {
    if (!updated[i] && remaining[ri]) updated[i] = remaining[ri++];
  }
  return updated;
}
