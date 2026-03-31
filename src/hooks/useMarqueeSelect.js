import { useCallback, useMemo, useState } from "react";

const defaultIntersects = (box, rect) =>
  box.left <= rect.right &&
  box.right >= rect.left &&
  box.top <= rect.bottom &&
  box.bottom >= rect.top;

export default function useMarqueeSelect({
  enabled = true,
  containerRef,
  itemSelector,
  getItemId = (node) => node?.getAttribute?.("data-id"),
  onSelectionChange,
  onClearSelection,
  isCoarsePointer = false,
  suppressClickRef = null,
  intersects = defaultIntersects,
} = {}) {
  const [marquee, setMarquee] = useState(null);

  const coarse = useMemo(() => {
    return typeof isCoarsePointer === "function" ? isCoarsePointer() : !!isCoarsePointer;
  }, [isCoarsePointer]);

  const updateMarquee = useCallback((startX, startY, endX, endY) => {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    setMarquee({ startX, startY, x, y, width, height });
  }, []);

  const selectInRect = useCallback((rect) => {
    const host = containerRef?.current;
    if (!host) return;
    const nodes = host.querySelectorAll(itemSelector);
    const nextSelected = [];

    nodes.forEach((node) => {
      const id = getItemId(node);
      if (!id) return;
      const box = node.getBoundingClientRect();
      if (intersects(box, rect)) nextSelected.push(id);
    });

    if (typeof onSelectionChange === "function") onSelectionChange(nextSelected);
  }, [containerRef, itemSelector, getItemId, intersects, onSelectionChange]);

  const handlePointerDown = useCallback((e) => {
    if (!enabled) return;
    if (coarse) return;
    if (e.button !== 0) return;
    if (itemSelector && e.target?.closest?.(itemSelector)) return;

    const rect = containerRef?.current?.getBoundingClientRect?.();
    if (!rect) return;

    if (suppressClickRef) suppressClickRef.current = true;

    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    updateMarquee(startX, startY, startX, startY);

    if (typeof onClearSelection === "function") onClearSelection();
    else if (typeof onSelectionChange === "function") onSelectionChange([]);

    e.currentTarget?.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }, [enabled, coarse, itemSelector, containerRef, suppressClickRef, updateMarquee, onClearSelection, onSelectionChange]);

  const handlePointerMove = useCallback((e) => {
    if (!marquee) return;
    const rect = containerRef?.current?.getBoundingClientRect?.();
    if (!rect) return;

    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    updateMarquee(marquee.startX, marquee.startY, endX, endY);

    const selectionRect = {
      left: rect.left + Math.min(marquee.startX, endX),
      top: rect.top + Math.min(marquee.startY, endY),
      right: rect.left + Math.max(marquee.startX, endX),
      bottom: rect.top + Math.max(marquee.startY, endY),
    };

    selectInRect(selectionRect);
  }, [marquee, containerRef, updateMarquee, selectInRect]);

  const handlePointerUp = useCallback((e) => {
    if (!marquee) return;
    const rect = containerRef?.current?.getBoundingClientRect?.();

    if (!rect) {
      setMarquee(null);
      return;
    }

    const selectionRect = {
      left: rect.left + marquee.x,
      top: rect.top + marquee.y,
      right: rect.left + marquee.x + marquee.width,
      bottom: rect.top + marquee.y + marquee.height,
    };

    selectInRect(selectionRect);

    if (marquee.width === 0 && marquee.height === 0) {
      if (typeof onClearSelection === "function") onClearSelection();
      else if (typeof onSelectionChange === "function") onSelectionChange([]);
    }

    setMarquee(null);

    if (suppressClickRef) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    e.currentTarget?.releasePointerCapture?.(e.pointerId);
  }, [marquee, containerRef, selectInRect, onClearSelection, onSelectionChange, suppressClickRef]);

  return {
    marquee,
    setMarquee,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
  };
}
