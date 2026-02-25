export default function useDesktopGrid({
  icons,
  selectedIds,
  setIcons,
  updateIconPosition,
  iconWidth,
  iconHeight,
  paddingX,
  paddingY,
}) {
  const findFreePosition = (existing = []) => {
    const cols = Math.max(1, Math.floor((window.innerWidth - 8 - paddingX) / iconWidth));
    const maxCols = Math.min(15, cols);
    const occupied = new Set(existing.map((it) => `${it.x}:${it.y}`));
    const maxRows = 7;

    for (let col = 0; col < maxCols; col++) {
      for (let row = 0; row < maxRows; row++) {
        const x = paddingX + col * iconWidth;
        const y = paddingY + row * iconHeight;
        if (!occupied.has(`${x}:${y}`)) return { x, y };
      }
    }

    return { x: paddingX, y: paddingY };
  };

  const moveSelectedIcons = (draggedId, nx, ny) => {
    if (!selectedIds.includes(draggedId) || selectedIds.length <= 1) {
      updateIconPosition(draggedId, nx, ny);
      return;
    }

    const dragged = icons.find((it) => it.id === draggedId);
    if (!dragged) return;

    const dx = nx - dragged.x;
    const dy = ny - dragged.y;
    const maxX = window.innerWidth - iconWidth - 8;
    const maxY = window.innerHeight - iconHeight - 80;
    const selectedSet = new Set(selectedIds);

    const snapToGrid = (x, y) => {
      const clampedX = Math.min(Math.max(0, x), maxX);
      const clampedY = Math.min(Math.max(0, y), maxY);
      const col = Math.round((clampedX - paddingX) / iconWidth);
      const row = Math.round((clampedY - paddingY) / iconHeight);
      return { x: paddingX + col * iconWidth, y: paddingY + row * iconHeight };
    };

    setIcons((prev) =>
      prev.map((it) => {
        if (!selectedSet.has(it.id)) return it;
        const target = snapToGrid(it.x + dx, it.y + dy);
        return { ...it, x: target.x, y: target.y };
      })
    );
  };

  return {
    findFreePosition,
    moveSelectedIcons,
  };
}