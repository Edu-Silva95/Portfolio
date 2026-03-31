// Utilities for computing dynamic folder sizes from the virtual file system (pathMap).
const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

/**
 * Converts a size string like "4 MB" or "245 KB" into bytes.
 * - Accepts decimals ("1.2 MB")
 * - Ignores extra trailing text ("476 GB free of 512 GB" -> 476 GB)
 * - Returns 0 for invalid/empty/"—" values
 */
export function parseSizeToBytes(sizeStr) {
  if (typeof sizeStr !== "string") return 0;

  const raw = sizeStr.trim();
  if (!raw || raw === "—" || raw === "-" || raw.toLowerCase() === "n/a") return 0;

  // Match: number + optional space + unit
  // Examples: "4 MB", "4.40 GB", "245KB", "476 GB free of 512 GB"
  const match = raw.match(/(\d+(?:[.,]\d+)?)\s*(b|kb|mb|gb|tb|pb)\b/i);
  if (!match) return 0;

  const value = Number(String(match[1]).replace(",", "."));
  if (!Number.isFinite(value)) return 0;

  const unit = match[2].toUpperCase();
  const unitIndex = SIZE_UNITS.indexOf(unit);
  if (unitIndex < 0) return 0;

  return Math.round(value * 1024 ** unitIndex);
}

/**
 * Formats a byte count into a readable size like "4 MB".
 */
export function formatBytes(bytes) {
  const safe = typeof bytes === "number" && Number.isFinite(bytes) ? bytes : 0;
  if (safe <= 0) return "0 B";

  const unitIndex = Math.min(
    Math.floor(Math.log(safe) / Math.log(1024)),
    SIZE_UNITS.length - 1,
  );

  const value = safe / 1024 ** unitIndex;

  // Keep 0 decimals for B/KB and up to 2 decimals for larger units.
  const decimals = unitIndex <= 1 ? 0 : value < 10 ? 2 : value < 100 ? 1 : 0;
  const rounded = Number(value.toFixed(decimals));

  return `${rounded} ${SIZE_UNITS[unitIndex]}`;
}

/**
 * Recursively calculates the total size (in bytes) of a folder at a given path.
 *
 * The expected structure is a `pathMap` where each key is a path string and maps to:
 * - { content: Item[] } for folders
 * - optionally { folders: Item[], drives: Item[] } (like "This PC")
 *
 * If a subfolder key is missing in the map, fall back to that item's `size`.
 */
export function calculateFolderSize(path, pathMap, visited = new Set()) {
  if (!path || typeof path !== "string") return 0;
  if (!pathMap || typeof pathMap !== "object") return 0;
  if (visited.has(path)) return 0;

  const entry = pathMap[path];
  if (!entry || typeof entry !== "object") return 0;

  visited.add(path);

  const lists = [entry.content, entry.folders, entry.drives].filter(Array.isArray);
  let totalBytes = 0;

  for (const list of lists) {
    for (const item of list) {
      if (!item) continue;

      if (item.isFolder) {
        const childPath = `${path} > ${item.name}`;
        const childBytes = calculateFolderSize(childPath, pathMap, visited);

        // If the subfolder isn't defined in pathMap, keep compatibility by using whatever size string exists on the folder item.
        totalBytes += childBytes || parseSizeToBytes(item.size);
      } else {
        totalBytes += parseSizeToBytes(item.size);
      }
    }
  }

  visited.delete(path);
  return totalBytes;
}
