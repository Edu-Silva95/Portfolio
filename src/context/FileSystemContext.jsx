import { createContext, useContext, useState } from "react";
import { pathMap as initialPathMap } from "../config/fileSystemData";
import { initialIcons } from "../config/desktopConfig";

const FileSystemContext = createContext(null);

export function FileSystemProvider({ children }) {
  const [fileTree, setFileTree] = useState(() => {
    const tree = JSON.parse(JSON.stringify(initialPathMap || {}));

    // Ensure Desktop has a 'Project Info' folder entry (used by About window)
    const desktopKey = "This PC > Desktop";
    const aboutFolder = { id: "about-folder", name: "Project Info", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true };
    if (!tree[desktopKey]) tree[desktopKey] = { content: [aboutFolder] };
    else if (!Array.isArray(tree[desktopKey].content) || !tree[desktopKey].content.some((it) => it.name === "Project Info")) {
      tree[desktopKey].content = [aboutFolder, ...(tree[desktopKey].content || [])];
    }

    // Ensure desktop content items have position data; use `initialIcons` as source of positions when available
    if (Array.isArray(tree[desktopKey].content)) {
      const byId = Object.fromEntries((initialIcons || []).map((it) => [it.id, it]));
      tree[desktopKey].content = tree[desktopKey].content.map((c, i) => {
        const match = byId[c.id] || byId[c.name];
          if (match) {
            return {
              id: c.id || match.id || `icon-${i}`,
              name: c.name || match.label || c.label,
              label: c.name || c.label || match.label,
              icon: c.icon || match.icon,
              x: match.x,
              y: match.y,
              isFolder: !!(c.isFolder || match.isFolder),
              isShortcut: !!match.isShortcut,
              targetId: c.targetId || match.targetId,
            };
          }
        // fallback: assign a simple stacked position
        return { id: c.id || `icon-${i}`, name: c.name || c.label, label: c.name || c.label, icon: c.icon, x: 1, y: 1 + i * 96, isFolder: !!c.isFolder, isShortcut: !!c.isShortcut, targetId: c.targetId };
      });
    }

    // Ensure Desktop > Project Info has the Readme file
    const aboutReadmeKey = "This PC > Desktop > Project Info";
    const readme = { id: "readme-file", name: "Readme.txt", icon: "/icons/document.png", type: "Text Document", size: "1 KB", isOpenable: true };
    if (!tree[aboutReadmeKey]) tree[aboutReadmeKey] = { content: [readme] };
    else if (!Array.isArray(tree[aboutReadmeKey].content) || !tree[aboutReadmeKey].content.some((it) => it.name === "Readme.txt")) {
      tree[aboutReadmeKey].content = [readme, ...(tree[aboutReadmeKey].content || [])];
    }

    // Ensure Games folder under Documents contains DOOM
    const docsGamesKey = "This PC > Documents > Games";
    const doomItem = { name: "DOOM", icon: "/icons/doom.png", type: "Game", size: "—", isFolder: false, isOpenable: true };
    if (!tree[docsGamesKey]) tree[docsGamesKey] = { content: [doomItem] };
    else if (!Array.isArray(tree[docsGamesKey].content) || !tree[docsGamesKey].content.some((it) => it.name === "DOOM")) {
      tree[docsGamesKey].content = [...(tree[docsGamesKey].content || []), doomItem];
    }

    return tree;
  });

  // Desktop helpers operate on `This PC > Desktop` content inside fileTree
  const getDesktopIcons = () => {
    const entry = fileTree["This PC > Desktop"] || {};
    // Desktop icons stored as objects with id,label,icon,x,y,isFolder,isShortcut, etc.
    return Array.isArray(entry.content) ? entry.content : [];
  };

  function setDesktopIcons(updater) {
    setFileTree((prev) => {
      const entry = prev["This PC > Desktop"] ? { ...prev["This PC > Desktop"] } : { content: [] };
      const current = Array.isArray(entry.content) ? [...entry.content] : [];
      const nextContent = typeof updater === "function" ? updater(current) : Array.isArray(updater) ? updater : current;
      return { ...prev, ["This PC > Desktop"]: { ...entry, content: nextContent } };
    });
  }

  const findFreePosition = (existing = []) => {
    const ICON_W = 100;
    const ICON_H = 96;
    const PADDING_X = 1;
    const PADDING_Y = 1;
    const cols = Math.max(1, Math.floor((window.innerWidth - 8 - PADDING_X) / ICON_W));
    const maxCols = Math.min(15, cols);
    const occupied = new Set((existing || []).map((it) => `${it.x}:${it.y}`));
    const maxRows = 7;

    for (let col = 0; col < maxCols; col++) {
      for (let row = 0; row < maxRows; row++) {
        const x = PADDING_X + col * ICON_W;
        const y = PADDING_Y + row * ICON_H;
        if (!occupied.has(`${x}:${y}`)) return { x, y };
      }
    }

    return { x: PADDING_X, y: PADDING_Y };
  };

  const updateDesktopIconPosition = (id, x, y) => {
    setDesktopIcons((prev) => {
      const maxX = window.innerWidth - 100 - 8;
      const maxY = window.innerHeight - 96 - 80;
      const clampedX = Math.min(Math.max(0, x), maxX);
      const clampedY = Math.min(Math.max(0, y), maxY);
      const col = Math.round((clampedX - 1) / 100);
      const row = Math.round((clampedY - 1) / 96);
      const nx = 1 + col * 100;
      const ny = 1 + row * 96;
      const old = prev.find((it) => it.id === id);
      const other = prev.find((it) => it.id !== id && it.x === nx && it.y === ny);
      return prev.map((it) => {
        if (it.id === id) return { ...it, x: nx, y: ny };
        if (other && it.id === other.id) return { ...it, x: old?.x, y: old?.y };
        return it;
      });
    });
  };

  function createFolder(path, name = "New folder") {
    console.log("createFolder called with path:", path);
    setFileTree((prev) => {
      const entry = prev[path] || {};

      const newFolder = {
        id: `folder-${Date.now()}`,
        name,
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "—",
        isFolder: true,
      };

      // If the path is the root "This PC" or the entry uses a `folders` list, add to folders.
      if (path === "This PC" || Array.isArray(entry.folders)) {
        const current = Array.isArray(entry.folders) ? entry.folders : [];
        return {
          ...prev,
          [path]: {
            ...entry,
            folders: [newFolder, ...current],
          },
        };
      }

      // Default: add to content array for regular folder paths
      const current = Array.isArray(entry.content) ? entry.content : [];
      return {
        ...prev,
        [path]: {
          ...entry,
          content: [newFolder, ...current],
        },
      };
    });

    // If the new folder was created on the Desktop, also create a desktop icon
    if (path === "This PC > Desktop") {
      const pos = findFreePosition(getDesktopIcons());
      const id = `desktop-${Date.now()}`;
      const iconObj = { id, name, label: name, icon: "/icons/icons8-folder-94.png", isFolder: true, x: pos.x, y: pos.y };
      setDesktopIcons((prev) => [iconObj, ...(prev || [])]);
    }
  }

  function handleContextMenu(e, currentPath, onContextMenuRequested) {
    console.log("handleContextMenu invoked for", currentPath);
    e.preventDefault();
    e.stopPropagation();
    onContextMenuRequested?.({
      x: e.clientX,
      y: e.clientY,
      targetId: null,
      currentFolderPath: currentPath,
      items: [
        { key: "new", label: "New folder", onClick: () => createFolder(currentPath) },
        { key: "refresh", label: "Refresh", onClick: () => window.location.reload() },
      ],
    });
  }

  return (
    <FileSystemContext.Provider value={{ fileTree, setFileTree, createFolder, handleContextMenu, getDesktopIcons, setDesktopIcons, findFreePosition, updateDesktopIconPosition }}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  return useContext(FileSystemContext);
}