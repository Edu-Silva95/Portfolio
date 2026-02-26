import { useEffect, useMemo, useState } from "react";
import FileTable from "./FileTable";
import { useFileSystem } from "../../context/FileSystemContext";

// List of games shown in this folder.
const gamesContent = [
  { name: "Chrome Dino", icon: "🦖", type: "Game", size: "988 KB", isFolder: false, isOpenable: true },
  { name: "Pinball", icon: "🎱", type: "Game", size: "—", isFolder: false, isOpenable: true },
  { name: "DOOM", icon: "/icons/doom.png", type: "Game", size: "—", isFolder: false, isOpenable: true }
];

export function GamesContent({ basePath = "This PC > Games", searchQuery = "", viewMode = "list", onCountChange, onContextMenuRequested = null, onMoveToRecycleBin = null, onCreateDesktopShortcut = null, pendingRestores = null, onConsumeRestore = null, onOpenWindow = null, selectedIds: selectedIdsProp = null, onSelectionChange = null }) {
  const { fileTree, setFileTree, handleContextMenu } = useFileSystem();
  const [localSelectedIds, setLocalSelectedIds] = useState([]);
  // Allow parent to control selection when provided.
  const selectedIds = Array.isArray(selectedIdsProp) ? selectedIdsProp : localSelectedIds;
  const updateSelectedIds = (next) => {
    if (Array.isArray(selectedIdsProp)) {
      onSelectionChange?.(next);
      return;
    }
    setLocalSelectedIds(next);
  };

  const confirmDelete = (count) => {
    const message = count > 1
      ? "Are you sure you want to delete these items?"
      : "Are you sure you want to delete this item?";
    return window.confirm(message);
  };

  const resolveGlobal = (p) => (p?.startsWith("This PC") ? p : `This PC > ${p}`);
  const globalBase = resolveGlobal(basePath);
  const localGames = fileTree[globalBase]?.content || gamesContent;

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return localGames;
    const q = searchQuery.toLowerCase();
    return localGames.filter((item) => item.name.toLowerCase().includes(q));
  }, [localGames, searchQuery]);

  // Restore items from recycle bin for this path.
  useEffect(() => {
    onCountChange?.(filteredContent.length);
  }, [filteredContent, onCountChange]);

  useEffect(() => {
    updateSelectedIds([]);
  }, [searchQuery]);

  useEffect(() => {
    const globalBaseKey = globalBase;
    const restores = pendingRestores?.[basePath] || pendingRestores?.[globalBaseKey];
    if (!restores || restores.length === 0) return;
    setFileTree((prev) => {
      const entry = prev[globalBaseKey] ? { ...prev[globalBaseKey] } : { content: [] };
      const existing = new Set((entry.content || []).map((it) => it.name));
      const toAdd = restores
        .map((r) => r.payload || { name: r.name, icon: r.icon, type: "Game", size: "—" })
        .filter((it) => !existing.has(it.name));
      return { ...prev, [globalBaseKey]: { ...entry, content: [...toAdd, ...(entry.content || [])] } };
    });
    onConsumeRestore?.(basePath);
  }, [pendingRestores, onConsumeRestore, basePath, globalBase, setFileTree]);

  const handleRename = (item) => {
    const name = prompt("Rename", item.name);
    if (!name || name === item.name) return;
    setFileTree((prev) => {
      const entry = prev[globalBase] ? { ...prev[globalBase] } : { content: [] };
      const next = (entry.content || []).map((it) => (it.name === item.name ? { ...it, name } : it));
      return { ...prev, [globalBase]: { ...entry, content: next } };
    });
  };

  const getItemKey = (item) => item.id ?? item.name;

  const handleDelete = (item) => {
    const itemKey = getItemKey(item);
    const selectedSet = new Set(selectedIds);
    const selectedItems = localGames.filter((it) => selectedSet.has(getItemKey(it)));
    const shouldDeleteGroup = selectedItems.length > 1 && selectedSet.has(itemKey);
    const itemsToDelete = shouldDeleteGroup ? selectedItems : [item];

    if (!confirmDelete(itemsToDelete.length)) return;

    const deleteKeys = new Set(itemsToDelete.map((it) => getItemKey(it)));
    itemsToDelete.forEach((it) => onMoveToRecycleBin?.(it, basePath));
    setFileTree((prev) => {
      const entry = prev[globalBase] ? { ...prev[globalBase] } : { content: [] };
      const next = (entry.content || []).filter((it) => !deleteKeys.has(getItemKey(it)));
      return { ...prev, [globalBase]: { ...entry, content: next } };
    });
    updateSelectedIds([]);
  };

  // Open the linked game window based on item name.
  const handleOpen = (item) => {
    if (item.name === "Chrome Dino") {
      onOpenWindow?.("dino");
      return;
    } else if (item.name === "DOOM") {
      onOpenWindow?.("doom");
    }
  };

  // Right-click context menu for items.
  const openContextMenuForItem = (item, e) => {
    if (!onContextMenuRequested) return;
    onContextMenuRequested({
      x: e.clientX,
      y: e.clientY,
      targetId: null,
      items: [
        { key: "open", label: "Open", onClick: () => handleOpen(item) },
        { key: "shortcut", label: "Create shortcut", onClick: () => onCreateDesktopShortcut?.(item, basePath) },
        { key: "rename", label: "Rename", onClick: () => handleRename(item) },
        { key: "delete", label: "Delete", onClick: () => handleDelete(item) },
      ],
    });
  };

  return (
    <div
      className="flex-1 min-h-0 overflow-auto folder-scroll"
      onContextMenu={(e) => {
        if (!onContextMenuRequested) return;
        handleContextMenu?.(e, globalBase, onContextMenuRequested);
      }}
    >
      <FileTable
        items={filteredContent}
        selectedIds={selectedIds}
        onSelectionChange={updateSelectedIds}
        onItemClick={(item) => updateSelectedIds([getItemKey(item)])}
        viewMode={viewMode}
        onItemDoubleClick={handleOpen}
        enableMarqueeSelect
        onItemContextMenu={openContextMenuForItem}
      />
    </div>
  );
}
