import { useState } from "react";

export default function useDesktopState(initialIcons = [], layout = {}) {
  const { ICON_W = 100, ICON_H = 96, PADDING_X = 1, PADDING_Y = 1 } = layout;
  const [icons, setIcons] = useState(initialIcons);
  const [draggingPositions, setDraggingPositions] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  const previewIconPosition = (id, x, y) =>
    setDraggingPositions((prev) => ({ ...prev, [id]: { x, y } }));

  const updateIconPosition = (id, x, y) => {
    const maxX = window.innerWidth - ICON_W - 8;
    const maxY = window.innerHeight - ICON_H - 80;
    const clampedX = Math.min(Math.max(0, x), maxX);
    const clampedY = Math.min(Math.max(0, y), maxY);

    const col = Math.round((clampedX - PADDING_X) / ICON_W);
    const row = Math.round((clampedY - PADDING_Y) / ICON_H);
    const nx = PADDING_X + col * ICON_W;
    const ny = PADDING_Y + row * ICON_H;

    setIcons((prev) => {
      const old = prev.find((it) => it.id === id);
      const other = prev.find((it) => it.id !== id && it.x === nx && it.y === ny);
      return prev.map((it) => {
        if (it.id === id) return { ...it, x: nx, y: ny };
        if (other && it.id === other.id) return { ...it, x: old.x, y: old.y };
        return it;
      });
    });

    setDraggingPositions((prev) => {
      const np = { ...prev };
      delete np[id];
      return np;
    });
  };

  return {
    icons,
    setIcons,
    draggingPositions,
    setDraggingPositions,
    previewIconPosition,
    updateIconPosition,
    selectedIds,
    setSelectedIds,
  };
}
