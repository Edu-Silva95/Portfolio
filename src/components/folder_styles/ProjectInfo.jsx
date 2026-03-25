import { useEffect, useMemo, useState } from "react";
import Window from "./FolderGeneral";
import FolderToolbar from "../Folders/FolderToolbar";
import FileTable from "../Folders/FileTable";
import useFolderNavigation from "../../hooks/useFolderNavigation";
import { buildPathSegments } from "../../utils/folderPath";
import { useFileSystem } from "../../context/FileSystemContext";

export default function ProjectInfo({
  onClose,
  onMinimize,
  minimized = false,
  minimizing = false,
  onOpenReadme,
  onNavigateSystemPath = null,
  onContextMenuRequested = null,
  onMoveToRecycleBin = null,
  onCreateDesktopShortcut = null,
  closing = false,
  initialPath = "This PC > Desktop > Project Info",
}) {
  const { currentPath, pushPath, handleBack, handleForward, canGoBack, canGoForward } = useFolderNavigation({
    initialPath,
    windowId: "about",
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const { fileTree, setFileTree, handleContextMenu } = useFileSystem();

  function handleOpen() {
    if (typeof onOpenReadme === "function") return onOpenReadme();
  }

  const pathDisplay = currentPath;
  const [viewMode, setViewMode] = useState("list");
  const pathSegments = useMemo(() => buildPathSegments(currentPath), [currentPath]);

  const [searchQuery, setSearchQuery] = useState("");

  const thisPcPath = "This PC";
  const aboutPath = "This PC > Desktop > Project Info";
  const desktopPath = "This PC > Desktop";

  const currentItems = fileTree[currentPath]?.content || [];

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentItems;
    return currentItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [searchQuery, currentItems]);

  useEffect(() => {
    setItemCount(filteredItems.length);
  }, [filteredItems]);

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
    setFileTree((prev) => {
      const entry = prev[currentPath] ? { ...prev[currentPath] } : { content: [] };
      const list = Array.isArray(entry.content) ? [...entry.content] : [];
      const next = updater(list);
      return { ...prev, [currentPath]: { ...entry, content: next } };
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
    if (currentPath === desktopPath && item.name === "Project Info") {
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
    <Window title="📁 Project Info" onClose={onClose} onMinimize={onMinimize} minimized={minimized} minimizing={minimizing} closing={closing}>
        <div className="flex flex-col h-full">
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
            handleContextMenu?.(e, currentPath, onContextMenuRequested);
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
        <div className="pt-2 border-t border-white/10 text-xs text-white/70 flex items-center justify-between">
          <span>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
          {selectedIds.length > 0 ? (
            <span>
              {selectedIds.length} selected
            </span>
          ) : null}
        </div>
        </div>
      </Window>
    </>
  );
}
