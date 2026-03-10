export function buildProjectReadme(project) {
  if (!project) return "";
  const lines = [];
  lines.push(`# ${project.name || "Project"}`);
  if (project.tagline) lines.push(`\n> ${project.tagline}`);

  const explicitFeatures = Array.isArray(project.features)
    ? project.features
        .map((f) => String(f ?? "").trim())
        .filter(Boolean)
    : [];
  const hasExplicitFeatures = explicitFeatures.length > 0;
  const hasRole = typeof project.role === "string" && project.role.trim();

  if (hasRole) {
    lines.push(`\n**Role:** ${project.role.trim()}`);
  }

  const description = Array.isArray(project.description)
    ? project.description
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join("\n\n")
    : String(project.description || "").trim();
  if (description) {
      const markerMatch = !hasExplicitFeatures
        ? description.match(/(many\s+features\s+included[\s\S]*?:)/i)
        : null;

      if (markerMatch) {
      const markerIndex = markerMatch.index ?? -1;
      const markerText = markerMatch[0];
      const intro = description.slice(0, markerIndex).trim();
      const afterMarker = description.slice(markerIndex + markerText.length).trim();

      if (intro) lines.push(`\n${intro}`);
      lines.push("\n## Features\n");

      const rawItems = afterMarker
        .split(/\.|\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (rawItems.length) {
        lines.push(rawItems.map((it) => `- ${it.replace(/^[-•\s]+/, "")}`).join("\n"));
      } else {
        lines.push("- (No feature list provided)");
      }
    } else {
      lines.push(`\n${description}`);
    }
  }

  if (hasExplicitFeatures) {
    lines.push("\n## Features\n");
    lines.push(explicitFeatures.map((f) => `- ${f.replace(/^[-•\s]+/, "")}`).join("\n"));
  }

  if (Array.isArray(project.tech) && project.tech.length) {
    lines.push("\n## Tech\n");
    lines.push(project.tech.map((t) => `- ${t}`).join("\n"));
  }
  if (Array.isArray(project.highlights) && project.highlights.length) {
    lines.push("\n## Highlights\n");
    lines.push(project.highlights.map((h) => `- ${h}`).join("\n"));
  }

  const links = project.links || {};
  if (links.live || links.repo || links.link) {
    lines.push("\n## Links\n");
    if (links.live) lines.push(`- Live: ${links.live}`);
    if (links.repo) lines.push(`- Repo: ${links.repo}`);
    if (links.link) lines.push(`- Link: ${links.link}`);
  }

  return lines.join("\n");
}