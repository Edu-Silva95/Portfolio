import { useRef, useState } from "react";

const FileTable = ({ items = [], onItemClick, onItemDoubleClick, viewMode = "list", actions = null, onItemContextMenu = null, selectedIds = [], onSelectionChange = null, enableMarqueeSelect = false }) => {
  const containerRef = useRef(null);
  const [marquee, setMarquee] = useState(null);

  // Track the marquee rectangle while dragging.
  const updateMarquee = (startX, startY, endX, endY) => {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    setMarquee({ startX, startY, x, y, width, height });
  };

  // Select all items whose bounds intersect the marquee. (multi-select)
  const selectInRect = (rect) => {
    const host = containerRef.current;
    if (!host) return;
    const nodes = host.querySelectorAll("[data-file-id]");
    const nextSelected = [];
    nodes.forEach((node) => {
      const id = node.getAttribute("data-file-id");
      if (!id) return;
      const box = node.getBoundingClientRect();
      const intersects = box.left <= rect.right && box.right >= rect.left && box.top <= rect.bottom && box.bottom >= rect.top;
      if (intersects) nextSelected.push(id);
    });
    onSelectionChange?.(nextSelected);
  };

  // Start marquee selection on empty space.
  const handlePointerDown = (e) => {
    if (!enableMarqueeSelect) return;
    if (e.button !== 0) return;
    if (e.target.closest("[data-file-id]")) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    updateMarquee(startX, startY, startX, startY);
    onSelectionChange?.([]);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  // Update marquee and live selection while dragging.
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

  // Finalize marquee selection and release capture.
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
      onSelectionChange?.([]);
    }
    setMarquee(null);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Icons view with marquee selection.
  if (viewMode === "icons") {
    return (
      <div
        ref={containerRef}
        className="relative h-full min-h-full"
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
        <div className="flex flex-wrap items-start justify-start gap-1 p-1">
          {items.map((item) => {
            const itemKey = item.id ?? item.name;
            const isSelected = selectedIds.includes(itemKey);
            const interactive = item.path || item.isFolder || item.isOpenable || item.name === "Curriculum Vitae.pdf";
            return (
              <button
                key={itemKey}
                data-file-id={itemKey}
                type="button"
                onClick={() => onItemClick && onItemClick(item)}
                onDoubleClick={() => onItemDoubleClick && onItemDoubleClick(item)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onItemContextMenu && onItemContextMenu(item, e); }}
                className={`${interactive ? "cursor-pointer hover:bg-white/10" : "cursor-default"} ${isSelected ? "bg-[#66a6ff]/20 ring-1 ring-[#66a6ff]/70" : ""} w-24 h-auto flex flex-col items-center gap-1 p-1 rounded transition text-center overflow-hidden`}
              >
                {item.isImage || (typeof item.icon === "string" && item.icon.includes("/")) ? (
                  <img src={item.icon} alt={item.name} className="w-10 h-10" />
                ) : (
                  <span className="text-3xl">{item.icon}</span>
                )}
                <span className="text-xs text-white/90 line-clamp-2">{item.name}</span>
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
      className="relative h-full min-h-full"
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
      <table className="w-full text-sm">
        <thead className="border-b border-white/10">
          <tr className="text-left">
            <th className="pb-2 font-semibold">Name</th>
            <th className="pb-2 font-semibold">Type</th>
            <th className="pb-2 font-semibold text-right">Size</th>
            {actions && <th className="pb-2 font-semibold text-right"> </th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id ?? item.name}
              data-file-id={item.id ?? item.name}
              onClick={() => onItemClick && onItemClick(item)}
              onDoubleClick={() => onItemDoubleClick && onItemDoubleClick(item)}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onItemContextMenu && onItemContextMenu(item, e); }}
              className={`${item.path || item.isFolder || item.isOpenable || item.name === "Curriculum Vitae.pdf" ? "cursor-pointer hover:bg-white/5" : "cursor-default"} ${selectedIds.includes(item.id ?? item.name) ? "bg-[#66a6ff]/15" : ""} border-b border-white/5 transition`}
            >
              <td className="py-2 flex items-center gap-2">
                {item.isImage || (typeof item.icon === "string" && item.icon.includes("/")) ? (
                  <img src={item.icon} alt={item.name} className="w-5 h-5" />
                ) : (
                  <span className="text-xl">{item.icon}</span>
                )}
                <span>{item.name}</span>
              </td>
              <td>{item.type}</td>
              <td className="text-right text-white/70">{item.size}</td>
              {actions && <td className="text-right pr-2">{actions(item)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;
