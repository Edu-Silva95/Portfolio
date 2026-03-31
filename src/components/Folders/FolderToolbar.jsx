import { useEffect, useMemo, useRef, useState } from "react";

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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isCrumbMenuOpen, setIsCrumbMenuOpen] = useState(false);
  const crumbMenuRef = useRef(null);

  const currentSegment = pathSegments.length ? pathSegments[pathSegments.length - 1] : null;
  const parentSegments = useMemo(() => (pathSegments.length ? pathSegments.slice(0, -1) : []), [pathSegments]);
  const mobileFullPathText = useMemo(() => {
    if (pathSegments?.length) return pathSegments.map((s) => s.label).join(" > ");
    return typeof pathDisplay === "string" ? pathDisplay : "";
  }, [pathDisplay, pathSegments]);

  const mobileCurrentLabel = useMemo(() => {
    return currentSegment?.label ?? (typeof pathDisplay === "string" ? pathDisplay : "");
  }, [currentSegment, pathDisplay]);

  // Close the mobile breadcrumb menu when clicking outside / pressing Escape.
  useEffect(() => {
    if (!isCrumbMenuOpen) return;

    const onDocPointerDown = (event) => {
      const target = event.target;
      if (crumbMenuRef.current && crumbMenuRef.current.contains(target)) return;
      setIsCrumbMenuOpen(false);
    };

    const onEsc = (event) => {
      if (event.key === "Escape") setIsCrumbMenuOpen(false);
    };

    document.addEventListener("pointerdown", onDocPointerDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isCrumbMenuOpen]);

  return (
    <div className="pb-3 border-b border-white/10 mb-3">
      {/* Desktop (md+): original single-row toolbar */}
      <div className="hidden md:flex items-center gap-3 min-w-0">
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

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex-1 bg-white/5 rounded px-3 py-1.5 text-sm flex items-center gap-1 overflow-hidden min-w-0">
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
                    <img
                      src="/icons/right-arrow.png"
                      alt="Breadcrumb separator"
                      className="w-3 h-3 mt-1 opacity-70"
                      aria-hidden="true"
                    />
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
                <img src="/icons/ListView.png" alt="" className="w-4 h-4" />
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
                <img src="/icons/IconView.png" alt="" className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile (<md): breadcrumbs show full current path + dropdown for parents; search becomes a button */}
      <div className="md:hidden flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
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
          </div>

          {/* Breadcrumb path bar (same row). Smaller + dropdown behind the current path. */}
          <div ref={crumbMenuRef} className="relative flex-1 min-w-0">
            <div className="bg-white/5 rounded px-2 py-1 text-xs flex items-center gap-1 overflow-hidden min-w-0 text-white/90">
              <button
                type="button"
                disabled={!parentSegments.length}
                onClick={() => {
                  if (!parentSegments.length) return;
                  setIsCrumbMenuOpen((v) => !v);
                }}
                className={`shrink-0 mr-1 px-1.5 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10 transition text-white/90 disabled:opacity-50 disabled:cursor-not-allowed ${isCrumbMenuOpen ? "bg-white/20" : ""}`}
                aria-label="Breadcrumb menu"
                aria-expanded={isCrumbMenuOpen}
                title="Show path"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <span className="min-w-0 flex-1 truncate text-white/90" title={mobileFullPathText}>
                {mobileCurrentLabel}
              </span>
            </div>

            {isCrumbMenuOpen && parentSegments.length ? (
              <div className="absolute left-0 right-0 mt-1 bg-gray-900/95 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
                <div className="max-h-56 overflow-auto">
                  {parentSegments.map((seg) => (
                    <button
                      key={seg.path}
                      type="button"
                      onClick={() => {
                        setIsCrumbMenuOpen(false);
                        onNavigatePath?.(seg.path);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-white/90 hover:bg-white/10 transition"
                      title={seg.label}
                    >
                      {seg.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {typeof onSearchChange === "function" ? (
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen((v) => !v)}
                className={`px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 border border-white/10 transition ${isMobileSearchOpen ? "bg-white/20" : ""}`}
                aria-label="Search"
                aria-expanded={isMobileSearchOpen}
                title="Search"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}

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
                  <img src="/icons/ListView.png" alt="" className="w-4 h-4" />
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
                  <img src="/icons/IconView.png" alt="" className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {typeof onSearchChange === "function" && isMobileSearchOpen ? (
          <div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search"
              className="w-full bg-white/10 hover:bg-white/15 text-white placeholder-white/50 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
              autoFocus
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
