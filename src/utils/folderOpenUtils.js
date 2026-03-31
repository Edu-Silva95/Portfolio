// Utility functions for handling folder items and opening related windows/images.
import { buildProjectReadme } from "./projectsReadme";
import { openExternalUrl } from "./externalUrl";
import { parseYouTubeVideoId } from "./youtube";

  // Determines if a file name likely represents an image based on its extension.
export const isImageName = (name) => /\.(png|jpe?g|webp|gif)$/i.test(String(name || "").trim());
  // Checks if an item is an image file based on its properties or name.
export const isImageItem = (item) => {
  if (!item || item?.isFolder) return false;
  if (item?.isImage) return true;
  return (
    isImageName(item?.name) ||
    isImageName(item?.path) ||
    isImageName(item?.src) ||
    isImageName(item?.url)
  );
};
  // Retrieves the appropriate image source URL for an item, checking multiple properties.
export const getImageSrc = (item) => {
  if (!item) return "";
  if (typeof item.path === "string" && item.path.trim()) return item.path;
  if (typeof item.src === "string" && item.src.trim()) return item.src;
  if (typeof item.url === "string" && item.url.trim() && isImageName(item.url)) return item.url;
  if (isImageName(item?.name) && typeof item.icon === "string" && item.icon.trim() && isImageName(item.icon)) return item.icon;
  return "";
};
  // Retrieves a project configuration based on a folder path, matching the longest path first.
export function tryOpenImagePlayer({
  item,
  list,
  onOpenWindow,
  updateWindowPath,
}) {
  if (!isImageItem(item)) return false;
  if (typeof onOpenWindow !== "function" || typeof updateWindowPath !== "function") return false;

  const imageItems = (Array.isArray(list) ? list : []).filter(isImageItem);
  const imageSrcs = imageItems.map(getImageSrc).filter(Boolean);
  const clickedSrc = getImageSrc(item);

  if (!imageSrcs.length || !clickedSrc) return false;

  const startIndex = Math.max(0, imageSrcs.indexOf(clickedSrc));
  updateWindowPath("image", "", {
    title: String(item?.name || "Image"),
    images: imageSrcs,
    startIndex,
  });
  onOpenWindow("image");
  return true;
}
  // Attempts to open a project-related item (like README, demo links, or screenshots) in the correct window or for external URLs.
export function tryOpenProjectVirtualItem({
  item,
  project,
  onOpenWindow,
  updateWindowPath,
}) {
  if (!project || item?.isFolder) return false;

  const name = String(item?.name || "");
  const lower = name.toLowerCase();
  const itemType = String(item?.type || "").toLowerCase();

  const canOpenInApp = typeof onOpenWindow === "function" && typeof updateWindowPath === "function";

  const openNotes = (title, content) => {
    if (!canOpenInApp) return false;
    updateWindowPath("notes", "", { title, content: String(content ?? "") });
    onOpenWindow("notes");
    return true;
  };
  // Helper to open external URLs in a new tab, with a fallback to in-app notes if no URL is available.
  const openExternalTab = (url) => {
    if (!url) return false;
    openExternalUrl(url, { preferNewTab: true });
    return true;
  };

  if (itemType === "url" || item?.url) {
    const url =
      item?.url ||
      project.links?.live ||
      project.links?.link ||
      project.links?.repo;
    return url ? openExternalTab(url) : openNotes(name || "URL", "No URL configured for this project.");
  }

  if (lower === "readme.txt") {
    const content = buildProjectReadme(project);
    return openNotes(name || "README", content || "(README not available.)");
  }
  // Special handling for live demo links or video files, prioritizing YouTube demos if configured.
  const isLiveDemoVideoFile = /_live_demo\.mp4$/i.test(name.trim());
  if (lower === "live_demo_link.txt" || isLiveDemoVideoFile) {
    const candidate =
      project.demoYoutubeUrl ||
      project.demoYoutubeId ||
      project.links?.demo ||
      project.links?.youtube;
    const youtubeId = parseYouTubeVideoId(candidate);

    if (youtubeId && canOpenInApp) {
      updateWindowPath("youtube", String(candidate || youtubeId), {
        title: `${project.name || "Project"} Demo`,
        videoId: youtubeId,
      });
      onOpenWindow("youtube");
      return true;
    }

    // Back-compat: older project entries used links.live for the YouTube URL.
    const youtubeFromLive = parseYouTubeVideoId(project.links?.live);
    if (youtubeFromLive && canOpenInApp) {
      updateWindowPath("youtube", String(project.links?.live || youtubeFromLive), {
        title: `${project.name || "Project"} Demo`,
        videoId: youtubeFromLive,
      });
      onOpenWindow("youtube");
      return true;
    }

    const live = project.links?.live || project.links?.link;
    if (live) return openExternalTab(live);

    return openNotes(name || "Demo", "No YouTube demo configured for this project.");
  }

  if (isImageName(lower)) {
    const src = Array.isArray(project.screenshots) && project.screenshots.length ? project.screenshots[0] : "";
    return src ? openExternalTab(src) : openNotes(name, "No screenshot URL configured for this project.");
  }

  return false;
}
