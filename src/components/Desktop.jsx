import { useEffect, useRef, useState } from "react";
import DesktopIcon from "./DesktopIcon";

export default function Desktop({
  icons = [],
  draggingPositions = {},
  selectedIds = [],
  onSelect = () => {},
  onSelectMultiple = () => {},
  onIconClick = () => {},
  onContextMenuRequested = () => {},
  onMove = () => {},
  onDrop = () => {},
  onClearSelection = () => {},
  doubleClickOnly = [],
}) {
  const containerRef = useRef(null);
  const [marquee, setMarquee] = useState(null);
  const suppressClickRef = useRef(false);
  const groupPreviewFrame = useRef(null);
  const groupPreviewNext = useRef(null);

  const clearGroupPreview = (excludeId = null) => {
    const host = containerRef.current;
    if (!host) return;
    selectedIds.forEach((id) => {
      if (excludeId && id === excludeId) return;
      const node = host.querySelector(`[data-id="${id}"]`);
      if (!node) return;
      node.style.transform = "";
      node.style.willChange = "";
      node.style.opacity = "";
    });
    if (excludeId) {
      const dragged = host.querySelector(`[data-id="${excludeId}"]`);
      if (dragged) dragged.style.opacity = "";
    }
  };

  const applyGroupPreview = (draggedId, dx, dy) => {
    const host = containerRef.current;
    if (!host) return;
    selectedIds.forEach((id) => {
      if (id === draggedId) return;
      const node = host.querySelector(`[data-id="${id}"]`);
      if (!node) return;
      node.style.willChange = "transform";
      node.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      node.style.opacity = "0.7";
    });
    const dragged = host.querySelector(`[data-id="${draggedId}"]`);
    if (dragged) dragged.style.opacity = "0.7";
  };

  const scheduleGroupPreview = (draggedId, dx, dy) => {
    groupPreviewNext.current = { draggedId, dx, dy };
    if (groupPreviewFrame.current) return;
    groupPreviewFrame.current = requestAnimationFrame(() => {
      if (groupPreviewNext.current) {
        const { draggedId: did, dx: ndx, dy: ndy } = groupPreviewNext.current;
        applyGroupPreview(did, ndx, ndy);
      }
      groupPreviewFrame.current = null;
    });
  };

  useEffect(() => {
    return () => {
      if (groupPreviewFrame.current) cancelAnimationFrame(groupPreviewFrame.current);
    };
  }, []);

  const updateMarquee = (startX, startY, endX, endY) => {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    setMarquee({ startX, startY, x, y, width, height });
  };

  const selectInRect = (rect) => {
    const host = containerRef.current;
    if (!host) return;
    const nodes = host.querySelectorAll("[data-id]");
    const nextSelected = [];
    nodes.forEach((node) => {
      const id = node.getAttribute("data-id");
      if (!id) return;
      const box = node.getBoundingClientRect();
      const intersects = box.left <= rect.right && box.right >= rect.left && box.top <= rect.bottom && box.bottom >= rect.top;
      if (intersects) nextSelected.push(id);
    });
    onSelectMultiple(nextSelected);
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest("[data-id]")) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    suppressClickRef.current = true;
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    updateMarquee(startX, startY, startX, startY);
    onClearSelection();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e) => {
    if (!marquee) return;
    const rect = containerRef.current?.getBoundingClientRect();
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
  };

  const handlePointerUp = (e) => {
    if (!marquee) return;
    const rect = containerRef.current?.getBoundingClientRect();
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
      onClearSelection();
    }
    setMarquee(null);
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleIconMove = (id, nx, ny) => {
    const isGroup = selectedIds.includes(id) && selectedIds.length > 1;
    if (!isGroup) {
      clearGroupPreview();
      if (typeof onMove === "function") onMove(id, nx, ny);
      return;
    }

    const dragged = icons.find((it) => it.id === id);
    if (!dragged) return;
    const dx = nx - dragged.x;
    const dy = ny - dragged.y;
    scheduleGroupPreview(id, dx, dy);
  };

  const handleIconDrop = (id, nx, ny) => {
    clearGroupPreview(id);
    onDrop(id, nx, ny);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onClick={() => {
        if (suppressClickRef.current) return;
        onClearSelection();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenuRequested({ x: e.clientX, y: e.clientY, targetId: null });
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {marquee ? (
        <div
          className="pointer-events-none absolute border border-[#66a6ff] bg-[#66a6ff]/20"
          style={{ left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height }}
        />
      ) : null}
      {icons.map((it) => {
        const preview = draggingPositions[it.id];
        const displayX = preview ? preview.x : it.x;
        const displayY = preview ? preview.y : it.y;
        return (
          <DesktopIcon
            key={it.id}
            id={it.id}
            label={it.label}
            icon={it.icon}
            x={displayX}
            y={displayY}
            isShortcut={!!it.isShortcut}
            selected={selectedIds.includes(it.id)}
            onSelect={() => onSelect(it.id)}
            {...(doubleClickOnly.includes(it.id) || it.isShortcut
              ? { onDoubleClick: () => onIconClick(it.id) }
              : { onClick: () => onIconClick(it.id) })}
            onMove={(nx, ny) => handleIconMove(it.id, nx, ny)}
            onDrop={(nx, ny) => handleIconDrop(it.id, nx, ny)}
            onContextMenu={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              onContextMenuRequested({ x: ev.clientX, y: ev.clientY, targetId: it.id });
            }}
          />
        );
      })}
    </div>
  );
}
