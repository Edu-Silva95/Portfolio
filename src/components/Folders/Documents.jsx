import { useCallback, useEffect, useMemo, useState } from "react";
import { useFileSystem } from "../../context/FileSystemContext";
import Window from "../folder_styles/FolderGeneral";
import FileTable from "./FileTable";
import FolderToolbar from "./FolderToolbar";
import useFolderNavigation from "../../hooks/useFolderNavigation";
import { formatPath, getWindowTitle, buildPathSegments } from "../../utils/folderPath";
import { PhotosContent } from "./Photos";
import { GamesContent } from "./Games";
import { getProjectByFolderPath } from "../../data/projectsData";

function buildProjectReadme(project) {
  if (!project) return "";
  const lines = [];
  lines.push(`# ${project.name || "Project"}`);
  if (project.tagline) lines.push(`\n> ${project.tagline}`);

  const description = String(project.description || "").trim();
  if (description) {
    const markerMatch = description.match(/(many\s+features\s+included[\s\S]*?:)/i);
    if (markerMatch) {
      const markerIndex = markerMatch.index ?? -1;
      const markerText = markerMatch[0];
      const intro = description.slice(0, markerIndex).trim();
      const afterMarker = description.slice(markerIndex + markerText.length).trim();

      if (intro) lines.push(`\n${intro}`);
      lines.push("\n## Features\n");

      const rawItems = afterMarker
        .split(/\.|\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (rawItems.length) {
        lines.push(rawItems.map((it) => `- ${it.replace(/^[-•\s]+/, "")}`).join("\n"));
      } else {
        lines.push("- (No feature list provided)");
      }
    } else {
      lines.push(`\n${description}`);
    }
  }

  if (Array.isArray(project.tech) && project.tech.length) {
    lines.push("\n## Tech\n");
    lines.push(project.tech.map((t) => `- ${t}`).join("\n"));
  }

  const links = project.links || {};
  if (links.live || links.repo || links.link) {
    lines.push("\n## Links\n");
    if (links.live) lines.push(`- Live: ${links.live}`);
    if (links.repo) lines.push(`- Repo: ${links.repo}`);
    if (links.link) lines.push(`- Link: ${links.link}`);
  }

  return lines.join("\n");
}

function toDataTextUrl(text) {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(String(text ?? ""))}`;
}

function normalizeExternalUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (/^javascript:/i.test(value)) return "";
  if (/^data:/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return `https:${value}`;
  if (/^[\w-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;
  return `https://www.google.com/search?igu=1&q=${encodeURIComponent(value)}`;
}

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
  }, [pendingRestores, currentPath, updateCurrentList, onConsumeRestore]);

  // Open folders or special files from the list.
  const handleItemDoubleClick = (item) => {
    // If we're inside a project folder, allow opening its virtual files.
    const project = getProjectByFolderPath(globalPath);
    if (project && !item?.isFolder) {
      const name = String(item?.name || "");
      const lower = name.toLowerCase();

      const openNotes = (title, content) => {
        if (typeof onOpenWindow !== "function" || typeof updateWindowPath !== "function") return;
        onOpenWindow("notes");
        updateWindowPath("notes", toDataTextUrl(content), { title, content });
      };

      const openExternalTab = (url) => {
        const normalized = normalizeExternalUrl(url);
        if (!normalized) return false;
        const win = window.open(normalized, "_blank", "noopener,noreferrer");
        if (win) return true;
        if (typeof onOpenWindow === "function" && typeof updateWindowPath === "function") {
          onOpenWindow("browser");
          updateWindowPath("browser", normalized, [normalized]);
        }
        return false;
      };

      if (lower === "readme.txt") {
        const content = buildProjectReadme(project);
        openNotes(name || "README", content || "(README not available.)");
        return;
      }

      if (lower === "live_demo_link.txt") {
        if (project.links?.live) {
          openExternalTab(project.links.live);
        } else {
          openNotes("live_demo_link.txt", "No live demo link configured for this project.");
        }
        return;
      }

      if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp") || lower.endsWith(".gif")) {
        const src = Array.isArray(project.screenshots) && project.screenshots.length ? project.screenshots[0] : "";
        if (src) openExternalTab(src);
        else openNotes(name, "No screenshot URL configured for this project.");
        return;
      }
    }

    if (item.isFolder) {
      const newPath = `${currentPath} > ${item.name}`;
      pushPath(newPath);
    } else if (item.name === "Curriculum Vitae.pdf") {
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
              handleContextMenu?.(e, globalPath, onContextMenuRequested);
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