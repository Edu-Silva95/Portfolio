import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useNewsFeed from "../../hooks/useNewsFeed";

export default function TaskBarSearch({ onOpenWindow = () => { }, onClearSelection = () => { } }) {
  // Search input and open/close animation state for the search panel.
  const [query, setQuery] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // Right-click context menu state for Search items (single action: Open).
  const [itemMenu, setItemMenu] = useState(null);

  // Element refs used to detect outside clicks and control close behavior.
  const inputRef = useRef(null);
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
        { label: "Curriculum Vitae.pdf", icon: "/icons/pdf-file-format.ico", windowId: "cv" },
        { label: "Projects", icon: "/icons/icons8-folder-94.png", windowId: "projects" },
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
      onOpenWindow(exactMatch.windowId);
      closeSearchPanel();
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

  // Opens a window from Search and closes the panel.
  const handleSelectItem = (windowId) => {
    onOpenWindow(windowId);
    closeSearchPanel();
  };

  // Right-click menu for Search items.
  const openItemContextMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setItemMenu({
      x: event.clientX,
      y: event.clientY,
      windowId: item.windowId,
    });
  };

  // Context-menu action for app shortcuts.
  const handleOpenFromContext = () => {
    if (!itemMenu?.windowId) return;
    handleSelectItem(itemMenu.windowId);
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
      onClick={() => handleSelectItem(item.windowId)}
      onContextMenu={(e) => openItemContextMenu(e, item)}
      className="w-full h-11 px-3 rounded-lg hover:bg-white/15 transition flex items-center gap-3 text-sm text-white/90 text-left cursor-pointer ml-2"
    >
      {renderItemIcon(item, "w-5 h-5", "text-lg leading-none")}
      <span className="truncate">{item.label}</span>
    </button>
  );

  // Suggested/Games tile renderer (right column).
  const renderGridItem = (item) => (
    <button
      key={item.label}
      onClick={() => handleSelectItem(item.windowId)}
      onContextMenu={(e) => openItemContextMenu(e, item)}
      className="h-20 hover:bg-white/15 bg-gray-700/30 rounded-xl border border-white/10 transition flex flex-col items-center justify-center gap-1 text-xs text-white/90 cursor-pointer"
    >
      {renderItemIcon(item, "w-7 h-7", "text-2xl")}
      <span className="px-1 text-center leading-tight line-clamp-2">{item.label}</span>
    </button>
  );

  return (
    <div className="relative hidden md:block">
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-3 py-1.5 w-64 backdrop-blur-md transition"
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
          className={`absolute bottom-14 left-0 w-[700px] h-[800px] max-h-[80vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-gray-800 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 mb-0.5 transition-all duration-300 ease-out ${isPanelVisible ? "translate-y-0 opacity-100" : isPanelOpen ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-4 opacity-0 pointer-events-none"}`}
        >
          {/* Two-column content: Recent + News (left), Suggested + Games (right). */}
          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-10">
            {/* Left column: Recent in list format */}
            <div className="order-1">
              <h3 className="text-sm font-semibold text-white/90 mb-3 ml-3 mt-4">{recentSection.title}</h3>
              {recentSection.items.length > 0 ? (
                <div className="space-y-1">
                  {recentSection.items.map(renderRecentListItem)}
                </div>
              ) : (
                <p className="text-white/60 text-xs">No matches in recent.</p>
              )}

              <div className="mt-5 ml-2">
                <h3 className="text-sm font-semibold text-white/90 mb-3"><img src="icons/newspaper.svg" alt="news" className="w-6 h-6 inline mr-2" />News</h3>
                <div className="grid grid-cols-1 gap-2">
                  {newsItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOpenNews(item)}
                      aria-label={`Open article: ${item.title}`}
                      className="rounded-xl border border-white/10 bg-gray-700/30 p-2 text-left hover:bg-white/10 transition transform hover:scale-[1.02] cursor-pointer"
                    >
                      <p className="text-[10px] uppercase tracking-wide text-white/60">{item.category}</p>
                      <p className="mt-1 text-xs text-white/90 leading-snug line-clamp-3">{item.title}</p>
                      <p className="mt-2 text-[10px] text-white/60 truncate">{item.source}</p>
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
            <div className="order-2 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-4 mt-4">{suggestedSection.title}</h3>
                {suggestedSection.items.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {suggestedSection.items.map(renderGridItem)}
                  </div>
                ) : (
                  <p className="text-white/60 text-xs">No matches in suggested.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-4 mt-4"><img src="icons/game-controller.svg" alt="controller" className="w-6 h-6 inline mr-2" />{gamesSection.title}</h3>
                {gamesSection.items.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {gamesSection.items.map(renderGridItem)}
                  </div>
                ) : (
                  <p className="text-white/60 text-xs">No matches in games.</p>
                )}
              </div>
            </div>
          </div>
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