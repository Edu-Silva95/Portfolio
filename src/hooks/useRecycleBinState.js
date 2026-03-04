import { useState } from "react";

export default function useRecycleBinState({
  icons,
  setIcons,
  setOpenWindows,
  findFreePosition,
}) {
  const [recycleBin, setRecycleBin] = useState([]);
  const [pendingRestores, setPendingRestores] = useState({});

  const moveDesktopIconToRecycleBin = (iconId) => {
    if (iconId === "recycle") return;
    const icon = icons.find((it) => it.id === iconId);
    if (!icon) return;
    setRecycleBin((prev) => [
      {
        id: icon.id,
        name: icon.label,
        icon: icon.icon,
        x: icon.x,
        y: icon.y,
        source: "desktop",
        targetId: icon.targetId,
        isFolder: icon.isFolder,
        isShortcut: icon.isShortcut,
        targetWindowId: icon.targetWindowId,
        targetPath: icon.targetPath,
      },
      ...prev,
    ]);
    setIcons((prev) => prev.filter((it) => it.id !== iconId));
    setOpenWindows((prev) => ({ ...prev, [iconId]: { open: false, minimized: false } }));
  };

  const restoreFromRecycleBin = (iconId) => {
    setRecycleBin((prev) => {
      const item = prev.find((it) => it.id === iconId);
      if (!item) return prev;
      const next = prev.filter((it) => it.id !== iconId);
      if (item.source === "folder" && item.sourcePath) {
        setPendingRestores((prevRestores) => {
          const existing = prevRestores[item.sourcePath] || [];
          if (existing.some((restore) => restore.id === item.id)) return prevRestores;
          return { ...prevRestores, [item.sourcePath]: [...existing, item] };
        });
        return next;
      }
      setIcons((prevIcons) => {
        if (prevIcons.some((it) => it.id === item.id)) return prevIcons;
        const occupied = new Set(prevIcons.map((it) => `${it.x}:${it.y}`));
        const desired = `${item.x}:${item.y}`;
        const pos = occupied.has(desired) ? findFreePosition(prevIcons) : { x: item.x, y: item.y };
        return [
          {
            id: item.id,
            label: item.name,
            icon: item.icon,
            x: pos.x,
            y: pos.y,
            targetId: item.targetId,
            isFolder: item.isFolder,
            isShortcut: item.isShortcut,
            targetWindowId: item.targetWindowId,
            targetPath: item.targetPath,
          },
          ...prevIcons,
        ];
      });
      return next;
    });
  };

  const deleteForeverFromRecycleBin = (iconId) => {
    setRecycleBin((prev) => prev.filter((it) => it.id !== iconId));
  };

  const emptyRecycleBin = () => {
    setRecycleBin([]);
  };

  const confirmDesktopDelete = (count) => {
    const message = count > 1
      ? "Are you sure you want to delete these items?"
      : "Are you sure you want to delete this item?";
    return window.confirm(message);
  };


  const moveFolderItemToRecycleBin = (item, sourcePath = "", sourceListKey = null) => {
    if (!item) return;
    if (sourcePath === "This PC > Desktop" && item.id) {
      moveDesktopIconToRecycleBin(item.id);
      return;
    }
    const id = item.id || `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const name = item.name || "Unnamed";
    const icon = item.icon || "📄";
    setRecycleBin((prev) => [
      { id, name, icon, source: "folder", sourcePath, sourceListKey, payload: { ...item, id, name, icon } },
      ...prev,
    ]);
  };

  const consumeRestoreForPath = (path) => {
    setPendingRestores((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  return {
    recycleBin,
    pendingRestores,
    moveDesktopIconToRecycleBin,
    restoreFromRecycleBin,
    deleteForeverFromRecycleBin,
    emptyRecycleBin,
    confirmDesktopDelete,
    moveFolderItemToRecycleBin,
    consumeRestoreForPath,
  };
}