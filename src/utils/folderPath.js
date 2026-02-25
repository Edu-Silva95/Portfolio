export const formatPath = (
  currentPath,
  {
    prefixRoot = null,
    rootLabel = "This PC",
    rootIcon = "🖥️",
    segmentIcon = "📂",
    segmentIconMap = null,
  } = {},
) => {
  let parts = currentPath.split(" > ").filter(Boolean);

  if (prefixRoot && parts[0] !== prefixRoot.label) {
    parts = [prefixRoot.label, ...parts];
  }

  return parts
    .map((part, idx) => {
      if (idx === 0 && part === rootLabel) return `${rootIcon} ${rootLabel}`;
      const icon = segmentIconMap?.[part] ?? segmentIcon;
      if (typeof icon === "string" && icon.startsWith("/")) return part;
      return `${icon} ${part}`;
    })
    .join(" > ");
};

export const getWindowTitle = (
  currentPath,
  {
    rootLabel = "This PC",
    rootIcon = "🖥️",
    segmentIcon = "📂",
    segmentIconMap = null,
  } = {},
) => {
  const lastPart = currentPath.split(" > ").pop();
  if (lastPart === rootLabel) return `${rootIcon} ${rootLabel}`;
  const icon = segmentIconMap?.[lastPart] ?? segmentIcon;
  if (typeof icon === "string" && icon.startsWith("/")) return lastPart;
  return `${icon} ${lastPart}`;
};

export const buildPathSegments = (currentPath = "") =>
  currentPath
    .split(" > ")
    .filter(Boolean)
    .map((label, idx, arr) => ({
      label,
      path: arr.slice(0, idx + 1).join(" > "),
    }));
