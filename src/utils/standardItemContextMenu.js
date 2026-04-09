export const buildStandardItemContextMenu = ({
  x,
  y,
  item,
  onOpen,
  onCreateShortcut,
  onCopy,
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
      ...(typeof onCopy === "function" ? [{ key: "copy", label: "Copy", onClick: () => onCopy?.(item) }] : []),
      { key: "rename", label: "Rename", onClick: () => onRename?.(item) },
      { key: "delete", label: "Delete", onClick: () => onDelete?.(item) },
    ],
  };
};
