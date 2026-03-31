import { useEffect, useMemo, useRef } from "react";
import { calculateFolderSize, formatBytes } from "../../utils/folderSizes";
import useMarqueeSelect from "../../hooks/useMarqueeSelect";

const FileTable = ({
  items = [],
  currentPath = null,
  pathMap = null,
  onItemClick,
  onItemDoubleClick,
  viewMode = "list",
  actions = null,
  onItemContextMenu = null,
  selectedIds = [],
  onSelectionChange = null,
  enableMarqueeSelect = false,
}) => {
  const containerRef = useRef(null);
  const lastTapRef = useRef({ id: null, at: 0 }); //last click for touch devices to emulate double-click
  const longPressRef = useRef({ timer: null, startX: 0, startY: 0, moved: false });
  const suppressNextClickRef = useRef(false);

  const isCoarsePointer = useMemo(() => {
    if (typeof window === "undefined") return false;
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const touchPoints = typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 0;
    return coarse || touchPoints;
  }, []);

  useEffect(() => {
    lastTapRef.current = { id: null, at: 0 };
    suppressNextClickRef.current = false;
    if (longPressRef.current.timer) {
      window.clearTimeout(longPressRef.current.timer);
      longPressRef.current.timer = null;
    }
  }, [currentPath, items]);

  const handleActivate = (item, itemKey, event) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    onItemClick && onItemClick(item);

    // Mobile/touch: emulate double-click with a double-tap window.
    if (isCoarsePointer && typeof onItemDoubleClick === "function") {
      const now = typeof event?.timeStamp === "number" ? event.timeStamp : 0;
      const last = lastTapRef.current;
      const isDoubleTap = last.id === itemKey && now - last.at < 350;
      if (isDoubleTap) {
        lastTapRef.current = { id: null, at: 0 };
        onItemDoubleClick(item);
        return;
      }
      lastTapRef.current = { id: itemKey, at: now };
    }
  };

  const clearLongPress = () => {
    if (longPressRef.current.timer) {
      window.clearTimeout(longPressRef.current.timer);
      longPressRef.current.timer = null;
    }
    longPressRef.current.moved = false;
  };

  const startLongPress = (item, e) => {
    if (!isCoarsePointer) return;
    if (typeof onItemContextMenu !== "function") return;
    clearLongPress();

    longPressRef.current.startX = e.clientX;
    longPressRef.current.startY = e.clientY;
    longPressRef.current.moved = false;

    const x = e.clientX;
    const y = e.clientY;
    longPressRef.current.timer = window.setTimeout(() => {
      suppressNextClickRef.current = true;
      lastTapRef.current = { id: null, at: 0 };
      onItemClick && onItemClick(item);
      onItemContextMenu(item, {
        clientX: x,
        clientY: y,
        preventDefault: () => { },
        stopPropagation: () => { },
      });
      clearLongPress();
    }, 1000);
  };

  const moveLongPress = (e) => {
    if (!longPressRef.current.timer) return;
    const dx = e.clientX - longPressRef.current.startX;
    const dy = e.clientY - longPressRef.current.startY;
    if (Math.hypot(dx, dy) > 8) {
      longPressRef.current.moved = true;
      clearLongPress();
    }
  };

  const folderSizeLabels = useMemo(() => {
    if (viewMode !== "list") return null;
    if (!currentPath || !pathMap) return null;

    const map = new Map();
    for (const item of items || []) {
      if (!item?.isFolder) continue;
      const folderPath = `${currentPath} > ${item.name}`;
      const bytes = calculateFolderSize(folderPath, pathMap);
      const label = bytes > 0 ? formatBytes(bytes) : (item?.size ?? "—");
      map.set(folderPath, label);
    }
    return map;
  }, [items, currentPath, pathMap, viewMode]);

  const getItemSizeLabel = (item) => {
    if (!item?.isFolder) return item?.size;
    if (!currentPath || !pathMap) return item?.size;
    const folderPath = `${currentPath} > ${item.name}`;
    return folderSizeLabels?.get(folderPath) ?? (item?.size ?? "—");
  };

  const marqueeSelect = useMarqueeSelect({
    enabled: enableMarqueeSelect,
    containerRef,
    itemSelector: "[data-file-id]",
    getItemId: (node) => node?.getAttribute?.("data-file-id"),
    onSelectionChange: onSelectionChange ?? undefined,
    onClearSelection: () => onSelectionChange?.([]),
    isCoarsePointer,
  });

  // Icons view with marquee selection.
  if (viewMode === "icons") {
    return (
      <div
        ref={containerRef}
        className="relative h-full min-h-full select-none"
        onPointerDown={marqueeSelect.onPointerDown}
        onPointerMove={marqueeSelect.onPointerMove}
        onPointerUp={marqueeSelect.onPointerUp}
      >
        {marqueeSelect.marquee ? (
          <div
            className="pointer-events-none absolute border border-[#66a6ff] bg-[#66a6ff]/20"
            style={{
              left: marqueeSelect.marquee.x,
              top: marqueeSelect.marquee.y,
              width: marqueeSelect.marquee.width,
              height: marqueeSelect.marquee.height,
            }}
          />
        ) : null}
        <div className="flex flex-wrap items-start justify-start gap-1 p-1">
          {items.map((item) => {
            const itemKey = item.id ?? item.name;
            const isSelected = selectedIds.includes(itemKey);
            const interactive = item.path || item.isFolder || item.isOpenable || !!item.id || item.name === "Curriculum_Vitae_2026.pdf";
            return (
              <button
                key={itemKey}
                data-file-id={itemKey}
                type="button"
                onClick={(e) => handleActivate(item, itemKey, e)}
                onDoubleClick={() => onItemDoubleClick && onItemDoubleClick(item)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onItemContextMenu && onItemContextMenu(item, e); }}
                onPointerDown={(e) => startLongPress(item, e)}
                onPointerMove={moveLongPress}
                onPointerUp={clearLongPress}
                onPointerCancel={clearLongPress}
                className={`${interactive ? "cursor-pointer hover:bg-white/10" : "cursor-default"} ${isSelected ? "bg-[#66a6ff]/20 ring-1 ring-[#66a6ff]/70" : ""} w-24 h-auto flex flex-col items-center gap-1 p-1 rounded transition text-center overflow-hidden select-none`}
              >
                {item.isImage || (typeof item.icon === "string" && item.icon.includes("/")) ? (
                  <img src={item.icon} alt={item.name} className="w-10 h-10" />
                ) : (
                  <span className="text-3xl">{item.icon}</span>
                )}
                <span className="text-xs text-white/90 line-clamp-2 break-words max-w-full" title={item.name}>
                  {item.name}
                </span>
                {actions && (
                  <div className="mt-1 flex gap-1 text-xs">
                    {actions(item)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // List view with marquee selection.
  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-full select-none"
      onPointerDown={marqueeSelect.onPointerDown}
      onPointerMove={marqueeSelect.onPointerMove}
      onPointerUp={marqueeSelect.onPointerUp}
    >
      {marqueeSelect.marquee ? (
        <div
          className="pointer-events-none absolute border border-[#66a6ff] bg-[#66a6ff]/20"
          style={{
            left: marqueeSelect.marquee.x,
            top: marqueeSelect.marquee.y,
            width: marqueeSelect.marquee.width,
            height: marqueeSelect.marquee.height,
          }}
        />
      ) : null}
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col />
          <col className="w-32 md:w-48" />
          <col className="w-24 md:w-28" />
          {actions && <col className="w-20 md:w-24" />}
        </colgroup>
        <thead className="border-b border-white/10">
          <tr className="text-left">
            <th className="pb-2 font-semibold px-2">Name</th>
            <th className="pb-2 font-semibold pl-4 pr-2 md:px-2 text-center">Type</th>
            <th className="pb-2 font-semibold px-2 text-center">Size</th>
            {actions && <th className="pb-2 font-semibold px-2 text-right"> </th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            (() => {
              const interactive = item.path || item.isFolder || item.isOpenable || !!item.id || item.name === "Curriculum_Vitae_2026.pdf";
              return (
            <tr
              key={item.id ?? item.name}
              data-file-id={item.id ?? item.name}
              onClick={(e) => handleActivate(item, item.id ?? item.name, e)}
              onDoubleClick={() => onItemDoubleClick && onItemDoubleClick(item)}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onItemContextMenu && onItemContextMenu(item, e); }}
              onPointerDown={(e) => startLongPress(item, e)}
              onPointerMove={moveLongPress}
              onPointerUp={clearLongPress}
              onPointerCancel={clearLongPress}
              className={`${interactive ? "cursor-pointer hover:bg-white/5" : "cursor-default"} ${selectedIds.includes(item.id ?? item.name) ? "bg-[#66a6ff]/15" : ""} border-b border-white/5 transition select-none`}
            >
              <td className="px-2 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {item.isImage || (typeof item.icon === "string" && item.icon.includes("/")) ? (
                    <img src={item.icon} alt={item.name} className="w-5 h-5" />
                  ) : (
                    <span className="text-xl">{item.icon}</span>
                  )}
                  <span className="min-w-0 truncate">{item.name}</span>
                </div>
              </td>
              <td className="pl-4 pr-2 md:px-2 overflow-hidden text-center">
                <span className="block truncate">{item.type}</span>
              </td>
              <td className="px-2 text-center text-white/70 overflow-hidden">
                <span className="block truncate">{getItemSizeLabel(item)}</span>
              </td>
              {actions && <td className="px-2 text-right">{actions(item)}</td>}
            </tr>
              );
            })()
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;
