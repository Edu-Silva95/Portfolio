import { useEffect, useRef, useState, useCallback } from "react";

// Returns `{ isIdle, reset }` where `isIdle` becomes true after `ms` milliseconds
// of no user interaction (mouse, pointer, touch, keyboard, wheel).
export default function useIdle(ms = 10000) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setIsIdle(true);
    }, ms);
  }, [ms, clear]);

  const reset = useCallback(() => {
    setIsIdle(false);
    start();
  }, [start]);

  useEffect(() => {
    mountedRef.current = true;
    start();

    const handler = () => {
      if (isIdle) setIsIdle(false);
      start();
    };

    const events = ["mousemove", "pointermove", "mousedown", "touchstart", "keydown", "wheel"];
    events.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));

    return () => {
      mountedRef.current = false;
      clear();
      events.forEach((ev) => window.removeEventListener(ev, handler));
    };
  }, [start, clear, isIdle]);

  return { isIdle, reset };
}
