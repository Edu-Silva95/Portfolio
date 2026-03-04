import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { windowIcons } from "../../config/desktopConfig";
import { useFileSystem } from "../../context/FileSystemContext";
import TaskBarSearch from "./TaskBarSearch";

const getDynamicIcon = (fileTree, id, win) => {
  let icon = windowIcons[id];

  if (!win?.currentPath) return icon;

  const pathParts = win.currentPath.split(" > ");
  const lastPart = pathParts[pathParts.length - 1];
  const parentPath = pathParts.slice(0, -1).join(" > ");

  // If current path exists in tree, try to pull icon from its parent list
  if (parentPath && fileTree && fileTree[parentPath]) {
    const parent = fileTree[parentPath];
    const content = parent.content || parent.folders || [];
    const found = content.find((item) => item.name === lastPart);
    if (found?.icon) icon = found.icon;
  }

  // Special-case root “This PC” and fallbacks
  if (id === "thispc" && win.currentPath === "This PC") icon = "🖥️";
  if (!icon) {
    if (lastPart === "Photos") icon = "/icons/icons8-folder-94.png";
    else if (lastPart === "Documents") icon = "/icons/icons8-folder-94.png";
    else if (lastPart === "Desktop") icon = "🖥️";
    else icon = "/icons/icons8-folder-94.png";
  }

  return icon;
};

function WindowPreview({ id, win, onCloseWindow, onHover, onLeave, anchorRect, fileTree }) {
  const [previewContent, setPreviewContent] = useState(null);
  const formatTitle = (value) => value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Get window title - use current path for folder windows, otherwise use stored title
  let windowTitle = win.title;
  let displayIcon = getDynamicIcon(fileTree, id, win);

  if (win.currentPath) {
    // For folder windows with saved navigation, show current folder name
    const pathParts = win.currentPath.split(" > ");
    windowTitle = pathParts[pathParts.length - 1]; // Get last part (current folder)

    // displayIcon already computed from current path
  }

  windowTitle = windowTitle || formatTitle(id);

  useEffect(() => {
    const windowEl = document.querySelector(`[data-window-id="${id}"]`);
    if (windowEl) {
      setPreviewContent(windowEl.cloneNode(true));
    }
  }, [id]);

  const preview = (
    <div
      className="fixed bg-gray-800/95 backdrop-blur-xl border border-white/20 
                    rounded-lg shadow-2xl overflow-hidden w-64 animate-in fade-in zoom-in-95 duration-150 z-[9999]"
      style={anchorRect ? {
        left: anchorRect.left + anchorRect.width / 2,
        top: anchorRect.top - 8,
        transform: "translate(-50%, -100%)",
      } : undefined}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Preview Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 border-b border-white/10">
        {displayIcon ? (
          displayIcon.includes("/") ? (
            <img src={displayIcon} alt={id} className="w-4 h-4" />
          ) : (
            <span className="text-base">{displayIcon}</span>
          )
        ) : (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />
          </svg>
        )}
        <span className="text-white text-xs font-medium truncate flex-1">{windowTitle}</span>
        <button
          onClick={() => onCloseWindow?.(id)}
          className="text-white/70 hover:text-white hover:bg-red-600 rounded px-1.5 py-0.5 text-xs"
          aria-label={`Close ${windowTitle}`}
        >
          ✖
        </button>
      </div>

      {/* Preview Content - Actual window scaled down */}
      <div className="bg-gray-900/50 h-36 overflow-hidden relative">
        {previewContent ? (
          <div
            className="absolute inset-0 origin-top-left pointer-events-none"
            style={{
              transform: 'scale(0.2)',
              width: '500%',
              height: '500%',
            }}
            ref={(node) => {
              if (node && previewContent) {
                node.innerHTML = '';
                node.appendChild(previewContent);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
            Loading...
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(preview, document.body);
}

export default function Taskbar({
  onClearSelection,
  openWindows = {},
  onToggleWindow = () => { },
  onOpenWindow = () => { },
  onCloseWindow = () => { },
  updateWindowPath = null,
}) {
  const { fileTree } = useFileSystem();
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [isStartMenuMounted, setIsStartMenuMounted] = useState(false);
  const [isStartMenuVisible, setIsStartMenuVisible] = useState(false);
  const [itemMenu, setItemMenu] = useState(null);
  const [now, setNow] = useState(new Date());
  const [hoveredWindow, setHoveredWindow] = useState(null);
  const [hoveredRect, setHoveredRect] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const startMenuTimerRef = useRef(null);
  const startBtnRef = useRef(null);
  const startMenuRef = useRef(null);
  const itemMenuRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const openStartMenu = () => {
    if (startMenuTimerRef.current) {
      window.clearTimeout(startMenuTimerRef.current);
      startMenuTimerRef.current = null;
    }
    setStartMenuOpen(true);
    setIsStartMenuMounted(true);
    window.requestAnimationFrame(() => setIsStartMenuVisible(true));
  };

  const closeStartMenu = () => {
    setStartMenuOpen(false);
    setIsStartMenuVisible(false);
    setItemMenu(null);
    if (startMenuTimerRef.current) window.clearTimeout(startMenuTimerRef.current);
    startMenuTimerRef.current = window.setTimeout(() => {
      setIsStartMenuMounted(false);
      startMenuTimerRef.current = null;
    }, 220);
  };

  function handleStartClick() {
    if (typeof onClearSelection === "function") onClearSelection();
    if (startMenuOpen) closeStartMenu();
    else openStartMenu();
  }

  // Close start menu when clicking outside
  useEffect(() => {
    if (!isStartMenuMounted) return;
    function onDocClick(e) {
      const target = e.target;
      if (itemMenu && itemMenuRef.current && !itemMenuRef.current.contains(target)) {
        setItemMenu(null);
      }
      if (startMenuRef.current && startMenuRef.current.contains(target)) return;
      if (startBtnRef.current && startBtnRef.current.contains(target)) return;
      if (itemMenuRef.current && itemMenuRef.current.contains(target)) return;
      closeStartMenu();
    }
    document.addEventListener("pointerdown", onDocClick);
    return () => document.removeEventListener("pointerdown", onDocClick);
  }, [isStartMenuMounted, itemMenu]);

  useEffect(() => {
    return () => {
      if (startMenuTimerRef.current) window.clearTimeout(startMenuTimerRef.current);
    };
  }, []);

  function handlePower() {
    window.location.reload();
  }

  const handleOpenFromMenu = () => {
    itemMenu?.onOpen?.();
    setItemMenu(null);
    closeStartMenu();
  };

  const openItemContextMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    if (!item?.action) return;
    setItemMenu({
      x: event.clientX,
      y: event.clientY,
      onOpen: item.action,
    });
  };

  const renderMenuIcon = (item, imageClassName, emojiClassName) => {
    if (item.icon.includes("/")) {
      return <img src={item.icon} alt={item.label} className={imageClassName} />;
    }
    return <span className={emojiClassName}>{item.icon}</span>;
  };

  const buildHistoryFromPath = (path) => {
    const parts = String(path || "").split(" > ").filter(Boolean);
    return parts.map((_, idx) => parts.slice(0, idx + 1).join(" > "));
  };

  const openWindowAtPath = (windowId, path) => {
    onOpenWindow(windowId);
    if (updateWindowPath && path) {
      updateWindowPath(windowId, path, buildHistoryFromPath(path));
    }
  };

  const openDocumentsFolder = (documentsPath) => openWindowAtPath("documents", documentsPath);

  const pinnedItems = [
    {
      label: "ShopListy",
      icon: "/icons/icons8-folder-94.png",
      action: () => openDocumentsFolder("Documents > Projects > Full-stack Projects > ShopListy"),
    },
    {
      label: "Chefie",
      icon: "/icons/icons8-folder-94.png",
      action: () => openDocumentsFolder("Documents > Projects > Full-stack Projects > Chefie"),
    },
    {
      label: "Foodie",
      icon: "/icons/icons8-folder-94.png",
      action: () => openDocumentsFolder("Documents > Projects > Full-stack Projects > Foodie"),
    },
    {
      label: "Super Simple List",
      icon: "/icons/icons8-folder-94.png",
      action: () => openDocumentsFolder("Documents > Projects > Full-stack Projects > Super Simple List"),
    },
    { label: "This PC", icon: "🖥️", action: () => onOpenWindow("thispc") },
    { label: "MyNotes", icon: "/icons/notepad.ico", action: () => onOpenWindow("notes") },
    { label: "Photos", icon: "/icons/icons8-folder-94.png", action: () => onOpenWindow("photos") },
    { label: "Games", icon: "/icons/icons8-folder-94.png", action: () => onOpenWindow("games") },
    { label: "Browser", icon: "/icons/chrome.png", action: () => onOpenWindow("browser") },
    { label: "Dino Game", icon: "/icons/dino_icon.png", action: () => onOpenWindow("dino") },
  ];

  const recommendedItems = [
    { label: "Documents", icon: "/icons/icons8-folder-94.png", action: () => onOpenWindow("documents") },
    { label: "Curriculum Vitae.pdf", icon: "/icons/pdf-file-format.ico", action: () => onOpenWindow("cv") },
    { label: "Projects", icon: "/icons/icons8-folder-94.png", action: () => onOpenWindow("projects") },
    { label: "About", icon: "/icons/icons8-folder-94.png", action: () => onOpenWindow("about") },
  ];
  
  return (
    <div
      id="taskbar"
      className={`fixed bottom-0 left-0 w-full bg-black/40 backdrop-blur-xl border-t border-white/10 p-2 flex items-center shadow-[0_-2px_10px_rgba(0,0,0,0.3)] z-[9999]`}
    >
      <div className="w-full flex items-center justify-between">

        {/* LEFT SIDE — Start Button + Search */}
        <div className="flex items-center gap-2">

          {/* Start Button */}
          <div className="relative">
            <button
              className="flex items-center justify-center w-9 h-9
                         bg-white/10 hover:bg-white/20
                         border border-white/20
                         rounded-xl backdrop-blur-md
                         text-white shadow transition"
              ref={startBtnRef}
              onClick={handleStartClick}
              aria-expanded={startMenuOpen}
              aria-controls="start-menu"
              title="Start"
            >
              <img src="/icons/EddOS.ico" alt="Start" className="w-25 h-18 mt-1" />
            </button>

            {/* START MENU */}
            {isStartMenuMounted && (
              <div
                id="start-menu"
                ref={startMenuRef}
                className={`absolute bottom-14 left-0 w-[520px] h-[800px] max-h-[80vh]
                           bg-gray-800 backdrop-blur-2xl
                           rounded-2xl border border-white/10
                           shadow-2xl p-6 text-white
                           flex flex-col mb-0.5 will-change-transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isStartMenuVisible ? "translate-y-0 opacity-100 scale-100" : startMenuOpen ? "translate-y-24 opacity-0 scale-[0.985] pointer-events-none" : "translate-y-4 opacity-0 scale-[0.98] pointer-events-none"}`}
              >
                {/* TOP CONTENT (Pinned + Recommended) */}
                <div className="flex-1 flex flex-col">

                  {/* PINNED */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Pinned</h3>
                    <div className="grid grid-cols-5 gap-1">
                      {pinnedItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            item.action?.();
                            closeStartMenu();
                          }}
                          onContextMenu={(e) => openItemContextMenu(e, item)}
                          className="h-18 hover:bg-white/20
                                     rounded-xl transition
                                     flex flex-col items-center justify-center gap-1 text-sm cursor-pointer"
                        >
                          {renderMenuIcon(item, "w-8 h-8", "text-3xl")}
                          <span className="text-[11px] text-white/90 text-center leading-tight px-0.5 line-clamp-2">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RECOMMENDED */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 mt-5">Recommended</h3>
                    <ul className="grid grid-cols-2 grid-rows-3 gap-2 text-sm">
                      {recommendedItems.map((item) => (
                        <li key={item.label}>
                          <button
                            onClick={() => {
                              item.action?.();
                              closeStartMenu();
                            }}
                            onContextMenu={(e) => openItemContextMenu(e, item)}
                            className="w-full hover:bg-white/10
                                       transition rounded-lg px-3 py-2 text-left cursor-pointer flex items-center gap-2"
                          >
                            {item.icon && renderMenuIcon(item, "w-6 h-6 mr-2", "text-3xl")}
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* BOTTOM BAR (User + Power + Folders) */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                      </svg>
                    </div>
                    <span className="text-sm">User</span>
                  </div>

                  {/* POWER BUTTON */}
                  <button
                    onClick={handlePower}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20
                               rounded-lg border border-white/10
                               flex items-center gap-2 transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                      <path d="M12 2v10" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M5 7a9 9 0 1 0 14 0" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <TaskBarSearch onOpenWindow={onOpenWindow} onClearSelection={onClearSelection} />
        </div>

        {/* RIGHT SIDE — Taskbar window buttons + Tray + Clock */}
        <div className="flex items-center gap-2 pr-2">

          {/* CENTER — Window icons (absolute-centered) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto z-20">
            {Object.entries(openWindows).map(([id, win]) =>
              win.open ? (
                <div
                  key={id}
                  className="relative"
                  onMouseEnter={(e) => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    setHoveredRect(e.currentTarget.getBoundingClientRect());
                    setHoveredWindow(id);
                  }}
                  onMouseLeave={() => {
                    hoverTimeoutRef.current = setTimeout(() => {
                      setHoveredWindow(null);
                      setHoveredRect(null);
                    }, 150);
                  }}
                >
                  <button
                    onClick={() => onToggleWindow(id)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${win.minimized
                        ? "bg-white/5 hover:bg-white/15 border-b-2 border-transparent hover:border-white/40"
                        : "bg-white/15 hover:bg-white/25 border-b-2 border-blue-400/60"
                      }`}
                  >
                    {(() => {
                      const icon = getDynamicIcon(fileTree, id, win);
                      return icon ? (
                        icon.includes("/") ? (
                          <img src={icon} alt={id} className="w-6 h-6" />
                        ) : (
                          <span className="text-2xl leading-none">{icon}</span>
                        )
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />
                        </svg>
                      );
                    })()}
                  </button>

                  {/* Window Preview Tooltip */}
                  {hoveredWindow === id && (
                    <WindowPreview
                      id={id}
                      win={win}
                      onCloseWindow={onCloseWindow}
                      onHover={() => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        setHoveredWindow(id);
                      }}
                      onLeave={() => {
                        hoverTimeoutRef.current = setTimeout(() => {
                          setHoveredWindow(null);
                          setHoveredRect(null);
                        }, 150);
                      }}
                      anchorRect={hoveredRect}
                    />
                  )}
                </div>
              ) : null
            )}
          </div>

          {/* Language */}
          <button className="px-1.5 py-1 rounded hover:bg-white/10 transition text-white">
            <p className="text-xs">ENG</p>
          </button>

          {/* WIFI */}
          <button className="px-1.5 py-1 rounded hover:bg-white/10 transition text-white">
            <img src="/icons/wifi-signal.ico" alt="WiFi" className="w-3.5 h-3.5" />
          </button>

          {/* VOLUME */}
          <button className="px-1.5 py-1 rounded hover:bg-white/10 transition text-white">
            <img src="/icons/high-volume.ico" alt="Volume" className="w-3.5 h-3.5" />
          </button>

          {/* CLOCK */}
          <div className="text-white text-xs text-right leading-tight">
            <div>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            <div className="text-[13px] text-white/80">{now.toLocaleDateString()}</div>
          </div>
        </div>
      </div>
      {itemMenu && createPortal(
        <div
          ref={itemMenuRef}
          className="fixed z-[10020] min-w-[140px] rounded-lg border border-white/20 bg-gray-900/95 backdrop-blur-xl p-1 shadow-2xl"
          style={{ left: itemMenu.x, top: itemMenu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={handleOpenFromMenu}
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
