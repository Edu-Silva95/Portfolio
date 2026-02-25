import { useEffect, useMemo, useState } from "react";
import Window from "../folder_styles/FolderGeneral";
import FileTable from "./FileTable";
import FolderToolbar from "./FolderToolbar";
import useFolderNavigation from "../../hooks/useFolderNavigation";
import { formatPath, getWindowTitle, buildPathSegments } from "../../utils/folderPath";
import { PhotosContent } from "./Photos";
import { GamesContent } from "./Games";

export default function Documents({
  onClose,
  onMinimize,
  onOpenWindow = () => { },
  initialPath = "Documents",
  centered = false, defaultWidth = 700,
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

  const { currentPath, navigationHistory, pushPath, handleBack, handleForward, canGoBack, canGoForward } = useFolderNavigation({
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

  // Seed data for Documents and nested folders.
  const [documentsContent, setDocumentsContent] = useState([
    { name: "Curriculum Vitae.pdf", icon: "/icons/pdf-file-format.ico", type: "PDF Document", size: "245 KB", isImage: true },
    { name: "Presentation.pptx", icon: "📊", type: "PowerPoint", size: "1.2 MB" },
    { name: "Report.docx", icon: "/icons/notepad.ico", type: "Word Document", size: "89 KB" },
    { name: "Budget.xlsx", icon: "📈", type: "Excel Spreadsheet", size: "156 KB" },
    { name: "Games", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
    { name: "Photos", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
    { name: "Projects", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
  ]);

  const [projectsContent, setProjectsContent] = useState([
    { name: "Portfolio Website", icon: "🌐", type: "Folder", size: "—", isFolder: true },
    { name: "ShopListy", icon: "🛒", type: "Folder", size: "—", isFolder: true },
    { name: "Foodie", icon: "🍽️", type: "Folder", size: "—", isFolder: true },
    { name: "Super Simple List", icon: "/icons/notepad.ico", type: "Folder", size: "—", isFolder: true },
  ]);

  // Path -> list mapping to drive the table content.
  const pathMap = {
    "Documents": documentsContent,
    "Documents > Projects": projectsContent,
  };

  const currentContent = pathMap[currentPath] || documentsContent;

  // Search filter for the current list.
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return currentContent;
    const q = searchQuery.toLowerCase();
    return currentContent.filter((item) => item.name.toLowerCase().includes(q));
  }, [currentContent, searchQuery]);

  // Restore items from recycle bin for the current path.
  useEffect(() => {
    if (!currentPath.startsWith("Documents > Photos") && !currentPath.startsWith("Documents > Games")) {
      setItemCount(filteredContent.length);
    }
  }, [currentPath, filteredContent]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPath]);

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
  }, [pendingRestores, currentPath, onConsumeRestore]);

  // Open folders or special files from the list.
  const handleItemDoubleClick = (item) => {
    if (item.isFolder) {
      const newPath = `${currentPath} > ${item.name}`;
      pushPath(newPath);
    } else if (item.name === "Curriculum Vitae.pdf") {
      // Open CV file
      onOpenWindow("cv");
    }
  };

  // Update the list that matches the current path.
  const updateCurrentList = (updater) => {
    if (currentPath === "Documents") {
      setDocumentsContent((prev) => updater(prev));
      return;
    }
    if (currentPath === "Documents > Projects") {
      setProjectsContent((prev) => updater(prev));
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
    <Window title={windowTitle} onClose={onClose} onMinimize={onMinimize} centered={centered} defaultWidth={defaultWidth} defaultHeight={defaultHeight} closing={closing}>
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
            onContextMenu={(e) => {
              if (!onContextMenuRequested) return;
              e.preventDefault();
              onContextMenuRequested({ x: e.clientX, y: e.clientY, targetId: null });
            }}
          >
            <FileTable
              items={filteredContent}
              {...sharedFileTableProps}
              onItemContextMenu={openContextMenuForItem}
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