export function parseYouTubeVideoId(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  // Bare video id
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  // Try parsing as URL
  let url;
  try {
    url = new URL(raw);
  } catch {

    try {
      url = new URL(`https://${raw}`);
    } catch {
      return null;
    }
  }

  const host = (url.hostname || "").toLowerCase();
  const pathname = url.pathname || "";

  // youtu.be/<id>
  if (host === "youtu.be") {
    const id = pathname.split("/").filter(Boolean)[0];
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  }

  const isYouTubeHost = host === "youtube.com" || host.endsWith(".youtube.com");
  if (!isYouTubeHost) return null;

  // youtube.com/watch?v=<id>
  const v = url.searchParams.get("v");
  if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

  // youtube.com/embed/<id>, /shorts/<id>, /live/<id>
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "live");
  if (idx !== -1) {
    const id = parts[idx + 1];
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  }

  return null;
}
