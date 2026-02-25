import { useState } from "react";

export default function useContextMenu() {
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, targetId: null, items: null });

  const openContextMenu = ({ x, y, targetId = null, items = null }) =>
    setContextMenu({ open: true, x, y, targetId, items });
  const closeContextMenu = () => setContextMenu((p) => ({ ...p, open: false, items: null }));

  return { contextMenu, openContextMenu, closeContextMenu };
}
