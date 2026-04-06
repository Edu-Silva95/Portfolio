import { useCallback, useEffect, useMemo, useState } from "react";
import { useFileSystem } from "../../context/FileSystemContext";
import useLongPressContextMenu from "../../hooks/useLongPressContextMenu";
import Window from "../folder_styles/FolderGeneral";
import FileTable from "./FileTable";
import FolderToolbar from "./FolderToolbar";
import useFolderNavigation from "../../hooks/useFolderNavigation";
import { formatPath, getWindowTitle, buildPathSegments } from "../../utils/folderPath";
import { PhotosContent } from "./Photos";
import { GamesContent } from "./Games";
import { resolveProjectForPath } from "../../utils/projectResolve";
import { openExternalUrl } from "../../utils/externalUrl";
import { tryOpenImagePlayer, tryOpenProjectVirtualItem, tryOpenTargetWindowItem } from "../../utils/folderOpenUtils";

export default function Documents({
  onClose,
  onMinimize,
  minimized = false,
  minimizing = false,
  onOpenWindow = () => { },
  initialPath = "Documents",
  centered = false,
  defaultWidth = 700,
  defaultHeight = 420,
  windowId = "",
  updateWindowPath = null,
  savedPath = null,
  savedHistory = null,
  onContextMenuRequested = null,
  onMoveToRecycleBin = null,
  onCreateDesktopShortcut = null,
  pendingRestores = null,
  onConsumeRestore = null,
  closing = false
}) {

  const { currentPath, pushPath, handleBack, handleForward, canGoBack, canGoForward } = useFolderNavigation({
    initialPath,
    savedPath,
    savedHistory,
    windowId,
    updateWindowPath,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [itemCount, setItemCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  const { fileTree, setFileTree, handleContextMenu } = useFileSystem();
  const globalPath = currentPath.startsWith("This PC") ? currentPath : `This PC > ${currentPath}`;
  const currentContent = fileTree[globalPath]?.content || [];

  const backgroundLongPress = useLongPressContextMenu({
    enabled: !!onContextMenuRequested,
    ignoreClosestSelector: "[data-file-id]",
    onLongPress: ({ x, y }) => {
      handleContextMenu?.(
        {
          clientX: x,
          clientY: y,
          preventDefault: () => { },
          stopPropagation: () => { },
        },
        globalPath,
        onContextMenuRequested
      );
    },
  });

  // Update the list that matches the current path (mapped to global path keys).
  const updateCurrentList = useCallback((updater) => {
    setFileTree((prev) => {
      const entry = prev[globalPath] ? { ...prev[globalPath] } : { content: [] };
      const list = Array.isArray(entry.content) ? [...entry.content] : [];
      const nextList = updater(list);
      return { ...prev, [globalPath]: { ...entry, content: nextList } };
    });
  }, [setFileTree, globalPath]);

  // Search filter for the current list.
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return currentContent;
    const q = searchQuery.toLowerCase();
    return currentContent.filter((item) => item.name.toLowerCase().includes(q));
  }, [currentContent, searchQuery]);

  // Total item count for the Documents folder (excluding Photos and Games subfolders which have their own counters).
  useEffect(() => {
    if (!currentPath.startsWith("Documents > Photos") && !currentPath.startsWith("Documents > Games")) {
      setItemCount(filteredContent.length);
    }
  }, [currentPath, filteredContent]);

  // Clears selection when changing folders, so multi-select doesn’t “stick” across navigation
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPath]);

  // Restore items from recycle bin for the Documents path.
  useEffect(() => {
    const restores = pendingRestores?.[currentPath];
    if (!restores || restores.length === 0) return;
    updateCurrentList((prev) => {
      const existing = new Set(prev.map((it) => it.name));
      const toAdd = restores
        .map((r) => r.payload || { name: r.name, icon: r.icon, type: "File", size: "—" })
        .filter((it) => !existing.has(it.name));
      return [...toAdd, ...prev];
    });
    onConsumeRestore?.(currentPath);
  }, [pendingRestores, currentPath, updateCurrentList, onConsumeRestore]);

  // Open folders or special files from the list.
  const handleItemDoubleClick = (item) => {
    // Allow opening moved shortcuts (ex: Browser/DOOM) from inside any folder.
    if (tryOpenTargetWindowItem({ item, onOpenWindow, updateWindowPath })) return;

    if (!item?.isFolder) {
      const itemType = String(item?.type || "").toLowerCase();
      if (itemType === "url" || item?.url) {
        const url = item?.url;
        if (url) {
          openExternalUrl(url, { preferNewTab: true });
          return;
        }
      }
    }

    // Open images in the in-app ImagePlayer (works in project subfolders like Screenshots).
    if (tryOpenImagePlayer({ item, list: currentContent, onOpenWindow, updateWindowPath })) return;

    // If we're inside a project folder, allow opening its virtual files.
    const project = resolveProjectForPath({ fileTree, globalPath });
    if (tryOpenProjectVirtualItem({ item, project, onOpenWindow, updateWindowPath })) return;

    if (item.isFolder) {
      const newPath = `${currentPath} > ${item.name}`;
      pushPath(newPath);
    } else if (item.name === "Curriculum_Vitae_2026.pdf") {
      // Open CV file
      onOpenWindow("cv");
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
    updateCurrentList((prev) => prev.map((it) => (it.name === item.name ? { ...it, name } : it)));
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

  const pathDisplay = `🖥️ This PC > ${formatPath(currentPath, { segmentIcon: "📂" })}`;
  const windowTitle = getWindowTitle(currentPath, { segmentIcon: "📂" });
  const pathSegments = buildPathSegments(currentPath);

  const sharedMediaProps = {
    searchQuery,
    viewMode,
    onCountChange: setItemCount,
    onContextMenuRequested,
    onMoveToRecycleBin,
    onCreateDesktopShortcut,
    pendingRestores,
    onConsumeRestore,
  };

  const sharedFileTableProps = {
    selectedIds,
    onSelectionChange: setSelectedIds,
    onItemClick: (item) => setSelectedIds([item.id ?? item.name]),
    onItemDoubleClick: handleItemDoubleClick,
    viewMode,
    enableMarqueeSelect: true,
  };

  return (
    <Window
      title={windowTitle}
      onClose={onClose}
      onMinimize={onMinimize}
      minimized={minimized}
      minimizing={minimizing}
      centered={centered}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      closing={closing}
      dropPath={globalPath}
    >
      <div className="flex flex-col h-full">
        <FolderToolbar
          onBack={handleBack}
          canGoBack={canGoBack}
          onForward={handleForward}
          canGoForward={canGoForward}
          pathDisplay={pathDisplay}
          pathSegments={pathSegments}
          onNavigatePath={(path) => pushPath(path)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* File list */}
        {currentPath.startsWith("Documents > Photos") ? (
          <PhotosContent
            currentPath={currentPath}
            basePath="Documents > Photos"
            onFolderOpen={(newPath) => pushPath(newPath)}
            {...sharedMediaProps}
          />
        ) : currentPath.startsWith("Documents > Games") ? (
          <GamesContent
            basePath="Documents > Games"
            {...sharedMediaProps}
            onOpenWindow={onOpenWindow}
          />
        ) : (
          <div
            className="flex-1 overflow-auto min-h-0 folder-scroll"
            onClickCapture={backgroundLongPress.onClickCapture}
            onPointerDownCapture={backgroundLongPress.onPointerDown}
            onContextMenu={(e) => {
              if (!onContextMenuRequested) return;
              handleContextMenu?.(e, globalPath, onContextMenuRequested);
            }}
          >
            <FileTable
              items={filteredContent}
              currentPath={globalPath}
              pathMap={fileTree}
              {...sharedFileTableProps}
              onItemContextMenu={openContextMenuForItem}
              enableDragDrop
            />
          </div>
        )}

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
  );
}