import { useEffect, useMemo, useState } from "react";
import FileTable from "./FileTable";
import { useFileSystem } from "../../context/FileSystemContext";
import useLongPressContextMenu from "../../hooks/useLongPressContextMenu";
import { openExternalUrl } from "../../utils/externalUrl";
import { resolveProjectForPath } from "../../utils/projectResolve";
import { tryOpenImagePlayer, tryOpenProjectVirtualItem, tryOpenTargetWindowItem } from "../../utils/folderOpenUtils";

export function GamesContent({ basePath = "This PC > Games", currentPath = null, onFolderOpen = null, searchQuery = "", viewMode = "list", onCountChange, onContextMenuRequested = null, onMoveToRecycleBin = null, onCreateDesktopShortcut = null, pendingRestores = null, onConsumeRestore = null, onOpenWindow = null, updateWindowPath = null, selectedIds: selectedIdsProp = null, onSelectionChange = null }) {
  const { fileTree, setFileTree, handleContextMenu, copyItems } = useFileSystem();
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
  const actionPath = currentPath || basePath;
  const globalPath = resolveGlobal(actionPath);
  const currentItems = fileTree[globalPath]?.content || [];

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
        globalBase,
        onContextMenuRequested
      );
    },
  });

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return currentItems;
    const q = searchQuery.toLowerCase();
    return currentItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [currentItems, searchQuery]);

  // Restore items from recycle bin for this path.
  useEffect(() => {
    onCountChange?.(filteredContent.length);
  }, [filteredContent, onCountChange]);

  useEffect(() => {
    updateSelectedIds([]);
  }, [searchQuery]);

  useEffect(() => {
    const globalKey = globalPath;
    const restores = pendingRestores?.[actionPath] || pendingRestores?.[globalKey];
    if (!restores || restores.length === 0) return;
    setFileTree((prev) => {
      const entry = prev[globalKey] ? { ...prev[globalKey] } : { content: [] };
      const existing = new Set((entry.content || []).map((it) => it.name));
      const toAdd = restores
        .map((r) => r.payload || { name: r.name, icon: r.icon, type: "Game", size: "—" })
        .filter((it) => !existing.has(it.name));
      return { ...prev, [globalKey]: { ...entry, content: [...toAdd, ...(entry.content || [])] } };
    });
    onConsumeRestore?.(actionPath);
  }, [pendingRestores, onConsumeRestore, actionPath, globalPath, setFileTree]);

  const handleRename = (item) => {
    const name = prompt("Rename", item.name);
    if (!name || name === item.name) return;
    setFileTree((prev) => {
      const entry = prev[globalPath] ? { ...prev[globalPath] } : { content: [] };
      const next = (entry.content || []).map((it) => (it.name === item.name ? { ...it, name } : it));
      return { ...prev, [globalPath]: { ...entry, content: next } };
    });
  };

  const getItemKey = (item) => item.id ?? item.name;

  const handleDelete = (item) => {
    const itemKey = getItemKey(item);
    const selectedSet = new Set(selectedIds);
    const selectedItems = currentItems.filter((it) => selectedSet.has(getItemKey(it)));
    const shouldDeleteGroup = selectedItems.length > 1 && selectedSet.has(itemKey);
    const itemsToDelete = shouldDeleteGroup ? selectedItems : [item];

    if (!confirmDelete(itemsToDelete.length)) return;

    const deleteKeys = new Set(itemsToDelete.map((it) => getItemKey(it)));
    itemsToDelete.forEach((it) => onMoveToRecycleBin?.(it, actionPath));
    setFileTree((prev) => {
      const entry = prev[globalPath] ? { ...prev[globalPath] } : { content: [] };
      const next = (entry.content || []).filter((it) => !deleteKeys.has(getItemKey(it)));
      return { ...prev, [globalPath]: { ...entry, content: next } };
    });
    updateSelectedIds([]);
  };

  // Open the linked game window based on item name.
  const handleOpen = (item) => {
    if (tryOpenTargetWindowItem({ item, onOpenWindow, updateWindowPath })) return;

    const displayName = String(item?.originalName || item?.name || "");

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

    if (tryOpenImagePlayer({ item, list: currentItems, onOpenWindow, updateWindowPath })) return;

    const project = resolveProjectForPath({ fileTree, globalPath });
    if (tryOpenProjectVirtualItem({ item, project, onOpenWindow, updateWindowPath })) return;

    if (item?.isFolder) {
      onFolderOpen?.(`${actionPath} > ${item.name}`);
      return;
    }

    if (displayName === "Dino Game") {
      onOpenWindow?.("dino");
      return;
    } else if (displayName === "DOOM") {
      onOpenWindow?.("doom");
    }
  };

  // Right-click context menu for items.
  const openContextMenuForItem = (item, e) => {
    if (!onContextMenuRequested) return;

    const itemKey = getItemKey(item);
    const selectedSet = new Set(selectedIds);
    const selectedItems = currentItems.filter((it) => selectedSet.has(getItemKey(it)));
    const shouldCopyGroup = selectedItems.length > 1 && selectedSet.has(itemKey);
    const keysToCopy = shouldCopyGroup ? selectedItems.map((it) => getItemKey(it)) : [itemKey];

    onContextMenuRequested({
      x: e.clientX,
      y: e.clientY,
      targetId: null,
      items: [
        { key: "open", label: "Open", onClick: () => handleOpen(item) },
        { key: "shortcut", label: "Create shortcut", onClick: () => onCreateDesktopShortcut?.(item, actionPath) },
        { key: "copy", label: "Copy", onClick: () => copyItems?.({ fromPath: globalPath, fromListKey: "content", itemKeys: keysToCopy }) },
        { key: "rename", label: "Rename", onClick: () => handleRename(item) },
        { key: "delete", label: "Delete", onClick: () => handleDelete(item) },
      ],
    });
  };

  return (
    <div
      className="flex-1 min-h-0 overflow-auto folder-scroll"
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
        selectedIds={selectedIds}
        onSelectionChange={updateSelectedIds}
        onItemClick={(item) => updateSelectedIds([getItemKey(item)])}
        viewMode={viewMode}
        onItemDoubleClick={handleOpen}
        enableMarqueeSelect
        onItemContextMenu={openContextMenuForItem}
        enableDragDrop
      />
    </div>
  );
}
