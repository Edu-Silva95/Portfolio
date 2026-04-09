import { openDesktopIcon } from "./desktopIconRouting";
// This file builds the context menu items for desktop icons and the desktop background, centralizing all related logic in one place for better maintainability and separation of concerns.
export const buildDesktopContextMenuItems = ({
  contextMenu,
  clipboard,
  copyItems,
  pasteItems,
  icons,
  setIcons,
  windowsConfig,
  openWindow,
  updateWindowPath,
  closeContextMenu,
  inspectElement,
  viewPageSource,
  selectedIds,
  setSelectedIds,
  confirmDesktopDelete,
  moveDesktopIconToRecycleBin,
  createFolder,
  findFreePosition,
  iconWidth,
  iconHeight,
  paddingX,
  paddingY,
}) => {
  const getNextPastePosition = () => {
    const rect = document.documentElement.getBoundingClientRect();
    const localX = Math.max(0, contextMenu.x - rect.left);
    const localY = Math.max(0, contextMenu.y - rect.top);
    const col = Math.max(0, Math.round((localX - paddingX) / iconWidth));
    const row = Math.max(0, Math.round((localY - paddingY) / iconHeight));
    const nx = paddingX + col * iconWidth;
    const ny = paddingY + row * iconHeight;
    const occupied = new Set(icons.map((it) => `${it.x}:${it.y}`));
    return occupied.has(`${nx}:${ny}`) ? findFreePosition(icons) : { x: nx, y: ny };
  };


  if (contextMenu.items) return contextMenu.items;

  if (contextMenu.targetId) {
    const targetIcon = icons.find((it) => it.id === contextMenu.targetId);
    const isRecycleBinIcon =
      contextMenu.targetId === "recycle" ||
      targetIcon?.type === "Recycle Bin" ||
      targetIcon?.label === "Recycle Bin";

    return [
      {
        key: "open",
        label: "Open",
        onClick: () => {
          const icon = icons.find((it) => it.id === contextMenu.targetId);
          // Use shared desktop routing so dynamic icons (like newly created folders)
          // can open the correct window + path.
          openDesktopIcon({
            icon,
            fallbackId: contextMenu.targetId,
            windowsConfig,
            openWindow,
            updateWindowPath,
          });
          closeContextMenu();
        },
      },
      ...(!isRecycleBinIcon
        ? [
            {
              key: "copy",
              label: "Copy",
              onClick: () => {
                const icon = icons.find((it) => it.id === contextMenu.targetId);
                if (!icon) {
                  closeContextMenu();
                  return;
                }

                const shouldCopyGroup = selectedIds.includes(icon.id) && selectedIds.length > 1;
                const idsToCopy = shouldCopyGroup ? selectedIds : [icon.id];

                // Desktop icons are backed by FileSystemContext content at "This PC > Desktop".
                copyItems?.({ fromPath: "This PC > Desktop", fromListKey: "content", itemKeys: idsToCopy });

                // Keep selection behavior the user already expects.
                setSelectedIds((prev) => (prev.includes(icon.id) ? prev : [...prev, icon.id]));
                closeContextMenu();
              },
            },
          ]
        : []),
      {
        key: "rename",
        label: "Rename",
        onClick: () => {
          const item = icons.find(
            (iconItem) => iconItem.id === contextMenu.targetId,
          );
          const name = prompt("Rename", item?.label || "");
          if (name) {
            setIcons((prev) =>
              prev.map((iconItem) =>
                iconItem.id === contextMenu.targetId
                  ? { ...iconItem, label: name }
                  : iconItem,
              ),
            );
          }
          closeContextMenu();
        },
      },
      ...(!isRecycleBinIcon
        ? [
            {
              key: "delete",
              label: "Delete",
              onClick: () => {
                const targetId = contextMenu.targetId;
                const shouldDeleteGroup =
                  selectedIds.includes(targetId) && selectedIds.length > 1;
                const idsToDelete = shouldDeleteGroup ? selectedIds : [targetId];
                if (!confirmDesktopDelete(idsToDelete.length)) {
                  closeContextMenu();
                  return;
                }

                idsToDelete.forEach((id) => moveDesktopIconToRecycleBin(id));
                setSelectedIds([]);
                closeContextMenu();
              },
            },
          ]
        : []),
      {
        key: "inspect",
        label: "Inspect element",
        onClick: () => {
          inspectElement(contextMenu.targetId);
          closeContextMenu();
        },
      },
      {
        key: "viewsource",
        label: "View page source",
        onClick: () => {
          viewPageSource();
          closeContextMenu();
        },
      },
      {
        key: "properties",
        label: "Properties",
        onClick: () => {
          alert(`Properties for ${contextMenu.targetId}`);
          closeContextMenu();
        },
      },
    ];
  }

  return [
    {
      key: "new",
      label: "New folder",
      onClick: () => {
        const pos = getNextPastePosition();

        if (typeof createFolder === "function") {
          createFolder("This PC > Desktop", "New folder", { position: pos });
        } else {
          // Fallback (should not happen): at least create a visible folder icon.
          const id = `folder-${Date.now()}`;
          setIcons((prev) => [
            {
              id,
              name: "New folder",
              label: "New folder",
              icon: "/icons/icons8-folder-94.png",
              type: "Folder",
              size: "—",
              isFolder: true,
              isOpenable: true,
              x: pos.x,
              y: pos.y,
              targetWindowId: "thispc",
              targetPath: "This PC > Desktop > New folder",
            },
            ...prev,
          ]);
        }
        closeContextMenu();
      },
    },
    {
      key: "paste",
      label: "Paste",
      onClick: () => {
        const canPaste = clipboard?.kind === "fs-items";
        if (!canPaste || typeof pasteItems !== "function") {
          closeContextMenu();
          return; // Prevent paste if nothing was copied
        }

        pasteItems({ toPath: "This PC > Desktop", position: getNextPastePosition() });
        closeContextMenu();
      },
    },
    {
      key: "refresh",
      label: "Refresh",
      onClick: () => {
        window.location.reload();
        closeContextMenu();
      },
    },
    {
      key: "viewsource",
      label: "View page source",
      onClick: () => {
        viewPageSource();
        closeContextMenu();
      },
    },
  ];
};
