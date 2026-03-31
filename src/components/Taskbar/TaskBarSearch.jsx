import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useNewsFeed from "../../hooks/useNewsFeed";
import { useFileSystem } from "../../context/FileSystemContext";
import { openExternalUrl } from "../../utils/externalUrl";
import { tryOpenImagePlayer, tryOpenProjectVirtualItem } from "../../utils/folderOpenUtils";
import { getProjectByFolderPath } from "../../data/projectsData";

export default function TaskBarSearch({
  onOpenWindow = () => { },
  onClearSelection = () => { },
  updateWindowPath = null,
}) {
  const { fileTree } = useFileSystem();

  // Search input and open/close animation state for the search panel.
  const [query, setQuery] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // Right-click context menu state for Search items (single action: Open).
  const [itemMenu, setItemMenu] = useState(null);

  // Element refs used to detect outside clicks and control close behavior.
  const inputRef = useRef(null);
  const mobileButtonRef = useRef(null);
  const panelRef = useRef(null);
  const itemMenuRef = useRef(null);
  const closeTimerRef = useRef(null);

  const { newsItems, isNewsLoading, error: newsError } = useNewsFeed({ enabled: isPanelOpen });

  // Static app shortcuts displayed in Recent / Suggested / Games.
  const sections = useMemo(() => ([
    {
      title: "Recent",
      items: [
        { label: "This PC", icon: "🖥️", windowId: "thispc" },
        { label: "Documents", icon: "/icons/icons8-folder-94.png", windowId: "documents" },
        { label: "Photos", icon: "/icons/icons8-folder-94.png", windowId: "photos" },
      ],
    },
    {
      title: "Suggested",
      items: [
        { label: "Curriculum_Vitae_2026.pdf", icon: "/icons/pdf-file-format.ico", windowId: "cv" },
        {
          label: "Projects",
          icon: "/icons/icons8-folder-94.png",
          windowId: "documents",
          targetPath: "Documents > Projects",
        },
        { label: "Browser", icon: "/icons/chrome.png", windowId: "browser" },
        { label: "MyNotes", icon: "/icons/notepad.ico", windowId: "notes" },
      ],
    },
    {
      title: "Games",
      items: [
        { label: "Games", icon: "/icons/icons8-folder-94.png", windowId: "games" },
        { label: "Dino Game", icon: "/icons/dino_icon.png", windowId: "dino" },
        { label: "DOOM", icon: "/icons/doom.png", windowId: "doom" },
      ],
    },
  ]), []);

  // Keep search query bounded to a small, safe size.
  const handleChange = (event) => {
    let next = event.target.value;

    if (next.length > 100) {
      next = next.slice(0, 100);
    }

    setQuery(next);
  };

  // Submit handler: tries exact shortcut matches first.
  const handleSearch = (event) => {
    event.preventDefault();

    const trimmed = query.trim();

    if (trimmed.length > 100) {
      console.log("Search input is too long. Please limit to 100 characters.");
      return;
    }

    if (trimmed === "") {
      console.log("Search input is empty. Showing all items.");
      return;
    }

    const allItems = sections.flatMap((section) => section.items);
    const exactMatch = allItems.find((item) => item.label.toLowerCase() === trimmed.toLowerCase());
    if (exactMatch?.windowId) {
      handleSelectItem(exactMatch);
      return;
    }

    console.log("Searching for:", trimmed);
  };

  // Filter section items by the current query text.
  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sections.map((section) => ({
      ...section,
      items: normalizedQuery
        ? section.items.filter((item) => item.label.toLowerCase().includes(normalizedQuery))
        : section.items,
    }));
  }, [query, sections]);

  const recentSection = filteredSections.find((s) => s.title === "Recent") ?? { title: "Recent", items: [] };
  const suggestedSection = filteredSections.find((s) => s.title === "Suggested") ?? { title: "Suggested", items: [] };
  const gamesSection = filteredSections.find((s) => s.title === "Games") ?? { title: "Games", items: [] };

  // Open panel with mount + visible split for smooth animation.
  const openSearchPanel = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsPanelOpen(true);
    setIsPanelMounted(true);
    window.requestAnimationFrame(() => setIsPanelVisible(true));
  };

  // Close panel with delayed unmount so exit animation can play.
  const closeSearchPanel = () => {
    setIsPanelOpen(false);
    setIsPanelVisible(false);
    setItemMenu(null);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setIsPanelMounted(false);
      closeTimerRef.current = null;
    }, 220);
  };

  // Global click/Escape handling while panel is mounted.
  useEffect(() => {
    if (!isPanelMounted) return;

    const onDocClick = (event) => {
      const target = event.target;
      if (itemMenu && itemMenuRef.current && !itemMenuRef.current.contains(target)) {
        setItemMenu(null);
      }
      if (panelRef.current && panelRef.current.contains(target)) return;
      if (inputRef.current && inputRef.current.contains(target)) return;
      if (mobileButtonRef.current && mobileButtonRef.current.contains(target)) return;
      if (itemMenuRef.current && itemMenuRef.current.contains(target)) return;
      closeSearchPanel();
    };

    const onEsc = (event) => {
      if (event.key === "Escape") closeSearchPanel();
    };

    document.addEventListener("pointerdown", onDocClick);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("pointerdown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isPanelMounted, itemMenu]);

  // Cleanup any pending close timers on unmount.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Opening search should clear desktop selection and expand panel.
  const handleFocus = () => {
    onClearSelection();
    openSearchPanel();
  };

  const handleMobileButtonClick = () => {
    if (isPanelOpen) {
      closeSearchPanel();
      return;
    }
    onClearSelection();
    openSearchPanel();
  };

  // Opens a window from Search and closes the panel.
  const buildHistoryFromPath = (path) => {
    const parts = String(path || "").split(" > ").filter(Boolean);
    return parts.map((_, idx) => parts.slice(0, idx + 1).join(" > "));
  };

  const openThisPcAtPath = (path) => {
    if (!path) return;
    onOpenWindow("thispc");
    if (typeof updateWindowPath === "function") {
      updateWindowPath("thispc", path, buildHistoryFromPath(path));
    }
    closeSearchPanel();
  };

  const openFileFromResult = (result) => {
    const item = result?.item || null;
    if (!item || item?.isFolder) return openThisPcAtPath(result?.parentPath);

    const itemType = String(item?.type || "").toLowerCase();

    // URL shortcut/file
    if (itemType === "url" || item?.url) {
      const url = String(item?.url || "").trim();
      if (url) {
        openExternalUrl(url, { preferNewTab: true });
        closeSearchPanel();
        return;
      }
    }

    // CV PDF special-case
    if (item?.name === "Curriculum_Vitae_2026.pdf") {
      onOpenWindow("cv");
      closeSearchPanel();
      return;
    }

    // Images: open ImagePlayer when possible.
    const parentEntry = fileTree?.[result?.parentPath] || {};
    const list = Array.isArray(parentEntry?.content) ? parentEntry.content : [];
    if (tryOpenImagePlayer({ item, list, onOpenWindow, updateWindowPath })) {
      closeSearchPanel();
      return;
    }

    // Project virtual items (README/demo links/etc.)
    const project = getProjectByFolderPath(result?.parentPath);
    if (tryOpenProjectVirtualItem({ item, project, onOpenWindow, updateWindowPath })) {
      closeSearchPanel();
      return;
    }

    // Fallback: open containing folder.
    return openThisPcAtPath(result?.parentPath);
  };

  const handleFileSystemResultClick = (result) => {
    if (result?.isFolder) return openThisPcAtPath(result.openPath);
    return openFileFromResult(result);
  };

  const handleSelectItem = (itemOrWindowId) => {
    const item = typeof itemOrWindowId === "object" && itemOrWindowId ? itemOrWindowId : null;
    const windowId = item ? (item.targetWindowId || item.windowId) : String(itemOrWindowId || "");
    if (!windowId) return;

    onOpenWindow(windowId);
    if (item?.targetPath && typeof updateWindowPath === "function") {
      updateWindowPath(windowId, item.targetPath, buildHistoryFromPath(item.targetPath));
    }
    closeSearchPanel();
  };

  // Right-click menu for Search items.
  const openItemContextMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setItemMenu({
      x: event.clientX,
      y: event.clientY,
      item,
    });
  };

  // Context-menu action for app shortcuts.
  const handleOpenFromContext = () => {
    if (!itemMenu?.item) return;
    handleSelectItem(itemMenu.item);
  };

  // Opens live news links in a new browser tab.
  const handleOpenNews = (item) => {
    if (!item?.url) return;
    if (!/^https?:\/\//i.test(item.url)) return;
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  // Shared icon renderer for both list and grid items.
  const renderItemIcon = (item, imageClassName, emojiClassName) => {
    if (item.icon.includes("/")) {
      return <img src={item.icon} alt={item.label} className={imageClassName} />;
    }
    return <span className={emojiClassName}>{item.icon}</span>;
  };

  // Recent list item renderer (left column).
  const renderRecentListItem = (item) => (
    <button
      key={item.label}
      onClick={() => handleSelectItem(item)}
      onContextMenu={(e) => openItemContextMenu(e, item)}
      className="w-full h-10 md:h-11 px-2 md:px-3 rounded-lg hover:bg-white/15 transition flex items-center gap-2 md:gap-3 text-xs md:text-sm text-white/90 text-left cursor-pointer md:ml-2"
    >
      {renderItemIcon(item, "w-4 h-4 md:w-5 md:h-5", "text-base md:text-lg leading-none")}
      <span className="truncate">{item.label}</span>
    </button>
  );

  // Suggested/Games tile renderer (right column).
  const renderGridItem = (item) => (
    <button
      key={item.label}
      onClick={() => handleSelectItem(item)}
      onContextMenu={(e) => openItemContextMenu(e, item)}
      className="h-16 md:h-20 hover:bg-white/15 bg-gray-700/30 rounded-xl border border-white/10 transition flex flex-col items-center justify-center gap-0.5 md:gap-1 text-[11px] md:text-xs text-white/90 cursor-pointer"
    >
      {renderItemIcon(item, "w-6 h-6 md:w-7 md:h-7", "text-xl md:text-2xl")}
      <span className="px-1 text-center leading-tight line-clamp-2 break-words max-w-full" title={item.label}>
        {item.label}
      </span>
    </button>
  );

  const fileSystemResults = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];

    const tree = fileTree && typeof fileTree === "object" ? fileTree : {};
    const results = [];
    const seen = new Set();

    const push = (result) => {
      const key = `${result.parentPath}::${result.name}::${result.isFolder ? "d" : "f"}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push(result);
    };

    for (const [parentPath, entry] of Object.entries(tree)) {
      if (!entry || typeof entry !== "object") continue;

      const lists = [entry.content, entry.folders, entry.drives].filter(Array.isArray);
      for (const list of lists) {
        for (const item of list) {
          if (!item?.name) continue;
          const name = String(item.name);
          if (!name.toLowerCase().includes(q)) continue;

          const isFolder = !!item.isFolder;
          const openPath = isFolder ? `${parentPath} > ${name}` : parentPath;

          push({
            name,
            icon: item.icon,
            isFolder,
            parentPath,
            openPath,
            type: item.type,
            item,
          });
        }
      }
    }

    // Prefer shorter names first, then alphabetical.
    results.sort((a, b) => (a.name.length - b.name.length) || a.name.localeCompare(b.name));

    return results.slice(0, 30);
  }, [fileTree, query]);

  const renderFileSystemResult = (result) => (
    <button
      key={`${result.parentPath}::${result.name}`}
      type="button"
      onClick={() => handleFileSystemResultClick(result)}
      className="w-full px-2 md:px-3 py-2 rounded-lg hover:bg-white/15 transition flex items-center gap-2 text-left cursor-pointer"
      title={result.openPath}
    >
      {renderItemIcon({ icon: result.icon || "/icons/icons8-folder-94.png", label: result.name }, "w-4 h-4 md:w-5 md:h-5", "text-base md:text-lg leading-none")}
      <div className="min-w-0 flex-1">
        <div className="text-xs md:text-sm text-white/90 truncate">{result.name}</div>
        <div className="text-[10px] text-white/50 truncate">{result.parentPath}</div>
      </div>
    </button>
  );

  return (
    <div className="relative">
      {/* Mobile (<md): show a search button same size as Start */}
      <button
        ref={mobileButtonRef}
        type="button"
        onClick={handleMobileButtonClick}
        aria-label="Search"
        aria-expanded={isPanelVisible}
        aria-controls="taskbar-search-panel"
        title="Search"
        className={`md:hidden flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl backdrop-blur-md text-white shadow transition ${isPanelMounted ? "bg-white/20 border-white/30" : ""}`}
      >
        <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="6" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
      </button>

      {/* Desktop (md+): full search input */}
      <form
        onSubmit={handleSearch}
        className={`hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-3 py-1.5 w-64 backdrop-blur-md transition ${isPanelMounted ? "bg-white/20 border-white/30" : ""}`}
      >
        <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="6" strokeWidth="1.5" />
          <path d="M21 21l-4.35-4.35" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onClick={handleFocus}
          placeholder="Type here to search"
          className="w-full bg-transparent text-xs text-white placeholder-white/70 outline-none"
          aria-expanded={isPanelVisible}
          aria-controls="taskbar-search-panel"
        />
      </form>

      {isPanelMounted && (
        <div
          id="taskbar-search-panel"
          ref={panelRef}
          className={`fixed bottom-14 left-2 w-[calc(100vw-1rem)] max-w-[500px] h-[60vh] overflow-hidden flex flex-col bg-gray-800 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-3 mb-0.5 transition-all duration-300 ease-out md:absolute md:bottom-14 md:left-0 md:w-[700px] md:max-w-none md:h-[610px] md:p-4 ${isPanelVisible ? "translate-y-0 opacity-100" : isPanelOpen ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-4 opacity-0 pointer-events-none"}`}
        >
          <div className="flex-1 overflow-auto md:overflow-hidden">
            {/* Two-column content: Recent + News (left), Suggested + Games (right). */}
            <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 md:gap-10">
              {/* Left column: Recent in list format */}
              <div className="order-1">
                {fileSystemResults.length > 0 ? (
                  <div className="hidden md:block mb-3 md:mb-4">
                    <h3 className="text-sm font-semibold text-white/90 mb-2 ml-1.5 md:ml-3 mt-2 md:mt-4">Results</h3>
                    <div className="space-y-1">
                      {fileSystemResults.map(renderFileSystemResult)}
                    </div>
                  </div>
                ) : null}

                <h3 className="text-sm font-semibold text-white/90 mb-2 md:mb-3 ml-1.5 md:ml-3 mt-2 md:mt-4">{recentSection.title}</h3>
                {recentSection.items.length > 0 ? (
                  <div className="space-y-1">
                    {recentSection.items.map(renderRecentListItem)}
                  </div>
                ) : (
                  <p className="text-white/60 text-xs">No matches in recent.</p>
                )}

                <div className="mt-3 md:mt-5 md:ml-2">
                  <h3 className="text-sm font-semibold text-white/90 mb-2 md:mb-3"><img src="icons/newspaper.svg" alt="news" className="w-5 h-5 md:w-6 md:h-6 inline mr-2" />News</h3>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-[420px] mx-auto md:max-w-none md:mx-0">
                    {newsItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleOpenNews(item)}
                        aria-label={`Open article: ${item.title}`}
                        className="rounded-xl border border-white/10 bg-gray-700/30 p-2 text-left hover:bg-white/10 transition transform hover:scale-[1.02] cursor-pointer"
                      >
                        <p className="text-[9px] md:text-[10px] uppercase tracking-wide text-white/60">{item.category}</p>
                        <p className="mt-1 text-[11px] md:text-xs text-white/90 leading-snug line-clamp-2 md:line-clamp-3">{item.title}</p>
                        <p className="mt-2 text-[9px] md:text-[10px] text-white/60 truncate">{item.source}</p>
                      </button>
                    ))}
                    {!isNewsLoading && newsItems.length === 0 ? (
                      <p className="text-white/60 text-xs">{newsError || "Unable to load live news right now."}</p>
                    ) : null}
                    {isNewsLoading ? (
                      <p className="text-white/60 text-xs">Loading live news...</p>
                    ) : null}
                  </div>
                  <p className="text-[9px] text-white/40 mt-2">News via Hacker News</p>
                </div>
              </div>

              {/* Right column: Suggested (top) + Games (bottom) */}
              <div className="order-2 space-y-4 md:space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white/90 mb-3 md:mb-4 mt-2 md:mt-4">{suggestedSection.title}</h3>
                  {suggestedSection.items.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-[420px] mx-auto md:max-w-none md:mx-0">
                      {suggestedSection.items.map(renderGridItem)}
                    </div>
                  ) : (
                    <p className="text-white/60 text-xs">No matches in suggested.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white/90 mb-3 md:mb-4 mt-2 md:mt-4"><img src="icons/game-controller.svg" alt="controller" className="w-5 h-5 md:w-6 md:h-6 inline mr-2" />{gamesSection.title}</h3>
                  {gamesSection.items.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-[420px] mx-auto md:max-w-none md:mx-0">
                      {gamesSection.items.map(renderGridItem)}
                    </div>
                  ) : (
                    <p className="text-white/60 text-xs">No matches in games.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-only: Results pinned near the bottom (so user doesn't need to scroll up) */}
          {String(query || "").trim() ? (
            <div className="md:hidden mt-3 pt-2 border-t border-white/10 shrink-0">
              <h3 className="text-sm font-semibold text-white/90 mb-2">Results</h3>
              {fileSystemResults.length > 0 ? (
                <div className="max-h-40 overflow-auto space-y-1 pr-1">
                  {fileSystemResults.map(renderFileSystemResult)}
                </div>
              ) : (
                <p className="text-white/60 text-xs">No results.</p>
              )}
            </div>
          ) : null}

          {/* Mobile-only: bottom search box inside the panel (always visible) */}
          <form
            onSubmit={handleSearch}
            className="md:hidden mt-3 pt-2 border-t border-white/10 flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl px-3 py-2 backdrop-blur-md transition"
          >
            <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="6" strokeWidth="1.5" />
              <path d="M21 21l-4.35-4.35" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={onClearSelection}
              placeholder="Search"
              className="w-full bg-transparent text-sm text-white placeholder-white/70 outline-none"
              aria-label="Search"
            />
          </form>
        </div>
      )}
      {itemMenu && createPortal(
        <div
          ref={itemMenuRef}
          className="fixed z-[10020] min-w-[140px] rounded-lg border border-white/20 bg-gray-900/95 backdrop-blur-xl p-1 shadow-2xl"
          style={{ left: itemMenu.x, top: itemMenu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={handleOpenFromContext}
            className="w-full text-left px-3 py-1.5 rounded-md text-sm text-white hover:bg-white/15"
          >
            Open
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}