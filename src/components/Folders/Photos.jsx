import { useCallback, useEffect, useMemo, useState } from "react";
import FileTable from "./FileTable";
import { useFileSystem } from "../../context/FileSystemContext";

export function PhotosContent({ currentPath, basePath, onFolderOpen, searchQuery = "", viewMode = "list", onCountChange, onContextMenuRequested = null, onMoveToRecycleBin = null, onCreateDesktopShortcut = null, pendingRestores = null, onConsumeRestore = null }) {
  const { fileTree, setFileTree, handleContextMenu } = useFileSystem();
  const [selectedIds, setSelectedIds] = useState([]);

  const resolveGlobal = (p) => (p?.startsWith("This PC") ? p : `This PC > ${p}`);
  const globalBase = resolveGlobal(basePath);
  const globalCurrent = resolveGlobal(currentPath);

  const currentContent = fileTree[globalCurrent]?.content || fileTree[globalBase]?.content || [];

  // Update a specific path list in the shared file tree.
  const updateList = useCallback((targetGlobalPath, updater) => {
    setFileTree((prev) => {
      const entry = prev[targetGlobalPath] ? { ...prev[targetGlobalPath] } : { content: [] };
      const list = Array.isArray(entry.content) ? [...entry.content] : [];
      const nextList = updater(list);
      return { ...prev, [targetGlobalPath]: { ...entry, content: nextList } };
    });
  }, [setFileTree]);

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return currentContent;
    const q = searchQuery.toLowerCase();
    return currentContent.filter((item) => item.name.toLowerCase().includes(q));
  }, [currentContent, searchQuery]);

  // Restore items from recycle bin for the current path.
  useEffect(() => {
    onCountChange?.(filteredContent.length);
  }, [filteredContent, onCountChange]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPath]);

  useEffect(() => {
    const restores = pendingRestores?.[currentPath] || pendingRestores?.[globalCurrent];
    if (!restores || restores.length === 0) return;
    updateList(globalCurrent, (prev) => {
      const existing = new Set(prev.map((it) => it.name));
      const toAdd = restores
        .map((r) => r.payload || { name: r.name, icon: r.icon, type: "File", size: "—" })
        .filter((it) => !existing.has(it.name));
      return [...toAdd, ...prev];
    });
    onConsumeRestore?.(currentPath);
  }, [pendingRestores, currentPath, globalCurrent, updateList, onConsumeRestore]);

  // Drill into nested photo folders.
  const handleItemDoubleClick = (item) => {
    if (item.isFolder) {
      const newPath = `${currentPath} > ${item.name}`;
      onFolderOpen?.(newPath);
    }
  };

  const getItemKey = (item) => item.id ?? item.name;

  const confirmDelete = (count) => {
    const message = count > 1
      ? "Are you sure you want to delete these items?"
      : "Are you sure you want to delete this item?";
    return window.confirm(message);
  };

  const handleRename = (item) => {
    if (item.isFolder) {
      alert("Renaming folders is not supported yet.");
      return;
    }
    const name = prompt("Rename", item.name);
    if (!name || name === item.name) return;
    updateList(globalCurrent, (prev) => prev.map((it) => (it.name === item.name ? { ...it, name } : it)));
  };

  const handleDelete = (item) => {
    const itemKey = getItemKey(item);
    const selectedSet = new Set(selectedIds);
    const selectedItems = currentContent.filter((it) => selectedSet.has(getItemKey(it)));
    const shouldDeleteGroup = selectedItems.length > 1 && selectedSet.has(itemKey);

    const itemsToDelete = shouldDeleteGroup ? selectedItems : [item];
    if (!confirmDelete(itemsToDelete.length)) return;
    const deleteKeys = new Set(itemsToDelete.map((it) => getItemKey(it)));
    itemsToDelete.forEach((it) => onMoveToRecycleBin?.(it, globalCurrent));
    updateList(globalCurrent, (prev) => prev.filter((it) => !deleteKeys.has(getItemKey(it))));
    setSelectedIds([]);
  };

  // Right-click context menu for items.
  const openContextMenuForItem = (item, e) => {
    if (!onContextMenuRequested) return;
    onContextMenuRequested({
      x: e.clientX,
      y: e.clientY,
      targetId: null,
      items: [
        { key: "open", label: "Open", onClick: () => handleItemDoubleClick(item) },
        { key: "shortcut", label: "Create shortcut", onClick: () => onCreateDesktopShortcut?.(item, globalCurrent) },
        { key: "rename", label: "Rename", onClick: () => handleRename(item) },
        { key: "delete", label: "Delete", onClick: () => handleDelete(item) },
      ],
    });
  };

  return (
    <div
      className="flex-1 overflow-auto folder-scroll"
      onContextMenu={(e) => {
        if (!onContextMenuRequested) return;
        // use centralized context menu handler when available
        handleContextMenu?.(e, globalCurrent, onContextMenuRequested);
      }}
    >
      <FileTable
        items={filteredContent}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onItemClick={(item) => setSelectedIds([getItemKey(item)])}
        onItemDoubleClick={handleItemDoubleClick}
        viewMode={viewMode}
        enableMarqueeSelect
        onItemContextMenu={openContextMenuForItem}
      />
    </div>
  );
}
