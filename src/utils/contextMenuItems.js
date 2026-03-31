import { openDesktopIcon } from "./desktopIconRouting";

export const buildDesktopContextMenuItems = ({
  contextMenu,
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
  if (contextMenu.items) return contextMenu.items;

  if (contextMenu.targetId) {
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
        key: "rename",
        label: "Rename",
        onClick: () => {
          const item = icons.find((iconItem) => iconItem.id === contextMenu.targetId);
          const name = prompt("Rename", item?.label || "");
          if (name) {
            setIcons((prev) =>
              prev.map((iconItem) =>
                iconItem.id === contextMenu.targetId ? { ...iconItem, label: name } : iconItem
              )
            );
          }
          closeContextMenu();
        },
      },
      {
        key: "delete",
        label: "Delete",
        onClick: () => {
          if (contextMenu.targetId === "recycle") {
            alert("Recycle Bin cannot be deleted.");
            closeContextMenu();
            return;
          }

          const targetId = contextMenu.targetId;
          const shouldDeleteGroup = selectedIds.includes(targetId) && selectedIds.length > 1;
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
        const rect = document.documentElement.getBoundingClientRect();
        const localX = Math.max(0, contextMenu.x - rect.left);
        const localY = Math.max(0, contextMenu.y - rect.top);
        const col = Math.max(0, Math.round((localX - paddingX) / iconWidth));
        const row = Math.max(0, Math.round((localY - paddingY) / iconHeight));
        const nx = paddingX + col * iconWidth;
        const ny = paddingY + row * iconHeight;
        const occupied = new Set(icons.map((it) => `${it.x}:${it.y}`));
        const pos = occupied.has(`${nx}:${ny}`) ? findFreePosition(icons) : { x: nx, y: ny };

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
          if (!contextMenu.copiedItem) {
      closeContextMenu();
      return; // Prevent paste if nothing was copied
    }
        const id = `pasted-${Date.now()}`;
        const rect = document.documentElement.getBoundingClientRect();
        const localX = Math.max(0, contextMenu.x - rect.left);
        const localY = Math.max(0, contextMenu.y - rect.top);
        const col = Math.max(0, Math.round((localX - paddingX) / iconWidth));
        const row = Math.max(0, Math.round((localY - paddingY) / iconHeight));
        const nx = paddingX + col * iconWidth;
        const ny = paddingY + row * iconHeight;
        const occupied = new Set(icons.map((it) => `${it.x}:${it.y}`));
        const pos = occupied.has(`${nx}:${ny}`) ? findFreePosition(icons) : { x: nx, y: ny };
        setIcons((prev) => [{ id, label: "Pasted", icon: "/icons/icons8-folder-94.png", x: pos.x, y: pos.y }, ...prev]);
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