import { useEffect, useMemo, useRef } from "react";
// This hook provides long-press context menu functionality for touch devices. It listens for pointer events and triggers the provided onLongPress callback when a long press is detected, while also handling movement thresholds to prevent accidental triggers during scrolling or dragging.
const isCoarsePointer = () => {
  if (typeof window === "undefined") return false;
  const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const touchPoints = typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 0;
  return coarse || touchPoints;
};
export default function useLongPressContextMenu({
  enabled = true,
  ignoreClosestSelector = null,
  onLongPress,
  delayMs = 1000,
  moveThresholdPx = 8,
} = {}) {
  const stateRef = useRef({
    timer: null,
    startX: 0,
    startY: 0,
    fired: false,
  });

  const isEnabled = useMemo(() => {
    if (!enabled) return false;
    return isCoarsePointer();
  }, [enabled]);

  const clear = () => {
    const st = stateRef.current;
    if (st.timer) {
      window.clearTimeout(st.timer);
      st.timer = null;
    }
  };

  useEffect(() => {
    return () => {
      clear();
      stateRef.current.fired = false;
    };
  }, []);

  const onPointerDown = (e) => {
    if (!isEnabled) return;
    if (typeof onLongPress !== "function") return;

    const target = e.target;
    if (ignoreClosestSelector && target?.closest?.(ignoreClosestSelector)) return;

    clear();

    stateRef.current.startX = e.clientX;
    stateRef.current.startY = e.clientY;
    stateRef.current.fired = false;

    const x = e.clientX;
    const y = e.clientY;

    const onMove = (ev) => {
      const dx = ev.clientX - stateRef.current.startX;
      const dy = ev.clientY - stateRef.current.startY;
      if (Math.hypot(dx, dy) > moveThresholdPx) {
        clear();
        cleanup();
      }
    };

    const onUp = () => {
      clear();
      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);

    stateRef.current.timer = window.setTimeout(() => {
      stateRef.current.timer = null;
      stateRef.current.fired = true;
      onLongPress({ x, y });
      cleanup();
    }, delayMs);
  };

  const onClickCapture = (e) => {
    if (!isEnabled) return;
    if (!stateRef.current.fired) return;
    stateRef.current.fired = false;
    e.preventDefault();
    e.stopPropagation();
  };

  return {
    onPointerDown,
    onClickCapture,
  };
}
