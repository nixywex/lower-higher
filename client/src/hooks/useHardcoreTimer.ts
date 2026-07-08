import { useCallback, useEffect, useRef, useState } from 'react';

interface UseHardcoreTimerOptions {
  /** Whether the countdown should be running right now. */
  active: boolean;
  /** Changing this value (e.g. a new `facts` array, or a screen name) restarts the countdown. */
  resetKey: unknown;
  duration?: number;
  onExpire: () => void;
}

export function useHardcoreTimer({
  active,
  resetKey,
  duration = 60,
  onExpire,
}: UseHardcoreTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    expiredRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);

    const startTime = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
      }
    };

    const initialId = setTimeout(tick, 0);
    timerRef.current = setInterval(tick, 250);

    return () => {
      clearTimeout(initialId);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, resetKey, duration]);

  useEffect(() => {
    if (timeLeft !== 0 || expiredRef.current) return;
    expiredRef.current = true;
    onExpire();
  }, [timeLeft, onExpire]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(null);
  }, []);

  return { timeLeft, stop };
}
