import { useCallback, useState } from 'react';

const HARDCORE_KEY = 'hardcoreMode';

export function getHardcoreMode(): boolean {
  return localStorage.getItem(HARDCORE_KEY) === 'true';
}

export function useHardcoreMode() {
  const [hardcore, setHardcore] = useState(getHardcoreMode);

  const toggle = useCallback(() => {
    setHardcore((prev) => {
      const next = !prev;
      localStorage.setItem(HARDCORE_KEY, String(next));
      return next;
    });
  }, []);

  return { hardcore, toggle };
}
