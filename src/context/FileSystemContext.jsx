import { createContext, useContext, useEffect, useRef, useState } from "react";
import { pathMap as initialPathMap } from "../config/fileSystemData";
import { initialIcons } from "../config/desktopConfig";
import { copyFileTreeItems, isFolderLikeItem, moveFileTreeItems, resolveThisPcPath } from "../utils/fileTreeUpdate";

const FileSystemContext = createContext(null);

export function FileSystemProvider({ children }) {
  const [clipboard, setClipboard] = useState(null);
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
            const isFolder = !!(c.isFolder || match.isFolder);
            return {
              id: c.id || match.id || `icon-${i}`,
              name: c.name || match.label || c.label,
              label: c.name || c.label || match.label,
              icon: c.icon || match.icon,
              x: match.x,
              y: match.y,
              isFolder,
              isShortcut: !!match.isShortcut,
              targetId: c.targetId || match.targetId,
              targetWindowId: c.targetWindowId || match.targetWindowId,
              targetPath: c.targetPath || match.targetPath,
              type: c.type ?? (isFolder ? "File folder" : "Shortcut"),
              size: c.size ?? (isFolder ? "—" : "1 KB"),
              isOpenable: c.isOpenable ?? true,
              url: c.url,
            };
          }
        // fallback: assign a simple stacked position
        const isFolder = !!c.isFolder;
        return {
          id: c.id || `icon-${i}`,
          name: c.name || c.label,
          label: c.name || c.label,
          icon: c.icon,
          x: 1,
          y: 1 + i * 96,
          isFolder,
          isShortcut: !!c.isShortcut,
          targetId: c.targetId,
          targetWindowId: c.targetWindowId,
          targetPath: c.targetPath,
          type: c.type ?? (isFolder ? "File folder" : "Shortcut"),
          size: c.size ?? (isFolder ? "—" : "1 KB"),
          isOpenable: c.isOpenable ?? true,
          url: c.url,
        };
      });
    }

    // Ensure Desktop > Project Info has the Readme file
    const aboutReadmeKey = "This PC > Desktop > Project Info";
    const readme = { id: "readme-file", name: "Readme.txt", icon: "/icons/document.png", type: "Text Document", size: "1 KB", isOpenable: true, path: "/files/Readme.txt", targetWindowId: "readme" };
    if (!tree[aboutReadmeKey]) tree[aboutReadmeKey] = { content: [readme] };
    else if (!Array.isArray(tree[aboutReadmeKey].content) || !tree[aboutReadmeKey].content.some((it) => it.name === "Readme.txt")) {
      tree[aboutReadmeKey].content = [readme, ...(tree[aboutReadmeKey].content || [])];
    }

    // Ensure Games folder under Documents contains DOOM
    const docsGamesKey = "This PC > Documents > Games";
    const doomItem = { name: "DOOM", icon: "/icons/doom.png", type: "Application", size: "2.39 MB", isFolder: false, isOpenable: true, targetWindowId: "doom" };
    if (!tree[docsGamesKey]) tree[docsGamesKey] = { content: [doomItem] };
    else if (!Array.isArray(tree[docsGamesKey].content) || !tree[docsGamesKey].content.some((it) => it.name === "DOOM")) {
      tree[docsGamesKey].content = [...(tree[docsGamesKey].content || []), doomItem];
    }

    return tree;
  });

  // One-time repair pass: normalize open-metadata across the whole tree so
  // items keep opening after moving between folders/Desktop.
  const didNormalizeFileTreeRef = useRef(false);
  useEffect(() => {
    if (didNormalizeFileTreeRef.current) return;
    didNormalizeFileTreeRef.current = true;

    const getEntryItems = (entry) => {
      const content = Array.isArray(entry?.content) ? entry.content : [];
      const folders = Array.isArray(entry?.folders) ? entry.folders : [];
      const drives = Array.isArray(entry?.drives) ? entry.drives : [];
      return [...content, ...folders, ...drives];
    };

    const inferProjectIdForPath = (tree, path) => {
      const parts = String(path || "")
        .split(" > ")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length < 2) return null;

      const folderName = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join(" > ");
      const parentEntry = tree?.[parentPath];
      const parentItems = getEntryItems(parentEntry);
      const match = parentItems.find((it) => it?.isFolder && it?.name === folderName && it?.projectId);
      return match?.projectId || null;
    };

    setFileTree((prev) => {
      if (!prev || typeof prev !== "object") return prev;

      let changed = false;
      const nextTree = { ...prev };

      for (const [path, entry] of Object.entries(prev)) {
        const list = Array.isArray(entry?.content) ? entry.content : null;
        if (!list || list.length === 0) continue;

        const projectIdForFolder = inferProjectIdForPath(prev, path);
        let nextList = null;

        for (let i = 0; i < list.length; i += 1) {
          const item = list[i];
          if (!item || typeof item !== "object") continue;

          let updated = item;
          const name = String(item?.originalName || item?.name || "");
          const lower = name.toLowerCase();

          // Project virtual files should carry projectId/kind so they open anywhere.
          if (projectIdForFolder && !item.isFolder) {
            const isReadme = lower === "readme.txt";
            const isDemo = /_live_demo\.mp4$/i.test(name.trim()) || lower === "live_demo_link.txt";

            if (isReadme && item.projectId !== projectIdForFolder) {
              updated = { ...updated, projectId: projectIdForFolder, projectVirtualKind: updated.projectVirtualKind || "readme" };
            }
            if (isDemo && item.projectId !== projectIdForFolder) {
              updated = { ...updated, projectId: projectIdForFolder, projectVirtualKind: updated.projectVirtualKind || "demo" };
            }
          }

          // Known openables by name should carry targetWindowId so they open anywhere.
          if (!updated.isFolder) {
            if (lower === "curriculum_vitae_2026.pdf" && updated.targetWindowId !== "cv") {
              updated = { ...updated, isOpenable: true, targetWindowId: "cv" };
            }
            if (lower === "doom" && !updated.targetWindowId) {
              updated = { ...updated, isOpenable: true, targetWindowId: "doom" };
            }
            if (lower === "dino game" && !updated.targetWindowId) {
              updated = { ...updated, isOpenable: true, targetWindowId: "dino" };
            }
          }

          if (updated !== item) {
            if (!nextList) nextList = [...list];
            nextList[i] = updated;
          }
        }

        if (nextList) {
          nextTree[path] = { ...(entry || {}), content: nextList };
          changed = true;
        }
      }

      return changed ? nextTree : prev;
    });
  }, [setFileTree]);

  // One-time repair pass: ensure desktop items always have stable ids/labels.
  // This fixes items moved before drag/drop normalization existed.
  const didNormalizeDesktopRef = useRef(false);
  useEffect(() => {
    if (didNormalizeDesktopRef.current) return;
    didNormalizeDesktopRef.current = true;

    setFileTree((prev) => {
      const entry = prev["This PC > Desktop"];
      const list = Array.isArray(entry?.content) ? entry.content : [];
      if (!list.length) return prev;

      let changed = false;
      const nextList = list.map((it) => {
        const next = { ...it };
        if (!next.id) {
          const uuid = (typeof crypto !== "undefined" && crypto?.randomUUID) ? crypto.randomUUID() : null;
          next.id = `item-${uuid || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
          changed = true;
        }
        if (!next.label && next.name) {
          next.label = next.name;
          changed = true;
        }
        return next;
      });

      if (!changed) return prev;
      return { ...prev, ["This PC > Desktop"]: { ...(entry || {}), content: nextList } };
    });
  }, [setFileTree]);

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

  function moveItems({ fromPath, toPath, itemKeys, fromListKey = "content", toListKey = "content" } = {}) {
    const resolvedTo = resolveThisPcPath(toPath);
    const movingIntoDesktop = resolvedTo === "This PC > Desktop";

    const ensureId = (item) => {
      if (item?.id) return item.id;
      // Use crypto when available for uniqueness; fall back to time+random.
      const uuid = (typeof crypto !== "undefined" && crypto?.randomUUID) ? crypto.randomUUID() : null;
      return `item-${uuid || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
    };

    // Allocate desktop positions for moved items that don't already have x/y.
    setFileTree((prev) => {
      let workingDesktop = movingIntoDesktop
        ? (Array.isArray(prev["This PC > Desktop"]?.content) ? [...prev["This PC > Desktop"].content] : [])
        : null;

      return moveFileTreeItems(prev, {
        fromPath,
        toPath,
        itemKeys,
        fromListKey,
        toListKey,
        transformMovedItem: (item, ctx) => {
          const isDestDesktop = ctx?.toPath === "This PC > Desktop";
          const next = { ...item };

          // Desktop rendering expects stable ids.
          if (isDestDesktop) {
            next.id = ensureId(next);
            if (!next.label) next.label = next.name;
          }

          // Be robust: some folder entries rely on `type` instead of `isFolder`.
          const looksLikeFolder = isFolderLikeItem(next);
          if (looksLikeFolder) next.isFolder = true;

          if (looksLikeFolder) {
            const newFolderPath = `${ctx.toPath} > ${ctx.newName}`;
            if (isDestDesktop) {
              next.targetWindowId = "thispc";
              next.targetPath = newFolderPath;
              next.isOpenable = true;
              if (!next.type) next.type = "File folder";
            } else if (typeof next.targetPath === "string") {
              next.targetPath = newFolderPath;
            }
          }

          if (isDestDesktop) {
            const hasPos = Number.isFinite(next.x) && Number.isFinite(next.y);
            if (!hasPos) {
              const pos = findFreePosition(workingDesktop || []);
              next.x = pos.x;
              next.y = pos.y;
              workingDesktop = [...(workingDesktop || []), { ...next }];
            }
          }

          return next;
        },
      });
    });
  }

  const normalizeKeys = (keys) => {
    const list = Array.isArray(keys) ? keys : [keys];
    return Array.from(new Set(list.filter(Boolean)));
  };

  const newId = (prefix = "item") => {
    const uuid = (typeof crypto !== "undefined" && crypto?.randomUUID) ? crypto.randomUUID() : null;
    return `${prefix}-${uuid || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
  };

  function copyItems({ fromPath, itemKeys, fromListKey = "content" } = {}) {
    const resolvedFrom = resolveThisPcPath(fromPath);
    const keys = normalizeKeys(itemKeys);
    if (!resolvedFrom || keys.length === 0) return;

    // Exception: devices/drives should not be copyable.
    if (resolvedFrom === "This PC" && fromListKey === "drives") return;

    setClipboard({ kind: "fs-items", fromPath: resolvedFrom, fromListKey, itemKeys: keys, copiedAt: Date.now() });
  }

  function pasteItems({ toPath, toListKey = "content", position = null } = {}) {
    const clip = clipboard;
    if (!clip || clip.kind !== "fs-items") return;

    const resolvedTo = resolveThisPcPath(toPath);
    if (!resolvedTo) return;

    // Avoid pasting into This PC root (ambiguous: folders vs drives).
    if (resolvedTo === "This PC") return;

    const resolvedFrom = resolveThisPcPath(clip.fromPath);
    const keys = normalizeKeys(clip.itemKeys);
    if (!resolvedFrom || keys.length === 0) return;

    const isDestDesktop = resolvedTo === "This PC > Desktop";

    setFileTree((prev) => {
      let workingDesktop = isDestDesktop
        ? (Array.isArray(prev["This PC > Desktop"]?.content) ? [...prev["This PC > Desktop"].content] : [])
        : null;

      const tryUsePosition = (pos) => {
        if (!isDestDesktop) return null;
        if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return null;
        const occupied = new Set((workingDesktop || []).map((it) => `${it.x}:${it.y}`));
        return occupied.has(`${pos.x}:${pos.y}`) ? null : { x: pos.x, y: pos.y };
      };

      let firstPlaced = false;

      return copyFileTreeItems(prev, {
        fromPath: resolvedFrom,
        toPath: resolvedTo,
        itemKeys: keys,
        fromListKey: clip.fromListKey || "content",
        toListKey,
        transformCopiedSubtreeItem: (item) => {
          // Regenerate ids inside copied folder subtrees to keep them independent.
          if (item && typeof item === "object" && item.id) return { ...item, id: newId("item") };
          return item;
        },
        transformCopiedItem: (item, ctx) => {
          const next = { ...item };

          // Make copied items independent.
          if (next.id) next.id = newId("item");

          const looksLikeFolder = isFolderLikeItem(next);
          if (looksLikeFolder) next.isFolder = true;

          // Desktop-specific: position + folder navigation metadata.
          if (isDestDesktop) {
            if (!next.id) next.id = newId("item");
            if (!next.label) next.label = next.name;

            const pos = !firstPlaced ? (tryUsePosition(position) || findFreePosition(workingDesktop || [])) : findFreePosition(workingDesktop || []);
            firstPlaced = true;
            next.x = pos.x;
            next.y = pos.y;
            workingDesktop = [...(workingDesktop || []), { ...next }];

            if (looksLikeFolder) {
              const newFolderPath = `${ctx.toPath} > ${ctx.newName}`;
              next.targetWindowId = "thispc";
              next.targetPath = newFolderPath;
              next.isOpenable = true;
              if (!next.type) next.type = "File folder";
            }
          } else {
            // If copying *out of* desktop, strip layout-only props.
            if ("x" in next) delete next.x;
            if ("y" in next) delete next.y;

            // If the source item carried a targetPath (desktop folder), update it.
            if (looksLikeFolder && typeof next.targetPath === "string") {
              next.targetPath = `${ctx.toPath} > ${ctx.newName}`;
            }
          }

          return next;
        },
      });
    });
  }

  function createFolder(path, name = "New folder", options = null) {
    setFileTree((prev) => {
      const entry = prev[path] || {};

      const listKey = (path === "This PC" || Array.isArray(entry.folders)) ? "folders" : "content";
      const currentList = Array.isArray(entry[listKey]) ? entry[listKey] : [];

      const baseName = String(name || "New folder").trim() || "New folder";
      const existingNames = new Set(currentList.map((it) => String(it?.name || "")));
      let finalName = baseName;
      if (existingNames.has(finalName)) {
        let i = 2;
        while (existingNames.has(`${baseName} (${i})`)) i += 1;
        finalName = `${baseName} (${i})`;
      }

      const folderId = `folder-${Date.now()}`;
      const newFolderPath = `${path} > ${finalName}`;

      const isDesktop = path === "This PC > Desktop";
      const desktopIcons = isDesktop
        ? (Array.isArray(prev["This PC > Desktop"]?.content) ? prev["This PC > Desktop"].content : [])
        : null;

      const desiredPos = options?.position && Number.isFinite(options.position.x) && Number.isFinite(options.position.y)
        ? { x: options.position.x, y: options.position.y }
        : null;

      const resolveDesktopPosition = () => {
        if (!isDesktop) return null;
        const existing = Array.isArray(desktopIcons) ? desktopIcons : [];
        const occupied = new Set(existing.map((it) => `${it?.x}:${it?.y}`));

        if (!desiredPos) return findFreePosition(existing);

        const ICON_W = 100;
        const ICON_H = 96;
        const PADDING_X = 1;
        const PADDING_Y = 1;
        const maxX = window.innerWidth - ICON_W - 8;
        const maxY = window.innerHeight - ICON_H - 80;
        const clampedX = Math.min(Math.max(0, desiredPos.x), maxX);
        const clampedY = Math.min(Math.max(0, desiredPos.y), maxY);
        const col = Math.max(0, Math.round((clampedX - PADDING_X) / ICON_W));
        const row = Math.max(0, Math.round((clampedY - PADDING_Y) / ICON_H));
        const nx = PADDING_X + col * ICON_W;
        const ny = PADDING_Y + row * ICON_H;

        if (!occupied.has(`${nx}:${ny}`)) return { x: nx, y: ny };
        return findFreePosition(existing);
      };

      const pos = isDesktop ? resolveDesktopPosition() : null;

      // Single canonical folder item (also used as desktop icon when created on Desktop).
      const newFolder = {
        id: folderId,
        name: finalName,
        label: finalName,
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "—",
        isFolder: true,
        isOpenable: true,
        ...(isDesktop
          ? {
              x: pos.x,
              y: pos.y,
              targetWindowId: "thispc",
              targetPath: newFolderPath,
            }
          : null),
      };

      const nextTree = {
        ...prev,
        [path]: {
          ...entry,
          [listKey]: [newFolder, ...currentList],
        },
      };

      // Ensure the new folder path exists, so opening it shows an empty folder (instead of falling back to This PC root).
      if (!nextTree[newFolderPath]) {
        nextTree[newFolderPath] = { content: [] };
      }

      return nextTree;
    });
  }

  function handleContextMenu(e, currentPath, onContextMenuRequested) {
    console.log("handleContextMenu invoked for", currentPath);
    e.preventDefault();
    e.stopPropagation();

    const canPasteHere = !!(clipboard && clipboard.kind === "fs-items" && currentPath && currentPath !== "This PC");

    onContextMenuRequested?.({
      x: e.clientX,
      y: e.clientY,
      targetId: null,
      currentFolderPath: currentPath,
      items: [
        { key: "new", label: "New folder", onClick: () => createFolder(currentPath) },
        ...(canPasteHere ? [{ key: "paste", label: "Paste", onClick: () => pasteItems({ toPath: currentPath }) }] : []),
        { key: "refresh", label: "Refresh", onClick: () => window.location.reload() },
      ],
    });
  }

  return (
    <FileSystemContext.Provider value={{ fileTree, setFileTree, clipboard, setClipboard, copyItems, pasteItems, createFolder, moveItems, handleContextMenu, getDesktopIcons, setDesktopIcons, findFreePosition, updateDesktopIconPosition }}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  return useContext(FileSystemContext);
}