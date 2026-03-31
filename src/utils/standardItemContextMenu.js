export const buildStandardItemContextMenu = ({
  x,
  y,
  item,
  onOpen,
  onCreateShortcut,
  onRename,
  onDelete,
} = {}) => {
  return {
    x,
    y,
    targetId: null,
    items: [
      { key: "open", label: "Open", onClick: () => onOpen?.(item) },
      { key: "shortcut", label: "Create shortcut", onClick: () => onCreateShortcut?.(item) },
      { key: "rename", label: "Rename", onClick: () => onRename?.(item) },
      { key: "delete", label: "Delete", onClick: () => onDelete?.(item) },
    ],
  };
};
