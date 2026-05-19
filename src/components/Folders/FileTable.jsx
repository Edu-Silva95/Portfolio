import { useEffect, useMemo, useRef, useState } from "react";
import { calculateFolderSize, formatBytes } from "../../utils/folderSizes";
import { formatDateValue } from "../../utils/itemProperties";
import useMarqueeSelect from "../../hooks/useMarqueeSelect";
import { useFileSystem } from "../../context/FileSystemContext";
import { readFsItemDndDataTransfer, setFsItemDndDataTransfer } from "../../utils/dragDropPayload";

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
  enableDragDrop = false,
  enableDrag = null,
  enableDrop = null,
}) => {
  const containerRef = useRef(null);
  const MIN_NAME_WIDTH = 180;
  const MIN_COL_WIDTHS = { modified: 150, type: 100, size: 84 };
  const [tableWidth, setTableWidth] = useState(0);
  const [colWidths, setColWidths] = useState({ modified: 160, type: 120, size: 100 });
  const [resizing, setResizing] = useState(null); // { key, startX, startWidth }
  const [sortState, setSortState] = useState({ key: null, dir: "asc" });
  const lastTapRef = useRef({ id: null, at: 0 }); //last click for touch devices to emulate double-click
  const longPressRef = useRef({ timer: null, startX: 0, startY: 0, moved: false });
  const suppressNextClickRef = useRef(false);

  const { moveItems } = useFileSystem() || {};

  const dragEnabled = enableDrag ?? enableDragDrop;
  const dropEnabled = enableDrop ?? enableDragDrop;
  const canDnD = !!currentPath && typeof moveItems === "function";

  const getItemKey = (item) => item?.id ?? item?.name;

  const buildDragPayload = (itemKey) => {
    const isPartOfSelection = selectedIds.includes(itemKey) && selectedIds.length > 1;
    const keys = isPartOfSelection ? selectedIds : [itemKey];
    return {
      fromPath: currentPath,
      itemKeys: keys,
    };
  };

  const handleDragStart = (item, e) => {
    if (!canDnD || !dragEnabled) return;
    const itemKey = getItemKey(item);
    if (!itemKey) return;
    e.stopPropagation();
    try {
      const payload = buildDragPayload(itemKey);
      setFsItemDndDataTransfer(e.dataTransfer, payload, { text: String(item?.name || "") });
    } catch {
      // ignore
    }
  };

  const handleDragOverFolder = (folderItem, e) => {
    if (!canDnD || !dropEnabled) return;
    if (!folderItem?.isFolder) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {
      // ignore
    }
  };

  const handleDropOnFolder = (folderItem, e) => {
    if (!canDnD || !dropEnabled) return;
    if (!folderItem?.isFolder) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      const payload = readFsItemDndDataTransfer(e.dataTransfer);
      const fromPath = payload?.fromPath;
      const itemKeys = payload?.itemKeys;
      if (!fromPath || !Array.isArray(itemKeys) || itemKeys.length === 0) return;

      const toPath = `${currentPath} > ${folderItem.name}`;
      moveItems({ fromPath, toPath, itemKeys });
    } catch {
      // ignore
    }
  };

  const handleDragOverContainer = (e) => {
    if (!canDnD || !dropEnabled) return;
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {
      // ignore
    }
  };

  const handleDropOnContainer = (e) => {
    if (!canDnD || !dropEnabled) return;
    e.preventDefault();

    try {
      const payload = readFsItemDndDataTransfer(e.dataTransfer);
      const fromPath = payload?.fromPath;
      const itemKeys = payload?.itemKeys;
      if (!fromPath || !Array.isArray(itemKeys) || itemKeys.length === 0) return;

      moveItems({ fromPath, toPath: currentPath, itemKeys });
    } catch {
      // ignore
    }
  };

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

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    const updateWidth = () => setTableWidth(node.clientWidth || 0);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const getMaxAllowedWidth = (key, widths = colWidths) => {
    if (!tableWidth) return Infinity;
    const otherKeys = Object.keys(MIN_COL_WIDTHS).filter((colKey) => colKey !== key);
    const otherMinTotal = otherKeys.reduce((sum, colKey) => sum + MIN_COL_WIDTHS[colKey], 0);
    const actionWidth = actions ? 80 : 0;
    const max = tableWidth - MIN_NAME_WIDTH - otherMinTotal - actionWidth;
    return Math.max(MIN_COL_WIDTHS[key], max);
  };

  const startResize = (key, e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    setResizing({ key, startX, startWidth: colWidths[key] });
  };

  useEffect(() => {
    if (!resizing) return undefined;
    const onMove = (ev) => {
      const dx = ev.clientX - resizing.startX;
      setColWidths((prev) => {
        const nextWidth = Math.round(resizing.startWidth - dx);
        const minWidth = MIN_COL_WIDTHS[resizing.key] ?? 48;
        const maxWidth = getMaxAllowedWidth(resizing.key, prev);
        return {
          ...prev,
          [resizing.key]: Math.min(Math.max(minWidth, nextWidth), maxWidth),
        };
      });
    };
    const onUp = () => setResizing(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [resizing]);

  const toggleSort = (key) => {
    setSortState((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: "asc" };
    });
  };

  const getModifiedTimestamp = (item) => {
    const v = item?.modifiedAt ?? item?.modified ?? item?.dateModified ?? item?.modifiedDate ?? item?.createdAt ?? item?.created ?? item?.dateCreated ?? null;
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  };

  const getSizeValue = (item) => {
    if (item?.isFolder) {
      if (currentPath && pathMap) {
        try {
          return calculateFolderSize(`${currentPath} > ${item.name}`, pathMap) || 0;
        } catch {
          return 0;
        }
      }
      return 0;
    }
    if (typeof item?.size === "number") return item.size;
    const n = Number(item?.size);
    return Number.isFinite(n) ? n : 0;
  };

  const sortedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const list = [...items];
    const { key, dir } = sortState;
    if (!key) return list;
    list.sort((a, b) => {
      if (key === "name") {
        return String(a.name ?? "").localeCompare(String(b.name ?? "")) * (dir === "asc" ? 1 : -1);
      }
      if (key === "modified") {
        const av = getModifiedTimestamp(a) ?? 0;
        const bv = getModifiedTimestamp(b) ?? 0;
        return (av - bv) * (dir === "asc" ? 1 : -1);
      }
      if (key === "type") {
        const at = String(a.type ?? (a.isFolder ? "File folder" : "")).toLowerCase();
        const bt = String(b.type ?? (b.isFolder ? "File folder" : "")).toLowerCase();
        return at.localeCompare(bt) * (dir === "asc" ? 1 : -1);
      }
      if (key === "size") {
        const av = getSizeValue(a);
        const bv = getSizeValue(b);
        return (av - bv) * (dir === "asc" ? 1 : -1);
      }
      return 0;
    });
    return list;
  }, [items, sortState, currentPath, pathMap]);

  // Icons view with marquee selection.
  if (viewMode === "icons") {
    return (
      <div
        ref={containerRef}
        className="relative h-full min-h-full select-none"
        data-drop-path={currentPath || undefined}
        onDragOver={handleDragOverContainer}
        onDrop={handleDropOnContainer}
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
            const interactive =
              item.path ||
              item.isFolder ||
              item.isOpenable ||
              !!item.id ||
              !!item.targetWindowId ||
              !!item.targetId ||
              !!item.url ||
              item.name === "Curriculum_Vitae_2026.pdf";
            return (
              <button
                key={itemKey}
                data-file-id={itemKey}
                data-drop-path={item?.isFolder && currentPath ? `${currentPath} > ${item.name}` : undefined}
                type="button"
                onClick={(e) => handleActivate(item, itemKey, e)}
                onDoubleClick={() => onItemDoubleClick && onItemDoubleClick(item)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onItemContextMenu && onItemContextMenu(item, e); }}
                onPointerDown={(e) => startLongPress(item, e)}
                onPointerMove={moveLongPress}
                onPointerUp={clearLongPress}
                onPointerCancel={clearLongPress}
                draggable={!!(canDnD && dragEnabled)}
                onDragStart={(e) => handleDragStart(item, e)}
                onDragOver={(e) => handleDragOverFolder(item, e)}
                onDrop={(e) => handleDropOnFolder(item, e)}
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
      data-drop-path={currentPath || undefined}
      onDragOver={handleDragOverContainer}
      onDrop={handleDropOnContainer}
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
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col />
          <col style={{ width: `${colWidths.modified}px` }} />
          <col style={{ width: `${colWidths.type}px` }} />
          <col style={{ width: `${colWidths.size}px` }} />
          {actions && <col style={{ width: 1 }} />}
        </colgroup>
        <thead className="border-b border-white/10">
          <tr className="text-left select-none">
            <th className="pb-2 font-semibold px-2" onClick={() => toggleSort("name")}>
              <div className="flex items-center gap-2">
                <span>Name</span>
                <button type="button" className="ml-auto text-xs text-white/60" onClick={(e) => { e.stopPropagation(); toggleSort("name"); }}>
                  {sortState.key === "name" ? (sortState.dir === "asc" ? "▲" : "▼") : ""}
                </button>
              </div>
            </th>
            <th className="pb-2 font-semibold pl-1 pr-2 md:px-2 text-center" onClick={() => toggleSort("modified")}>
              <div className="flex items-center w-full min-w-0 overflow-hidden">
                <span
                  className="text-white/60 mr-1 cursor-col-resize shrink-0"
                  onPointerDown={(e) => startResize("modified", e)}
                >
                  |
                </span>
                <span className="flex-1 min-w-0 truncate text-center">Date modified</span>
                <button type="button" className="ml-1 text-xs text-white/60 shrink-0" onClick={(e) => { e.stopPropagation(); toggleSort("modified"); }}>
                  {sortState.key === "modified" ? (sortState.dir === "asc" ? "▲" : "▼") : ""}
                </button>
              </div>
            </th>
            <th className="pb-2 font-semibold px-2 text-center" onClick={() => toggleSort("type")}>
              <div className="flex items-center w-full min-w-0 overflow-hidden">
                <span
                  className="text-white/60 mr-1 cursor-col-resize shrink-0"
                  onPointerDown={(e) => startResize("type", e)}
                >
                  |
                </span>
                <span className="flex-1 min-w-0 truncate text-center">Type</span>
                <button type="button" className="ml-1 text-xs text-white/60 shrink-0" onClick={(e) => { e.stopPropagation(); toggleSort("type"); }}>
                  {sortState.key === "type" ? (sortState.dir === "asc" ? "▲" : "▼") : ""}
                </button>
              </div>
            </th>
            <th className="pb-2 font-semibold px-2 text-center" onClick={() => toggleSort("size")}>
              <div className="flex items-center w-full min-w-0 overflow-hidden">
                <span
                  className="text-white/60 mr-1 cursor-col-resize shrink-0"
                  onPointerDown={(e) => startResize("size", e)}
                >
                  |
                </span>
                <span className="flex-1 min-w-0 truncate text-center">Size</span>
                <button type="button" className="ml-1 text-xs text-white/60 shrink-0" onClick={(e) => { e.stopPropagation(); toggleSort("size"); }}>
                  {sortState.key === "size" ? (sortState.dir === "asc" ? "▲" : "▼") : ""}
                </button>
                <span
                  className="ml-1 text-white/60 cursor-col-resize shrink-0"
                  onPointerDown={(e) => startResize("size", e)}
                >
                  |
                </span>
              </div>
            </th>
            {actions && <th className="pb-2 font-semibold px-2 text-right"> </th>}
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            (() => {
              const interactive =
                item.path ||
                item.isFolder ||
                item.isOpenable ||
                !!item.id ||
                !!item.targetWindowId ||
                !!item.targetId ||
                !!item.url ||
                item.name === "Curriculum_Vitae_2026.pdf";
              return (
            <tr
              key={item.id ?? item.name}
              data-file-id={item.id ?? item.name}
              data-drop-path={item?.isFolder && currentPath ? `${currentPath} > ${item.name}` : undefined}
              onClick={(e) => handleActivate(item, item.id ?? item.name, e)}
              onDoubleClick={() => onItemDoubleClick && onItemDoubleClick(item)}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onItemContextMenu && onItemContextMenu(item, e); }}
              onPointerDown={(e) => startLongPress(item, e)}
              onPointerMove={moveLongPress}
              onPointerUp={clearLongPress}
              onPointerCancel={clearLongPress}
              draggable={!!(canDnD && dragEnabled)}
              onDragStart={(e) => handleDragStart(item, e)}
              onDragOver={(e) => handleDragOverFolder(item, e)}
              onDrop={(e) => handleDropOnFolder(item, e)}
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
              <td className="px-2 overflow-hidden text-center">
                <span className="block min-w-0 truncate text-center">{formatDateValue(item?.modifiedAt ?? item?.modified ?? item?.dateModified ?? item?.modifiedDate ?? item?.createdAt ?? item?.created ?? item?.dateCreated)}</span>
              </td>
              <td className="px-2 overflow-hidden text-center">
                <span className="block min-w-0 truncate text-center">{item.type}</span>
              </td>
              <td className="px-2 text-center text-white/70 overflow-hidden">
                <span className="block min-w-0 truncate text-center">{getItemSizeLabel(item)}</span>
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
