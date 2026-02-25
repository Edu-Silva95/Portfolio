export const openDesktopIcon = ({ icon, fallbackId, windowsConfig, openWindow, updateWindowPath }) => {
  if (!icon) return;

  if (icon.targetWindowId) {
    if (!windowsConfig[icon.targetWindowId]) return;
    openWindow(icon.targetWindowId);
    if (icon.targetPath) {
      updateWindowPath(icon.targetWindowId, icon.targetPath, [icon.targetPath]);
    }
    return;
  }

  const targetId = icon.targetId || fallbackId;
  if (!windowsConfig[targetId]) return;
  openWindow(targetId);
};