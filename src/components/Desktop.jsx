import { useEffect, useRef } from "react";
import DesktopIcon from "./DesktopIcon";
import useLongPressContextMenu from "../hooks/useLongPressContextMenu";
import useMarqueeSelect from "../hooks/useMarqueeSelect";
import { useFileSystem } from "../context/FileSystemContext";

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
  const { moveItems } = useFileSystem() || {};
  const suppressClickRef = useRef(false);
  const groupPreviewFrame = useRef(null);
  const groupPreviewNext = useRef(null);

  const DND_MIME = "application/x-desktop-portfolio-fs-item";

  const handleDragOverDesktop = (e) => {
    if (typeof moveItems !== "function") return;
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {
    }
  };

  const handleDropOnDesktop = (e) => {
    if (typeof moveItems !== "function") return;
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData(DND_MIME);
      if (!raw) return;
      const payload = JSON.parse(raw);
      const fromPath = payload?.fromPath;
      const itemKeys = payload?.itemKeys;
      if (!fromPath || !Array.isArray(itemKeys) || itemKeys.length === 0) return;
      moveItems({ fromPath, toPath: "This PC > Desktop", itemKeys });
    } catch {
    }
  };

  const desktopLongPress = useLongPressContextMenu({
    enabled: true,
    ignoreClosestSelector: "[data-id]",
    onLongPress: ({ x, y }) => {
      onContextMenuRequested({ x, y, targetId: null });
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    },
  });

  const isCoarsePointer = () => {
    if (typeof window === "undefined") return false;
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const touchPoints = typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 0;
    return coarse || touchPoints;
  };

  const { marquee, onPointerDown, onPointerMove, onPointerUp } = useMarqueeSelect({
    enabled: true,
    containerRef,
    itemSelector: "[data-id]",
    getItemId: (node) => node?.getAttribute?.("data-id"),
    onSelectionChange: onSelectMultiple,
    onClearSelection,
    isCoarsePointer,
    suppressClickRef,
  });

  const clearGroupPreview = (excludeId = null) => {
    const host = containerRef.current;
    if (!host) return;
    selectedIds.forEach((id) => {
      if (excludeId && id === excludeId) return;
      const node = host.querySelector(`[data-id="${id}"]`);
      if (!node) return;
      node.style.transform = "";
      node.style.willChange = "";
      node.style.transition = "";
      node.style.opacity = "";
    });
    if (excludeId) {
      const dragged = host.querySelector(`[data-id="${excludeId}"]`);
      if (dragged) {
        dragged.style.opacity = "";
      }
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
      // Prevent Tailwind `transition-all` from animating the transform (looks like lag).
      node.style.transition = "none";
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
      data-desktop-root="1"
      data-drop-path="This PC > Desktop"
      onDragOver={handleDragOverDesktop}
      onDrop={handleDropOnDesktop}
      onClickCapture={desktopLongPress.onClickCapture}
      onClick={() => {
        if (suppressClickRef.current) return;
        onClearSelection();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenuRequested({ x: e.clientX, y: e.clientY, targetId: null });
      }}
      onPointerDownCapture={desktopLongPress.onPointerDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
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
        const isGroup = selectedIds.includes(it.id) && selectedIds.length > 1;
        const dragItemKeys = isGroup ? selectedIds : [it.id];
        return (
          <DesktopIcon
            key={it.id}
            id={it.id}
            label={it.label}
            icon={it.icon}
            x={displayX}
            y={displayY}
            isShortcut={!!it.isShortcut}
            dragItemKeys={dragItemKeys}
            onDragEnd={() => clearGroupPreview(it.id)}
            selected={selectedIds.includes(it.id)}
            onSelect={() => onSelect(it.id)}
            {...(doubleClickOnly.includes(it.id) || it.isShortcut || !!it.targetWindowId
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
