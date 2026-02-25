import { useEffect, useMemo, useState } from "react";
import FileTable from "./FileTable";

const photosContent = [
  { name: "2024 Vacation", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
  { name: "Family Events", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
  { name: "Nature", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
  { name: "Architecture", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
  { name: "Favorites", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
];

const vacationPhotos = [
  { name: "beach_001.jpg", icon: "🖼️", type: "JPEG Image", size: "2.4 MB" },
  { name: "beach_002.jpg", icon: "🖼️", type: "JPEG Image", size: "2.1 MB" },
  { name: "sunset.jpg", icon: "🖼️", type: "JPEG Image", size: "1.8 MB" },
  { name: "night_sky.jpg", icon: "🖼️", type: "JPEG Image", size: "3.2 MB" },
  { name: "landscape.jpg", icon: "🖼️", type: "JPEG Image", size: "2.7 MB" },
];

const familyPhotos = [
  { name: "birthday_party.jpg", icon: "🖼️", type: "JPEG Image", size: "2.9 MB" },
  { name: "gathering.jpg", icon: "🖼️", type: "JPEG Image", size: "3.1 MB" },
  { name: "kids_playing.jpg", icon: "🖼️", type: "JPEG Image", size: "2.2 MB" },
];

const naturePhotos = [
  { name: "forest.jpg", icon: "🖼️", type: "JPEG Image", size: "3.4 MB" },
  { name: "mountain.jpg", icon: "🖼️", type: "JPEG Image", size: "2.8 MB" },
  { name: "waterfall.jpg", icon: "🖼️", type: "JPEG Image", size: "3.1 MB" },
];

// Build a nested path map for the Photos tree.
const getPhotosPathMap = (basePath) => ({
  [basePath]: photosContent,
  [`${basePath} > 2024 Vacation`]: vacationPhotos,
  [`${basePath} > Family Events`]: familyPhotos,
  [`${basePath} > Nature`]: naturePhotos,
});

export function PhotosContent({ currentPath, basePath, onFolderOpen, searchQuery = "", viewMode = "list", onCountChange, onContextMenuRequested = null, onMoveToRecycleBin = null, onCreateDesktopShortcut = null, pendingRestores = null, onConsumeRestore = null }) {
  const [pathMap, setPathMap] = useState(() => getPhotosPathMap(basePath));
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setPathMap(getPhotosPathMap(basePath));
  }, [basePath]);

  // Resolve the list for the current path, fallback to root.
  const currentContent = pathMap[currentPath] || pathMap[basePath] || [];

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
    const restores = pendingRestores?.[currentPath];
    if (!restores || restores.length === 0) return;
    updateList(currentPath, (prev) => {
      const existing = new Set(prev.map((it) => it.name));
      const toAdd = restores
        .map((r) => r.payload || { name: r.name, icon: r.icon, type: "File", size: "—" })
        .filter((it) => !existing.has(it.name));
      return [...toAdd, ...prev];
    });
    onConsumeRestore?.(currentPath);
  }, [pendingRestores, currentPath, onConsumeRestore]);

  // Drill into nested photo folders.
  const handleItemDoubleClick = (item) => {
    if (item.isFolder) {
      const newPath = `${currentPath} > ${item.name}`;
      onFolderOpen?.(newPath);
    }
  };

  // Update a specific path list in the local map.
  const updateList = (path, updater) => {
    setPathMap((prev) => {
      const list = Array.isArray(prev[path]) ? [...prev[path]] : [];
      const nextList = updater(list);
      return { ...prev, [path]: nextList };
    });
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
    updateList(currentPath, (prev) => prev.map((it) => (it.name === item.name ? { ...it, name } : it)));
  };

  const handleDelete = (item) => {
    const itemKey = getItemKey(item);
    const selectedSet = new Set(selectedIds);
    const selectedItems = currentContent.filter((it) => selectedSet.has(getItemKey(it)));
    const shouldDeleteGroup = selectedItems.length > 1 && selectedSet.has(itemKey);

    const itemsToDelete = shouldDeleteGroup ? selectedItems : [item];
    if (!confirmDelete(itemsToDelete.length)) return;
    const deleteKeys = new Set(itemsToDelete.map((it) => getItemKey(it)));
    itemsToDelete.forEach((it) => onMoveToRecycleBin?.(it, currentPath));
    updateList(currentPath, (prev) => prev.filter((it) => !deleteKeys.has(getItemKey(it))));
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
        { key: "shortcut", label: "Create shortcut", onClick: () => onCreateDesktopShortcut?.(item, currentPath) },
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
        e.preventDefault();
        onContextMenuRequested({ x: e.clientX, y: e.clientY, targetId: null });
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
