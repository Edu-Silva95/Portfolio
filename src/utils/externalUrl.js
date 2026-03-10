export function normalizeExternalUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";

  // Avoid executing arbitrary JS URLs.
  if (/^javascript:/i.test(value)) return "";

  // Allow data: URLs (used internally for simple text payloads).
  if (/^data:/i.test(value)) return value;

  // Full URL.
  if (/^https?:\/\//i.test(value)) return value;

  // Protocol-relative.
  if (/^\/\//.test(value)) return `https:${value}`;

  // Looks like a domain.
  if (/^[\w-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;

  // Otherwise treat as a Google search.
  return `https://www.google.com/search?igu=1&q=${encodeURIComponent(value)}`;
}

/*
 Attempt to open a URL in a new tab, if blocked, fall back to the in-app browser.(unpreferably)
 Returns true if it triggered an action, false otherwise.
 */
export function openExternalUrl(rawUrl, { onOpenInAppBrowser, preferNewTab = true } = {}) {
  const normalized = normalizeExternalUrl(rawUrl);
  if (!normalized) return false;

  if (preferNewTab) {
    const win = window.open(normalized, "_blank", "noopener,noreferrer");
    if (win) return true;
  }

  if (typeof onOpenInAppBrowser === "function") {
    onOpenInAppBrowser(normalized);
    return true;
  }

  return false;
}
