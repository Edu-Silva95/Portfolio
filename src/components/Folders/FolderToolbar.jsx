export default function FolderToolbar({
  onBack,
  canGoBack,
  pathDisplay,
  onForward,
  canGoForward = false,
  pathSegments = [],
  onNavigatePath,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Back"
        title="Back"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <path d="M15.5 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={onForward}
        disabled={!canGoForward}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Forward"
        title="Forward"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <path d="M8.5 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 bg-white/5 rounded px-3 py-1.5 text-sm flex items-center gap-1 overflow-hidden">
          {pathSegments.length ? (
            pathSegments.map((seg, idx) => (
              <div key={seg.path} className="flex items-center gap-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onNavigatePath?.(seg.path)}
                  className="truncate hover:underline text-white/90"
                >
                  {seg.label}
                </button>
                {idx < pathSegments.length - 1 && (
                  <span className="text-white/40">›</span>
                )}
              </div>
            ))
          ) : (
            <span className="truncate text-white/90">{pathDisplay}</span>
          )}
        </div>

        {typeof onSearchChange === "function" && (
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search"
              className="bg-white/10 hover:bg-white/15 text-white placeholder-white/50 border border-white/10 rounded px-3 py-1.5 text-sm w-52 focus:outline-none"
            />
          </div>
        )}

        {typeof onViewModeChange === "function" && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`px-2.5 py-1.5 rounded text-sm transition ${
                viewMode === "list" ? "bg-white/20" : "bg-white/10 hover:bg-white/20"
              }`}
              aria-pressed={viewMode === "list"}
              title="List view"
            >
              ☰
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("icons")}
              className={`px-2.5 py-1.5 rounded text-sm transition ${
                viewMode === "icons" ? "bg-white/20" : "bg-white/10 hover:bg-white/20"
              }`}
              aria-pressed={viewMode === "icons"}
              title="Icon view"
            >
              ⊞
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
