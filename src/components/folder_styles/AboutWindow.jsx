import { useEffect, useMemo, useState } from "react";
import Window from "./FolderGeneral";
import FolderToolbar from "../Folders/FolderToolbar";
import FileTable from "../Folders/FileTable";
import useFolderNavigation from "../../hooks/useFolderNavigation";
import { buildPathSegments } from "../../utils/folderPath";

export default function AboutWindow({
  onClose,
  onMinimize,
  onOpenReadme,
  onNavigateSystemPath = null,
  onContextMenuRequested = null,
  onMoveToRecycleBin = null,
  onCreateDesktopShortcut = null,
  closing = false,
  initialPath = "This PC > Desktop > About",
}) {
  const { currentPath, pushPath, handleBack, handleForward, canGoBack, canGoForward } = useFolderNavigation({
    initialPath,
    windowId: "about",
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [contentByPath, setContentByPath] = useState(() => ({
    ["This PC"]: [
      {
        id: "desktop-folder",
        name: "Desktop",
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "—",
        isFolder: true,
      },
    ],
    ["This PC > Desktop"]: [
      {
        id: "about-folder",
        name: "About",
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "—",
        isFolder: true,
      },
    ],
    ["This PC > Desktop > About"]: [
      {
        id: "readme-file",
        name: "Readme.txt",
        icon: "/icons/document.png",
        type: "Text Document",
        size: "1 KB",
        isOpenable: true,
      },
    ],
  }));

  function handleOpen() {
    if (typeof onOpenReadme === "function") return onOpenReadme();
  }

  const pathDisplay = currentPath;
  const [viewMode, setViewMode] = useState("list");
  const pathSegments = useMemo(() => buildPathSegments(currentPath), [currentPath]);

  const [searchQuery, setSearchQuery] = useState("");

  const thisPcPath = "This PC";
  const aboutPath = "This PC > Desktop > About";
  const desktopPath = "This PC > Desktop";

  const currentItems = contentByPath[currentPath] || [];

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentItems;
    return currentItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [searchQuery, currentItems]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPath]);

  const getItemKey = (item) => item.id ?? item.name;

  const confirmDelete = (count) => {
    const message = count > 1
      ? "Are you sure you want to delete these items?"
      : "Are you sure you want to delete this item?";
    return window.confirm(message);
  };

  const updateCurrentList = (updater) => {
    setContentByPath((prev) => {
      const list = prev[currentPath] || [];
      return {
        ...prev,
        [currentPath]: updater(list),
      };
    });
  };

  const handleRename = (item) => {
    if (item.isFolder) {
      alert("Renaming folders is not supported yet.");
      return;
    }
    const name = prompt("Rename", item.name);
    if (!name || name === item.name) return;
    updateCurrentList((prev) => prev.map((it) => (getItemKey(it) === getItemKey(item) ? { ...it, name } : it)));
  };

  const handleDelete = (item) => {
    const itemKey = getItemKey(item);
    const selectedSet = new Set(selectedIds);
    const selectedItems = currentItems.filter((it) => selectedSet.has(getItemKey(it)));
    const shouldDeleteGroup = selectedItems.length > 1 && selectedSet.has(itemKey);

    const itemsToDelete = shouldDeleteGroup ? selectedItems : [item];
    if (!confirmDelete(itemsToDelete.length)) return;

    const deleteKeys = new Set(itemsToDelete.map((it) => getItemKey(it)));
    itemsToDelete.forEach((it) => onMoveToRecycleBin?.(it, currentPath));
    updateCurrentList((prev) => prev.filter((it) => !deleteKeys.has(getItemKey(it))));
    setSelectedIds([]);
  };

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

  const handleNavigatePath = (path) => {
    if (!path) return;
    if ((path === thisPcPath || path === desktopPath) && typeof onNavigateSystemPath === "function") {
      onNavigateSystemPath(path);
      return;
    }
    pushPath(path);
    setSelectedIds([]);
  };

  const handleItemDoubleClick = (item) => {
    if (!item) return;
    if (currentPath === thisPcPath && item.name === "Desktop") {
      if (typeof onNavigateSystemPath === "function") {
        onNavigateSystemPath(desktopPath);
        return;
      }
      pushPath(desktopPath);
      return;
    }
    if (currentPath === desktopPath && item.name === "About") {
      pushPath(aboutPath);
      setSelectedIds([]);
      return;
    }
    if (item.name === "Readme.txt") {
      handleOpen();
    }
  };

  return (
    <>
      <Window title="📂 About" onClose={onClose} onMinimize={onMinimize} closing={closing} hideScrollbar>
        <FolderToolbar
          onBack={handleBack}
          canGoBack={canGoBack}
          onForward={handleForward}
          canGoForward={canGoForward}
          pathDisplay={pathDisplay}
          pathSegments={pathSegments}
          onNavigatePath={handleNavigatePath}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div
          className="h-full min-h-0 overflow-hidden"
          onContextMenu={(e) => {
            if (!onContextMenuRequested) return;
            e.preventDefault();
            onContextMenuRequested({ x: e.clientX, y: e.clientY, targetId: null });
          }}
        >
          {filteredItems.length > 0 ? (
            <FileTable
              items={filteredItems}
              viewMode={viewMode}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onItemClick={(item) => setSelectedIds([item.id ?? item.name])}
              onItemDoubleClick={handleItemDoubleClick}
              onItemContextMenu={openContextMenuForItem}
              enableMarqueeSelect
            />
          ) : (
            <p className="text-white/60 text-sm px-2">No items match your search.</p>
          )}
        </div>
      </Window>
    </>
  );
}
