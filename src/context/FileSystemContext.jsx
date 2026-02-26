import { createContext, useContext, useState } from "react";
import { pathMap as initialPathMap } from "../config/fileSystemData";

const FileSystemContext = createContext(null);

export function FileSystemProvider({ children }) {
  const [fileTree, setFileTree] = useState(() => {
    const tree = JSON.parse(JSON.stringify(initialPathMap || {}));

    // Ensure Desktop has an 'About' folder entry (used by AboutWindow)
    const desktopKey = "This PC > Desktop";
    const aboutFolder = { id: "about-folder", name: "About", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true };
    if (!tree[desktopKey]) tree[desktopKey] = { content: [aboutFolder] };
    else if (!Array.isArray(tree[desktopKey].content) || !tree[desktopKey].content.some((it) => it.name === "About")) {
      tree[desktopKey].content = [aboutFolder, ...(tree[desktopKey].content || [])];
    }

    // Ensure Desktop > About has the Readme file
    const aboutReadmeKey = "This PC > Desktop > About";
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
  const [desktopHandler, setDesktopHandler] = useState(null);

  function registerDesktopHandler(handler) {
    setDesktopHandler(() => handler);
  }

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

    // If the new folder was created on the Desktop, also create a desktop icon when a handler is registered
    if (path === "This PC > Desktop" && desktopHandler && typeof desktopHandler.setIcons === "function") {
      try {
        const icons = typeof desktopHandler.getIcons === "function" ? desktopHandler.getIcons() : [];
        const pos = typeof desktopHandler.findFreePosition === "function" ? desktopHandler.findFreePosition(icons) : { x: 8, y: 8 };
        const id = `desktop-${Date.now()}`;
        const iconObj = { id, label: name, icon: "/icons/icons8-folder-94.png", isFolder: true, x: pos.x, y: pos.y };
        desktopHandler.setIcons((prev) => [iconObj, ...(prev || [])]);
      } catch (err) {
        console.error("Failed to add desktop icon for new folder:", err);
      }
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
    <FileSystemContext.Provider value={{ fileTree, setFileTree, createFolder, handleContextMenu }}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  return useContext(FileSystemContext);
}

