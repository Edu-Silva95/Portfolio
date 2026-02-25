import { useCallback } from "react";

export default function useCreateShortcut({ icons, setIcons, windowsConfig, findFreePosition }) {
  // Returns a function to create a shortcut for a given item and optional sourcePath
  const createDesktopShortcut = useCallback((item, sourcePath = "") => {
    if (!item) return;
    const id = `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const label = item.name || item.label || "Shortcut";
    const icon = (item?.icon && typeof item.icon === "string") ? item.icon : (item?.isFolder ? "/icons/icons8-folder-94.png" : "/icons/document.png");

    // Try to dynamically determine window and path
    let targetWindowId = null;
    let targetPath = null;

    // Handle files
    if (!item.isFolder) {
      const ext = item.name ? item.name.split('.').pop().toLowerCase() : "";
      // Special case for readme.txt as it gave me issues
      if (item.name && item.name.toLowerCase() === "readme.txt") {
        targetWindowId = "readme";
        targetPath = "/files/readme.txt";
      } else if (ext === "txt" || ext === "md" || ext === "log" || ext === "rtf") {
        targetWindowId = "notepad";
        targetPath = `/files/${item.name}`;
      } else if (ext === "pdf") {
        targetWindowId = "cv";
        targetPath = `/files/${item.name}`;
      } else if (ext === "docx" || ext === "doc") {
        targetWindowId = "documents";
        targetPath = `/files/${item.name}`;
      } else if (ext === "xlsx" || ext === "xls") {
        targetWindowId = "documents";
        targetPath = `/files/${item.name}`;
      } else if (item.name && item.name.toLowerCase().includes("dino")) {
        targetWindowId = "dino";
      } else if (item.name && item.name.toLowerCase().includes("doom")) {
        targetWindowId = "doom";
      } else if (item.name && item.name.toLowerCase().includes("cv")) {
        targetWindowId = "cv";
        targetPath = `/files/${item.name}`;
      } else if (sourcePath.startsWith("Documents")) {
        targetWindowId = "documents";
        targetPath = sourcePath;
      } else if (sourcePath.startsWith("This PC")) {
        targetWindowId = "thispc";
        targetPath = sourcePath;
      } else {
        // Fallback: try to use item.id if it's a valid window
        if (item.id && windowsConfig[item.id]) {
          targetWindowId = item.id;
        }
        // Fallback: generic notepad
        if (!targetWindowId) {
          targetWindowId = "notepad";
          targetPath = `/files/${item.name}`;
        }
      }
    } else {
      // Handle folders
      if (item.id && windowsConfig[item.id]) {
        targetWindowId = item.id;
        targetPath = sourcePath ? `${sourcePath} > ${item.name}` : item.name;
      } else if (sourcePath.startsWith("Documents")) {
        targetWindowId = "documents";
        targetPath = `${sourcePath} > ${item.name}`;
      } else if (sourcePath.startsWith("This PC")) {
        targetWindowId = "thispc";
        targetPath = `${sourcePath} > ${item.name}`;
      } else {
        // Fallback: generic documents
        targetWindowId = "documents";
        targetPath = `${sourcePath} > ${item.name}`;
      }
    }

    const pos = findFreePosition(icons);
    setIcons((prev) => [
      {
        id,
        label,
        icon,
        x: pos.x,
        y: pos.y,
        isFolder: !!item.isFolder,
        isShortcut: true,
        targetWindowId,
        targetPath,
        payload: item.payload || undefined,
      },
      ...prev,
    ]);
  }, [icons, setIcons, windowsConfig, findFreePosition]);

  return createDesktopShortcut;
}
