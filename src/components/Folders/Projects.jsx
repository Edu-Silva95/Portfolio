import { useEffect, useMemo, useState } from "react";
import Window from "../folder_styles/FolderGeneral";
import FolderToolbar from "./FolderToolbar";
import FileTable from "./FileTable";
import useFolderNavigation from "../../hooks/useFolderNavigation";
import { buildPathSegments } from "../../utils/folderPath";

export default function ProjectsFolder({ onClose, onMinimize, onContextMenuRequested = null, onMoveToRecycleBin = null, onCreateDesktopShortcut = null, pendingRestores = null, onConsumeRestore = null, closing = false }) {
  const projectsPath = "Documents > Projects";
  const documentsPath = "Documents";

  const { currentPath, pushPath, handleBack, handleForward, canGoBack, canGoForward } = useFolderNavigation({
    initialPath: projectsPath,
    windowId: "projects",
  });

  const [projects, setProjects] = useState([
    { id: "portfolio-website", name: "Portfolio Website", description: "A personal portfolio website built with React.", link: "", icon: "🌐", type: "Folder", size: "—", isFolder: true },
    { id: "shoplisty", name: "ShopListy", description: "A full-stack shopping list app filled with features.", link: "", icon: "🛒", type: "Folder", size: "—", isFolder: true },
    { id: "foodie", name: "Foodie", description: "A food discovery and recipe app.", link: "", icon: "🍽️", type: "Folder", size: "—", isFolder: true },
    { id: "super-simple-list", name: "Super Simple List", description: "A minimalist list-making app.", link: "", icon: "/icons/notepad.ico", type: "Folder", size: "—", isFolder: true },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedIds, setSelectedIds] = useState([]);

  const contentByPath = useMemo(() => ({
    [documentsPath]: [
      {
        id: "projects-folder",
        name: "Projects",
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "—",
        isFolder: true,
      },
    ],
    [projectsPath]: projects,
  }), [projects]);

  const currentItems = contentByPath[currentPath] || contentByPath[projectsPath] || [];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return currentItems;
    const q = searchQuery.toLowerCase();
    return currentItems.filter((it) => it.name.toLowerCase().includes(q));
  }, [currentItems, searchQuery]);

  const confirmDelete = (count) => {
    const message = count > 1
      ? "Are you sure you want to delete these items?"
      : "Are you sure you want to delete this item?";
    return window.confirm(message);
  };

  const handleRename = (project) => {
    const name = prompt("Rename", project.name);
    if (!name || name === project.name) return;
    setProjects((prev) => prev.map((it) => (it.name === project.name ? { ...it, name } : it)));
  };

  const handleDelete = (project) => {
    if (!confirmDelete(1)) return;
    onMoveToRecycleBin?.(project, projectsPath);
    setProjects((prev) => prev.filter((it) => it.name !== project.name));
    setSelectedIds([]);
  };

  const handleOpen = (project) => {
    if (project.link) window.open(project.link, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const restores = pendingRestores?.[projectsPath];
    if (!restores || restores.length === 0) return;
    setProjects((prev) => {
      const existing = new Set(prev.map((it) => it.name));
      const toAdd = restores
        .map((r) => r.payload || { id: `restored-${r.name}`, name: r.name, description: "", link: "", icon: "/icons/document.png", type: "File", size: "—", isFolder: false })
        .filter((it) => !existing.has(it.name));
      return [...toAdd, ...prev];
    });
    onConsumeRestore?.(projectsPath);
  }, [pendingRestores, onConsumeRestore]);

  const handleNavigatePath = (path) => {
    if (!path) return;
    pushPath(path);
    setSelectedIds([]);
  };

  const handleItemDoubleClick = (item) => {
    if (!item) return;
    if (currentPath === documentsPath && item.name === "Projects") {
      pushPath(projectsPath);
      setSelectedIds([]);
      return;
    }
    handleOpen(item);
  };

  const pathDisplay = currentPath;
  const pathSegments = buildPathSegments(currentPath);

  return (
    <Window title="📂 Projects" onClose={onClose} onMinimize={onMinimize} closing={closing}>
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

        <div className="flex-1 overflow-auto min-h-0 folder-scroll">
          <FileTable
            items={filteredItems}
            viewMode={viewMode}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onItemClick={(item) => setSelectedIds([item.id ?? item.name])}
            onItemDoubleClick={handleItemDoubleClick}
            onItemContextMenu={(item, e) => {
              if (!onContextMenuRequested) return;
              e.preventDefault();
              e.stopPropagation();
              onContextMenuRequested({
                x: e.clientX,
                y: e.clientY,
                targetId: null,
                items: [
                  { key: "open", label: "Open", onClick: () => handleItemDoubleClick(item) },
                  { key: "shortcut", label: "Create shortcut", onClick: () => onCreateDesktopShortcut?.(item, projectsPath) },
                  { key: "rename", label: "Rename", onClick: () => handleRename(item) },
                  { key: "delete", label: "Delete", onClick: () => handleDelete(item) },
                ],
              });
            }}
          />
        </div>
      </div>
    </Window>
  );
}
