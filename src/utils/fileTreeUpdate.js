// This file contains utility functions for managing and updating a file tree structure, such as moving items between folders and updating folder contents. The functions are designed to work with a tree represented as an object where keys are folder paths and values are folder entries containing metadata and content lists.
export const resolveThisPcPath = (path) => {
  const p = String(path || "");
  if (!p) return "";
  return p.startsWith("This PC") ? p : `This PC > ${p}`;
};
// Helper to get a unique key for a file tree item, using `id` if available or falling back to `name`.
export const getTreeItemKey = (item) => item?.id ?? item?.name;

// Some items rely on `type` instead of `isFolder`.
export const isFolderLikeItem = (item) => {
  if (!item) return false;
  if (item?.isFolder) return true;
  const t = String(item?.type || "").toLowerCase();
  return t === "folder" || t === "file folder";
};
// Generates a unique name for a moved item based on the target folder's existing item names to avoid conflicts.
const makeUniqueName = (baseName, existingNames) => {
  const base = String(baseName || "").trim() || "New item";
  if (!existingNames.has(base)) return base;
  let i = 2;
  while (existingNames.has(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
};
// Creates a shallow clone of a folder entry, ensuring that the `content` list is also cloned to avoid mutating the original tree when making updates.
const cloneEntryWithContent = (entry) => {
  const next = entry && typeof entry === "object" ? { ...entry } : {};
  const list = Array.isArray(next.content) ? [...next.content] : [];
  next.content = list;
  return next;
};

const cloneEntryDeep = (entry, transformItem = null) => {
  const next = entry && typeof entry === "object" ? { ...entry } : {};
  const cloneList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((it) => {
      if (!it || typeof it !== "object") return it;
      const cloned = { ...it };
      return typeof transformItem === "function" ? (transformItem(cloned) || cloned) : cloned;
    });
  };

  if (Array.isArray(next.content)) next.content = cloneList(next.content);
  if (Array.isArray(next.folders)) next.folders = cloneList(next.folders);
  if (Array.isArray(next.drives)) next.drives = cloneList(next.drives);

  // Ensure list props exist as arrays when the original did.
  if (entry && typeof entry === "object") {
    if (Array.isArray(entry.content) && !Array.isArray(next.content)) next.content = [];
    if (Array.isArray(entry.folders) && !Array.isArray(next.folders)) next.folders = [];
    if (Array.isArray(entry.drives) && !Array.isArray(next.drives)) next.drives = [];
  }

  return next;
};
// Moves items from one folder to another within the file tree, handling both the source and destination updates, ensuring unique naming in the destination, and also moving any nested folder structures if a folder is moved.
const collectSubtreeKeys = (tree, rootPath) => {
  const prefix = `${rootPath} >`;
  return Object.keys(tree || {}).filter((k) => k === rootPath || k.startsWith(prefix));
};
// Main function to move items in the file tree, which can handle both files and folders, ensuring that folder moves also transfer their entire subtree and that naming conflicts are resolved in the destination folder.
export const moveFileTreeItems = (
  prevTree,
  {
    fromPath,
    toPath,
    itemKeys = [],
    fromListKey = "content",
    toListKey = "content",
    transformMovedItem = null,
  } = {}
) => {
  if (!prevTree || typeof prevTree !== "object") return prevTree;

  const resolvedFrom = resolveThisPcPath(fromPath);
  const resolvedTo = resolveThisPcPath(toPath);
  if (!resolvedFrom || !resolvedTo) return prevTree;
  if (resolvedFrom === resolvedTo) return prevTree;
  // Ensure itemKeys is an array of unique, non-empty keys.
  const keys = Array.from(new Set((Array.isArray(itemKeys) ? itemKeys : [itemKeys]).filter(Boolean)));
  if (keys.length === 0) return prevTree;

  const fromEntryRaw = prevTree[resolvedFrom];
  const fromListRaw = fromEntryRaw?.[fromListKey];
  if (!Array.isArray(fromListRaw) || fromListRaw.length === 0) return prevTree;

  // Prepare next tree with cloned source/destination entries.
  const nextTree = { ...prevTree };
  const fromEntry = { ...(fromEntryRaw || {}), [fromListKey]: [...fromListRaw] };
  nextTree[resolvedFrom] = fromEntry;

  const toEntryRaw = prevTree[resolvedTo];
  const toEntry = toListKey === "content" ? cloneEntryWithContent(toEntryRaw) : { ...(toEntryRaw || {}), [toListKey]: Array.isArray(toEntryRaw?.[toListKey]) ? [...toEntryRaw[toListKey]] : [] };
  nextTree[resolvedTo] = toEntry;

  const toList = Array.isArray(toEntry[toListKey]) ? toEntry[toListKey] : (toEntry[toListKey] = []);
  const existingNames = new Set(toList.map((it) => String(it?.name || "")));

  let changed = false;

  for (const key of keys) {
    const idx = fromEntry[fromListKey].findIndex((it) => getTreeItemKey(it) === key);
    if (idx < 0) continue;
    const item = fromEntry[fromListKey][idx];
    if (!item) continue;

    const itemIsFolder = isFolderLikeItem(item);

    // Disallow dropping a folder into itself / its descendants.
    if (itemIsFolder) {
      const oldFolderPath = `${resolvedFrom} > ${item.name}`;
      if (resolvedTo === oldFolderPath || resolvedTo.startsWith(`${oldFolderPath} >`)) {
        continue;
      }
    }

    const finalName = makeUniqueName(item.name, existingNames);
    existingNames.add(finalName);

    // Remove from source.
    fromEntry[fromListKey].splice(idx, 1);

    // Add to destination.
    let movedItem = {
      ...item,
      ...(itemIsFolder ? { isFolder: true } : null),
      // Preserve the original name for open logic that shouldn't break on conflict-renames.
      ...(finalName !== item.name && !item.originalName ? { originalName: item.name } : null),
      name: finalName,
      label: finalName,
    };

    if (typeof transformMovedItem === "function") {
      movedItem = transformMovedItem(movedItem, {
        fromPath: resolvedFrom,
        toPath: resolvedTo,
        oldName: item.name,
        newName: finalName,
      }) || movedItem;
    }

    toList.unshift(movedItem);
    changed = true;

    // If it's a folder, move its subtree keys.
    if (itemIsFolder) {
      const oldRoot = `${resolvedFrom} > ${item.name}`;
      const newRoot = `${resolvedTo} > ${finalName}`;

      const subtreeKeys = collectSubtreeKeys(prevTree, oldRoot);
      if (subtreeKeys.length === 0) {
        // Ensure destination key exists so the folder can be opened.
        if (!nextTree[newRoot]) nextTree[newRoot] = { content: [] };
      } else {
        subtreeKeys.forEach((k) => {
          const suffix = k.slice(oldRoot.length);
          const nk = `${newRoot}${suffix}`;
          nextTree[nk] = { ...(prevTree[k] || {}) };
        });
        subtreeKeys.forEach((k) => {
          delete nextTree[k];
        });
      }
    }
  }

  if (!changed) return prevTree;
  return nextTree;
};

// Copy items from one folder to another within the file tree, without removing them from the source.
// Supports copying folder subtrees and resolves naming conflicts in the destination.
export const copyFileTreeItems = (
  prevTree,
  {
    fromPath,
    toPath,
    itemKeys = [],
    fromListKey = "content",
    toListKey = "content",
    transformCopiedItem = null,
    transformCopiedSubtreeItem = null,
  } = {}
) => {
  if (!prevTree || typeof prevTree !== "object") return prevTree;

  const resolvedFrom = resolveThisPcPath(fromPath);
  const resolvedTo = resolveThisPcPath(toPath);
  if (!resolvedFrom || !resolvedTo) return prevTree;

  const keys = Array.from(new Set((Array.isArray(itemKeys) ? itemKeys : [itemKeys]).filter(Boolean)));
  if (keys.length === 0) return prevTree;

  const fromEntryRaw = prevTree[resolvedFrom];
  const fromListRaw = fromEntryRaw?.[fromListKey];
  if (!Array.isArray(fromListRaw) || fromListRaw.length === 0) return prevTree;

  const nextTree = { ...prevTree };

  // Clone destination entry (and clone source too if from==to and listKey differs).
  const toEntryRaw = prevTree[resolvedTo];
  const toEntry =
    toListKey === "content"
      ? cloneEntryWithContent(toEntryRaw)
      : { ...(toEntryRaw || {}), [toListKey]: Array.isArray(toEntryRaw?.[toListKey]) ? [...toEntryRaw[toListKey]] : [] };
  nextTree[resolvedTo] = toEntry;

  // If copying into the same entry+list, operate on the single cloned list.
  const toList = Array.isArray(toEntry[toListKey]) ? toEntry[toListKey] : (toEntry[toListKey] = []);
  const existingNames = new Set(toList.map((it) => String(it?.name || "")));

  let changed = false;
  // Process each item to copy.
  for (const key of keys) {
    const item = fromListRaw.find((it) => getTreeItemKey(it) === key);
    if (!item) continue;

    const itemIsFolder = isFolderLikeItem(item);

    // Disallow copying a folder into itself / its descendants (avoids weird recursion).
    if (itemIsFolder) {
      const oldFolderPath = `${resolvedFrom} > ${item.name}`;
      if (resolvedTo === oldFolderPath || resolvedTo.startsWith(`${oldFolderPath} >`)) {
        continue;
      }
    }

    const finalName = makeUniqueName(item.name, existingNames);
    existingNames.add(finalName);

    let copiedItem = {
      ...item,
      ...(itemIsFolder ? { isFolder: true } : null),
      ...(finalName !== item.name && !item.originalName ? { originalName: item.name } : null),
      name: finalName,
      label: finalName,
    };
    // Allow transforming the copied item (e.g. to assign a new ID) and also transforming items in the copied subtree.
    if (typeof transformCopiedItem === "function") {
      copiedItem = transformCopiedItem(copiedItem, {
        fromPath: resolvedFrom,
        toPath: resolvedTo,
        oldName: item.name,
        newName: finalName,
      }) || copiedItem;
    }

    toList.unshift(copiedItem);
    changed = true;
    // If it's a folder, copy its subtree keys.
    if (itemIsFolder) {
      const oldRoot = `${resolvedFrom} > ${item.name}`;
      const newRoot = `${resolvedTo} > ${finalName}`;

      const subtreeKeys = collectSubtreeKeys(prevTree, oldRoot);
      if (subtreeKeys.length === 0) {
        if (!nextTree[newRoot]) nextTree[newRoot] = { content: [] };
      } else {
        subtreeKeys.forEach((k) => {
          const suffix = k.slice(oldRoot.length);
          const nk = `${newRoot}${suffix}`;
          nextTree[nk] = cloneEntryDeep(prevTree[k] || {}, transformCopiedSubtreeItem);
        });
      }
    }
  }

  return changed ? nextTree : prevTree;
};

export const updateFileTreeList = (prevTree, path, listKey, updater) => {
  if (!prevTree || typeof prevTree !== "object") return prevTree;
  if (!path) return prevTree;
  if (typeof updater !== "function") return prevTree;

  const entry = prevTree[path] ? { ...prevTree[path] } : { [listKey]: [] };
  const list = Array.isArray(entry[listKey]) ? [...entry[listKey]] : [];
  const nextList = updater(list);

  return {
    ...prevTree,
    [path]: {
      ...entry,
      [listKey]: Array.isArray(nextList) ? nextList : list,
    },
  };
};
