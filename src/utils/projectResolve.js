import { getProjectByFolderPath, getProjectById } from "../data/projectsData";
// Helper to get all items (files, folders, drives) from a file tree entry, ensuring we handle different possible structures.
const getEntryItems = (entry) => {
  const content = Array.isArray(entry?.content) ? entry.content : [];
  const folders = Array.isArray(entry?.folders) ? entry.folders : [];
  const drives = Array.isArray(entry?.drives) ? entry.drives : [];
  return [...content, ...folders, ...drives];
};

// Resolves a project based on the given global path by checking for direct matches and then walking up the path segments to find any folder entries linked to projects.
export function resolveProjectForPath({ fileTree, globalPath }) {
  const direct = getProjectByFolderPath(globalPath);
  if (direct) return direct;

  if (!fileTree || !globalPath) return null;

  const segments = String(globalPath)
    .split(" > ")
    .map((s) => s.trim())
    .filter(Boolean);

  // Walk from deepest to shallowest, checking the folder entry at each level.
  for (let idx = segments.length - 1; idx >= 1; idx -= 1) {
    const childName = segments[idx];
    const parentPath = segments.slice(0, idx).join(" > ");

    const entry = fileTree[parentPath];
    const items = getEntryItems(entry);

    const child = items.find(
      (it) =>
        it &&
        it.isFolder &&
        typeof it.name === "string" &&
        it.name === childName &&
        it.projectId,
    );
    // If this folder has a linked project, return it.
    if (child?.projectId) {
      const project = getProjectById(child.projectId);
      if (project) return project;
    }
  }

  return null;
}
