import { openExternalUrl } from "./externalUrl";
import { getProjectById } from "../data/projectsData";
import { tryOpenImagePlayer, tryOpenProjectVirtualItem, tryOpenTargetWindowItem } from "./folderOpenUtils";

const buildNavigationHistory = (path) =>
  String(path || "")
    .split(" > ")
    .filter(Boolean)
    .map((_, idx, arr) => arr.slice(0, idx + 1).join(" > "));

export const openDesktopIcon = ({ icon, fallbackId, windowsConfig, openWindow, updateWindowPath }) => {
  if (!icon) return;

  // Allow desktop icons to open moved filesystem items, not just known window ids.
  // This keeps behavior consistent after dragging items between folders/Desktop.
  if (tryOpenTargetWindowItem({ item: icon, onOpenWindow: openWindow, updateWindowPath })) return;

  if (!icon?.isFolder) {
    const itemType = String(icon?.type || "").toLowerCase();
    if (itemType === "url" || icon?.url) {
      const url = icon?.url;
      if (url) {
        openExternalUrl(url, { preferNewTab: true });
        return;
      }
    }

    // Images: open ImagePlayer even when moved to Desktop.
    if (tryOpenImagePlayer({ item: icon, list: [icon], onOpenWindow: openWindow, updateWindowPath })) return;

    // Project virtual items (README/demo links/etc.) should open anywhere.
    const project = getProjectById(icon?.projectId);
    if (tryOpenProjectVirtualItem({ item: icon, project, onOpenWindow: openWindow, updateWindowPath })) return;
  }

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