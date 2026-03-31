const buildNavigationHistory = (path) =>
  String(path || "")
    .split(" > ")
    .filter(Boolean)
    .map((_, idx, arr) => arr.slice(0, idx + 1).join(" > "));

export const openDesktopIcon = ({ icon, fallbackId, windowsConfig, openWindow, updateWindowPath }) => {
  if (!icon) return;

  if (icon.targetWindowId) {
    if (!windowsConfig[icon.targetWindowId]) return;
    openWindow(icon.targetWindowId);
    if (icon.targetPath && typeof updateWindowPath === "function") {
      updateWindowPath(icon.targetWindowId, icon.targetPath, buildNavigationHistory(icon.targetPath));
    }
    return;
  }

  const targetId = icon.targetId || fallbackId;
  if (!windowsConfig[targetId]) return;
  openWindow(targetId);
};