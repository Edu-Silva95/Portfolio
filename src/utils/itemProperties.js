import { getProjectById } from "../data/projectsData";
import { calculateFolderSize, formatBytes } from "./folderSizes";

const normalizeText = (value, fallback = "—") => {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
};

const getItemName = (item) =>
  normalizeText(item?.label ?? item?.name ?? item?.title ?? item?.id ?? item?.targetId, "Item");

const getItemType = (item) => {
  if (item?.type) return normalizeText(item.type);
  if (item?.isFolder) return "File folder";
  if (item?.isOpenable) return "Shortcut";
  return "Item";
};

const getItemLocation = (item, currentPath) => {
  if (typeof currentPath === "string" && currentPath.trim()) return currentPath.trim();
  if (typeof item?.path === "string" && item.path.trim()) return item.path.trim();
  return "Unknown location";
};

const pushDetail = (details, label, value) => {
  const normalized = normalizeText(value, "—");
  if (normalized === "—") return;
  details.push({ label, value: normalized });
};

export const formatDateValue = (value) => {
  if (!value) return "Unknown";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function buildItemProperties({ item = null, currentPath = null, pathMap = null, project = null, title = null } = {}) {
  const resolvedProject = project || getProjectById(item?.projectId);
  const name = getItemName(item);
  const type = getItemType(item);
  const location = getItemLocation(item, currentPath);
  const details = [];
  const calculatedFolderSize =
    item?.isFolder && pathMap && typeof currentPath === "string"
      ? calculateFolderSize(`${currentPath} > ${name}`, pathMap)
      : 0;
  const sizeValue = calculatedFolderSize > 0 ? formatBytes(calculatedFolderSize) : item?.size;

  pushDetail(details, "Type", type);
  pushDetail(details, "Location", location);
  pushDetail(details, "Size", sizeValue);
  const createdValue = formatDateValue(item?.createdAt ?? item?.created ?? item?.dateCreated ?? item?.createdDate);
  details.push({
    label: "Created",
    value: createdValue,
  });
  details.push({
    label: "Modified",
    value: formatDateValue(item?.modifiedAt ?? item?.modified ?? item?.dateModified ?? item?.modifiedDate ?? createdValue),
  });
  details.push({
    label: "Accessed",
    value: formatDateValue(item?.accessedAt ?? item?.accessed ?? item?.dateAccessed ?? item?.accessedDate),
  });

  if (item?.isFolder && typeof item?.childCount === "number") {
    const suffix = item.childCount === 1 ? "item" : "items";
    pushDetail(details, "Contains", `${item.childCount} ${suffix}`);
  }

  if (item?.url) pushDetail(details, "Target", item.url);
  if (item?.targetWindowId) pushDetail(details, "Opens in", item.targetWindowId);
  if (item?.targetPath) pushDetail(details, "Target path", item.targetPath);
  if (resolvedProject?.name) pushDetail(details, "Project", resolvedProject.name);
  if (resolvedProject?.tagline) pushDetail(details, "Description", resolvedProject.tagline);
  if (resolvedProject?.links?.live) pushDetail(details, "Website", resolvedProject.links.live);
  if (resolvedProject?.links?.repo) pushDetail(details, "Repository", resolvedProject.links.repo);

  return {
    title: normalizeText(title ?? name, name),
    icon: item?.icon ?? item?.image ?? null,
    name,
    type,
    subtitle: location,
    details,
    raw: item,
  };
}
