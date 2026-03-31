import { useCallback, useEffect, useMemo, useState } from "react";
import { useFileSystem } from "../../context/FileSystemContext";
import useLongPressContextMenu from "../../hooks/useLongPressContextMenu";
import Window from "../folder_styles/FolderGeneral";
import FolderToolbar from "./FolderToolbar";
import FileTable from "./FileTable";
import useFolderNavigation from "../../hooks/useFolderNavigation";
import { buildPathSegments } from "../../utils/folderPath";
import { openExternalUrl } from "../../utils/externalUrl";
import { getProjectByFolderPath } from "../../data/projectsData";
import { tryOpenImagePlayer, tryOpenProjectVirtualItem } from "../../utils/folderOpenUtils";
import { resolveThisPcPath, updateFileTreeList } from "../../utils/fileTreeUpdate";
import { buildStandardItemContextMenu } from "../../utils/standardItemContextMenu";

export default function ProjectsFolder({
  onClose,
  onMinimize,
  minimized = false,
  minimizing = false,
  onOpenWindow = () => { },
  centered = false,
  defaultWidth = 700,
  defaultHeight = 420,
  windowId = "",
  updateWindowPath = null,
  savedPath = null,
  savedHistory = null,
  initialPath = "Documents > Projects",
  dataWindowId,
  onContextMenuRequested = null,
  onMoveToRecycleBin = null,
  onCreateDesktopShortcut = null,
  pendingRestores = null,
  onConsumeRestore = null,
  closing = false,
}) {
  const projectsPath = initialPath;

  const { currentPath, pushPath, handleBack, handleForward, canGoBack, canGoForward } = useFolderNavigation({
    initialPath: projectsPath,
    savedPath,
    savedHistory,
    windowId,
    updateWindowPath,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedIds, setSelectedIds] = useState([]);

  const { fileTree, setFileTree } = useFileSystem();

  const backgroundLongPress = useLongPressContextMenu({
    enabled: !!onContextMenuRequested,
    ignoreClosestSelector: "[data-file-id]",
    onLongPress: ({ x, y }) => {
      onContextMenuRequested?.({ x, y, targetId: null });
    },
  });

  const globalPath = resolveThisPcPath(currentPath);

  const updateCurrentList = useCallback((updater) => {
    setFileTree((prev) => updateFileTreeList(prev, globalPath, "content", updater));
  }, [setFileTree, globalPath]);

  const filteredItems = useMemo(() => {
    const currentItems = fileTree[globalPath]?.content || [];
    if (!searchQuery.trim()) return currentItems;
    const q = searchQuery.toLowerCase();
    return currentItems.filter((it) => it.name.toLowerCase().includes(q));
  }, [fileTree, globalPath, searchQuery]);

  const confirmDelete = (count) => {
    const message = count > 1
      ? "Are you sure you want to delete these items?"
      : "Are you sure you want to delete this item?";
    return window.confirm(message);
  };

  const handleRename = (project) => {
    const name = prompt("Rename", project.name);
    if (!name || name === project.name) return;
    updateCurrentList((prev) => prev.map((it) => (it.name === project.name ? { ...it, name } : it)));
  };

  const handleDelete = (project) => {
    if (!confirmDelete(1)) return;
    onMoveToRecycleBin?.(project, currentPath);
    updateCurrentList((prev) => prev.filter((it) => it.name !== project.name));
    setSelectedIds([]);
  };

  useEffect(() => {
    const restores = pendingRestores?.[currentPath] || pendingRestores?.[globalPath] || pendingRestores?.[projectsPath];
    if (!restores || restores.length === 0) return;
    updateCurrentList((prev) => {
      const existing = new Set(prev.map((it) => it.name));
      const toAdd = restores
        .map((r) => r.payload || { id: `restored-${r.name}`, name: r.name, description: "", link: "", icon: "/icons/document.png", type: "File", size: "—", isFolder: false })
        .filter((it) => !existing.has(it.name));
      return [...toAdd, ...prev];
    });
    onConsumeRestore?.(currentPath);
  }, [pendingRestores, currentPath, globalPath, updateCurrentList, onConsumeRestore]);

  const handleNavigatePath = (path) => {
    if (!path) return;
    pushPath(path);
    setSelectedIds([]);
  };

  function handleItemDoubleClick(item) {
    if (!item) return;

    // URL files open externally.
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

    // Images open in the in-app ImagePlayer.
    const currentItems = fileTree[globalPath]?.content || [];
    if (tryOpenImagePlayer({ item, list: currentItems, onOpenWindow, updateWindowPath })) return;

    // If we are inside a project folder, allow opening its virtual files (YouTube/readme/etc).
    const project = getProjectByFolderPath(globalPath);
    if (tryOpenProjectVirtualItem({ item, project, onOpenWindow, updateWindowPath })) return;

    // Default: folder navigation.
    if (item.isFolder) {
      pushPath(`${currentPath} > ${item.name}`);
    }
  }
  
  const pathDisplay = currentPath;
  const pathSegments = buildPathSegments(currentPath);

  return (
    <Window
      title="📂 Projects"
      onClose={onClose}
      onMinimize={onMinimize}
      minimized={minimized}
      minimizing={minimizing}
      centered={centered}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      dataWindowId={dataWindowId}
      closing={closing}
    >
      <div
        className="flex flex-col h-full"
        onContextMenu={(e) => {
          if (!onContextMenuRequested) return;
          e.preventDefault();
          onContextMenuRequested({ x: e.clientX, y: e.clientY, targetId: null });
        }}
      >
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
          className="flex-1 overflow-auto min-h-0 folder-scroll"
          onClickCapture={backgroundLongPress.onClickCapture}
          onPointerDownCapture={backgroundLongPress.onPointerDown}
        >
          <FileTable
            items={filteredItems}
            currentPath={globalPath}
            pathMap={fileTree}
            viewMode={viewMode}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onItemClick={(item) => setSelectedIds([item.id ?? item.name])}
            onItemDoubleClick={handleItemDoubleClick}
            onItemContextMenu={(item, e) => {
              if (!onContextMenuRequested) return;
              e.preventDefault();
              e.stopPropagation();
              onContextMenuRequested(
                buildStandardItemContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  item,
                  onOpen: handleItemDoubleClick,
                  onCreateShortcut: () => onCreateDesktopShortcut?.(item, currentPath),
                  onRename: handleRename,
                  onDelete: handleDelete,
                })
              );
            }}
          />
        </div>
      </div>
    </Window>
  );
}
