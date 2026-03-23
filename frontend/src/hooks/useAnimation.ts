import { useRef, useEffect, useCallback } from 'react';

type FrameCallback = (timestamp: number) => void;

export function useAnimation(callback: FrameCallback, active: boolean): void {
  const rafRef = useRef<number>(0);
  const callbackRef = useRef<FrameCallback>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const loop = useCallback((timestamp: number) => {
    callbackRef.current(timestamp);
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    if (active) {
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [active, loop]);
}
