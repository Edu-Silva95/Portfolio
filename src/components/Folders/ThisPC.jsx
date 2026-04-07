import { useEffect, useMemo, useState } from "react";
import Window from "../folder_styles/FolderGeneral";
import ErrorDialog from "../ErrorDialog";
import { useFileSystem } from "../../context/FileSystemContext";
import FileTable from "./FileTable";
import FolderToolbar from "./FolderToolbar";
import useFolderNavigation from "../../hooks/useFolderNavigation";
import { formatPath, getWindowTitle, buildPathSegments } from "../../utils/folderPath";
import { PhotosContent } from "./Photos";
import { GamesContent } from "./Games";
import { resolveProjectForPath } from "../../utils/projectResolve";
import { openExternalUrl } from "../../utils/externalUrl";
import { tryOpenImagePlayer, tryOpenProjectVirtualItem, tryOpenTargetWindowItem } from "../../utils/folderOpenUtils";
import useLongPressContextMenu from "../../hooks/useLongPressContextMenu";

export default function ThisPC({ onClose, onMinimize, minimized = false, minimizing = false, onOpenWindow = () => { }, initialPath = "This PC", centered = false, defaultWidth = 700, defaultHeight = 420, windowId = "", updateWindowPath = null, savedPath = null, savedHistory = null, onContextMenuRequested = null, onMoveToRecycleBin = null, onCreateDesktopShortcut = null, pendingRestores = null, onConsumeRestore = null, openableIds = [], closing = false }) {
  const { currentPath, pushPath, handleBack, handleForward, canGoBack, canGoForward } = useFolderNavigation({
    initialPath,
    savedPath,
    savedHistory,
    windowId,
    updateWindowPath,
  });
  
  const [showError, setShowError] = useState(false);
  const [showDriveDeleteError, setShowDriveDeleteError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [itemCount, setItemCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  const { fileTree, setFileTree, handleContextMenu } = useFileSystem();
  const currentData = fileTree[currentPath] || fileTree["This PC"];

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
        currentPath,
        onContextMenuRequested
      );
    },
  });

  // Shared search filter for folders/drives/content lists.
  const filterItems = (items = []) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  };

  const filteredFolders = useMemo(() => filterItems(currentData.folders), [currentData.folders, searchQuery]);
  const filteredDrives = useMemo(() => filterItems(currentData.drives), [currentData.drives, searchQuery]);
  const filteredContent = useMemo(() => filterItems(currentData.content), [currentData.content, searchQuery]);

  useEffect(() => {
    if (currentPath === "This PC") {
      setItemCount((filteredFolders?.length || 0) + (filteredDrives?.length || 0));
      return;
    }
    if (!currentPath.startsWith("This PC > Documents > Photos") && !currentPath.startsWith("This PC > Documents > Games")) {
      setItemCount(filteredContent?.length || 0);
    }
  }, [currentPath, filteredFolders, filteredDrives, filteredContent]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPath]);

  // Open windows or drill into folders from the list.
  const handleItemDoubleClick = (item) => {
    // Allow opening moved shortcuts (ex: Browser/DOOM/Readme) from inside any folder.
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

    if (item?.id && openableIds.includes(item.id)) {
      onOpenWindow(item.id);
      return;
    }

    // Open images in the in-app ImagePlayer.
    if (tryOpenImagePlayer({
      item,
      list: Array.isArray(currentData?.content) ? currentData.content : [],
      onOpenWindow,
      updateWindowPath,
    })) return;

    // If inside a project folder, allow opening its virtual files.
    const project = resolveProjectForPath({ fileTree, globalPath: currentPath });
    if (tryOpenProjectVirtualItem({ item, project, onOpenWindow, updateWindowPath })) return;

    // Open CV PDF file
    if (item.name === "Curriculum_Vitae_2026.pdf") {
      onOpenWindow("cv");
      return;
    }

    if (item.isFolder) {
      // Block access to Local Disks, at least for the moment
      if (item.name === "OS (C:)" || item.name === "Local Disk (C:)" || item.name === "Local Disk (D:)") {
        setShowError(true);
        return;
      }
      if (currentPath === "This PC > Desktop") {
        const newPath = `${currentPath} > ${item.name}`;
        setFileTree((prev) => (prev[newPath]
          ? prev
          : { ...prev, [newPath]: { content: [] } }
        ));
        pushPath(newPath);
        return;
      }
      const newPath = `${currentPath} > ${item.name}`;
      pushPath(newPath);
    }
  };

  // Utility to update a specific list (folders/drives/content) in the path map.
  const updateList = (path, listKey, updater) => {
    setFileTree((prev) => {
      const entry = prev[path] ? { ...prev[path] } : { [listKey]: [] };
      const list = Array.isArray(entry[listKey]) ? [...entry[listKey]] : [];
      const nextList = updater(list);
      return { ...prev, [path]: { ...entry, [listKey]: nextList } };
    });
  };

  const getItemKey = (item) => item.id ?? item.name;

  const confirmDelete = (count) => {
    const message = count > 1
      ? "Are you sure you want to delete these items?"
      : "Are you sure you want to delete this item?";
    return window.confirm(message);
  };

  const getList = (path, listKey) => {
    const entry = fileTree[path];
    if (!entry) return [];
    const list = entry[listKey];
    return Array.isArray(list) ? list : [];
  };

  const handleRename = (path, listKey, item) => {
    if (item.isFolder || item.type === "Folder" || item.name.includes("Disk")) {
      alert("Renaming folders or drives is not supported yet.");
      return;
    }
    const name = prompt("Rename", item.name);
    if (!name || name === item.name) return;
    updateList(path, listKey, (prev) => prev.map((it) => (it.name === item.name ? { ...it, name } : it)));
  };

  // Delete with multi-select support; block deleting drives.
  const handleDelete = (path, listKey, item) => {
    if (listKey === "drives") {
      setShowDriveDeleteError(true);
      return;
    }
    const itemKey = getItemKey(item);
    const selectedSet = new Set(selectedIds);
    const list = getList(path, listKey);
    const selectedItems = list.filter((it) => selectedSet.has(getItemKey(it)));
    const shouldDeleteGroup = selectedItems.length > 1 && selectedSet.has(itemKey);

    const itemsToDelete = shouldDeleteGroup ? selectedItems : [item];
    if (!confirmDelete(itemsToDelete.length)) return;
    const deleteKeys = new Set(itemsToDelete.map((it) => getItemKey(it)));
    itemsToDelete.forEach((it) => onMoveToRecycleBin?.(it, path, listKey));
    updateList(path, listKey, (prev) => prev.filter((it) => !deleteKeys.has(getItemKey(it))));
    setSelectedIds([]);
  };

  // Build the right-click menu for a list item.
  const openContextMenuForItem = (path, listKey, item, e) => {
    if (!onContextMenuRequested) return;
    onContextMenuRequested({
      x: e.clientX,
      y: e.clientY,
      targetId: null,
      items: [
        { key: "open", label: "Open", onClick: () => handleItemDoubleClick(item) },
        { key: "shortcut", label: "Create shortcut", onClick: () => onCreateDesktopShortcut?.(item, path) },
        { key: "rename", label: "Rename", onClick: () => handleRename(path, listKey, item) },
        { key: "delete", label: "Delete", onClick: () => handleDelete(path, listKey, item) },
      ],
    });
  };

  // Restore items from recycle bin for the current path(ThisPC).
  useEffect(() => {
    const restores = pendingRestores?.[currentPath];
    if (!restores || restores.length === 0) return;
    const existingByList = {};
    const addItem = (path, listKey, item) => {
      updateList(path, listKey, (prev) => {
        existingByList[listKey] = existingByList[listKey] || new Set(prev.map((it) => it.name));
        if (existingByList[listKey].has(item.name)) return prev;
        existingByList[listKey].add(item.name);
        return [{ ...item }, ...prev];
      });
    };

    restores.forEach((r) => {
      const listKey = r.sourceListKey || (currentPath === "This PC" ? "folders" : "content");
      const item = r.payload || { name: r.name, icon: r.icon, type: "File", size: "—" };
      addItem(currentPath, listKey, item);
    });

    onConsumeRestore?.(currentPath);
  }, [pendingRestores, currentPath, onConsumeRestore]);

  const pathDisplay = formatPath(currentPath, { rootLabel: "This PC", rootIcon: "🖥️", segmentIcon: "📂" });
  const windowTitle = getWindowTitle(currentPath, { rootLabel: "This PC", rootIcon: "🖥️", segmentIcon: "📂" });
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

  const createTableProps = (onItemContextMenu) => ({
    selectedIds,
    onSelectionChange: setSelectedIds,
    onItemClick: (item) => setSelectedIds([item.id ?? item.name]),
    onItemDoubleClick: handleItemDoubleClick,
    viewMode,
    enableMarqueeSelect: true,
    onItemContextMenu,
  });

  return (
    <Window title={windowTitle} onClose={onClose} onMinimize={onMinimize} minimized={minimized} minimizing={minimizing} centered={centered} defaultWidth={defaultWidth} defaultHeight={defaultHeight} closing={closing} dropPath={currentPath !== "This PC" ? currentPath : null}>
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

            <div
              className="flex flex-col flex-1 min-h-0 overflow-auto space-y-6 folder-scroll"
              onClickCapture={backgroundLongPress.onClickCapture}
              onPointerDownCapture={backgroundLongPress.onPointerDown}
              onContextMenu={(e) => {
                if (!onContextMenuRequested) return;
                // use centralized context menu handler so actions target the current path
                handleContextMenu?.(e, currentPath, onContextMenuRequested);
              }}
            >
          {currentPath === "This PC" ? (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3 text-white/80">Folders</h3>
                <FileTable
                  items={filteredFolders}
                  currentPath={"This PC"}
                  pathMap={fileTree}
                  {...createTableProps((item, e) => openContextMenuForItem("This PC", "folders", item, e))}
                  enableDragDrop
                  enableDrag={false}
                  enableDrop
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 text-white/80">Devices and drives</h3>
                <FileTable
                  items={filteredDrives}
                  currentPath={"This PC"}
                  pathMap={fileTree}
                  {...createTableProps((item, e) => openContextMenuForItem("This PC", "drives", item, e))}
                  enableDragDrop={false}
                />
              </div>
            </>
          ) : currentPath.startsWith("This PC > Documents > Photos") ? (
            <PhotosContent
              currentPath={currentPath}
              basePath="This PC > Documents > Photos"
              onFolderOpen={(newPath) => pushPath(newPath)}
              onOpenWindow={onOpenWindow}
              updateWindowPath={updateWindowPath}
              {...sharedMediaProps}
            />
          ) : currentPath.startsWith("This PC > Documents > Games") ? (
            <GamesContent
              basePath="This PC > Documents > Games"
              currentPath={currentPath}
              onFolderOpen={(newPath) => pushPath(newPath)}
              {...sharedMediaProps}
              onOpenWindow={onOpenWindow}
              updateWindowPath={updateWindowPath}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          ) : (
            <FileTable
              items={filteredContent}
              currentPath={currentPath}
              pathMap={fileTree}
              {...createTableProps((item, e) => openContextMenuForItem(currentPath, "content", item, e))}
              enableDragDrop
            />
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

      <ErrorDialog
        isOpen={showError}
        onClose={() => setShowError(false)}
        title="Local Disk"
        message="You currently do not have permission to access this folder.&#10;&#10;Please contact your system administrator or switch to an admin account."
      />

      <ErrorDialog
        isOpen={showDriveDeleteError}
        onClose={() => setShowDriveDeleteError(false)}
        title="Devices and drives"
        message="Deleting devices and drives is not allowed."
      />
    </Window>
  );
}
