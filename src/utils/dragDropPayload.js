export const FS_ITEM_DND_MIME = "application/x-desktop-portfolio-fs-item";

const normalizeKeys = (itemKeys) => {
  const keys = Array.isArray(itemKeys) ? itemKeys : [itemKeys];
  return Array.from(new Set(keys.filter(Boolean)));
};

export function buildFsItemDndPayload({ fromPath, itemKeys } = {}) {
  const from = typeof fromPath === "string" ? fromPath.trim() : "";
  const keys = normalizeKeys(itemKeys);
  if (!from || keys.length === 0) return null;
  return { fromPath: from, itemKeys: keys };
}

export function setFsItemDndDataTransfer(dataTransfer, payload, { text = "" } = {}) {
  if (!dataTransfer) return false;
  const normalized = buildFsItemDndPayload(payload);
  if (!normalized) return false;

  try {
    dataTransfer.effectAllowed = "move";
  } catch {
    // ignore
  }

  try {
    dataTransfer.setData(FS_ITEM_DND_MIME, JSON.stringify(normalized));
    if (text) dataTransfer.setData("text/plain", String(text));
    return true;
  } catch {
    return false;
  }
}

export function readFsItemDndDataTransfer(dataTransfer) {
  if (!dataTransfer) return null;
  try {
    const raw = dataTransfer.getData(FS_ITEM_DND_MIME);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    return buildFsItemDndPayload(payload);
  } catch {
    return null;
  }
}
