import { Rnd } from "react-rnd";
import { useState, useRef, useEffect } from "react";

export default function FolderGeneral({ title, children, onClose, onMinimize, hideScrollbar = false, minimized = false, closing = false, defaultWidth = 700, defaultHeight = 420, centered = false, dataWindowId, contentClassName = "p-4" }) {
  const titleBarHeight = 40;
  const [hasEntered, setHasEntered] = useState(false);
  
  // Calculate centered position if requested
  const getInitialPos = () => {
    if (!centered || typeof window === 'undefined') {
      return { x: 120, y: 120 };
    }
    const x = Math.max(0, (window.innerWidth - defaultWidth) / 2);
    const y = Math.max(0, (window.innerHeight - defaultHeight) / 2 - 50);
    return { x, y };
  };

  const [pos, setPos] = useState(getInitialPos());
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevRef = useRef({ pos: null, size: null });
  const [zIndex, setZIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      window.__appZIndex = (window.__appZIndex || 1000) + 1;
      return window.__appZIndex;
    }
    return 1000;
  });

  // Bring window to front by updating z-index
  function bringToFront() {
    if (typeof window !== 'undefined') {
      window.__appZIndex = (window.__appZIndex || 1000) + 1;
      setZIndex(window.__appZIndex);
    }
  }

  // Handle Escape key to close window (except for DOOM/DOS windows which should handle it themselves)
  useEffect(() => {
    function onKey(e) {
      // Don't interfere with DOOM/DOS windows - let it handle keyboard
      if (title === "DOOM" || title === "DOS") return;
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, title]);

// Trigger enter animation on mount
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setHasEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

 // Toggles maximize/restore window
  function handleMaximizeToggle() {
    if (!isMaximized) {
      prevRef.current = { pos, size };

      const taskbar = document.querySelector("#taskbar");
      const taskbarH = taskbar ? taskbar.getBoundingClientRect().height : 0;

      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight - taskbarH;

      setPos({ x: 0, y: 0 });
      setSize({ width: viewportW, height: viewportH });
      setIsMaximized(true);
    } else {
      const prev = prevRef.current;
      if (prev.pos) setPos(prev.pos);
      if (prev.size) setSize(prev.size);
      setIsMaximized(false);
    }
  }

  // Minimizes window
  function handleMinimize() {
    if (typeof onMinimize === "function") {
      onMinimize();
    }
  }
 // Closes window
  function handleClose() {
    onClose?.();
  }

  return (
    <Rnd
      data-window-id={dataWindowId}
      position={pos}
      size={{ width: size.width, height: minimized ? titleBarHeight : size.height }}
      onDragStart={() => bringToFront()}
      onDrag={(_, d) => setPos({ x: d.x, y: d.y })}
      onDragStop={(_, d) => setPos({ x: d.x, y: d.y })}
      onResizeStart={() => bringToFront()}
      onResizeStop={(_, __, ref, ___, deltaPos) => {
        const w = parseInt(ref.style.width || ref.offsetWidth, 10);
        const h = parseInt(ref.style.height || ref.offsetHeight, 10);
        setSize({ width: w, height: h });
        setPos(deltaPos);
      }}
      bounds="parent"
      dragHandleClassName="window-title"
      enableResizing={!isMaximized}
      disableDragging={isMaximized}
      style={{ zIndex }}
    >
      <div
        onMouseDown={bringToFront}
        className={`bg-gray-900 text-white w-full h-full overflow-hidden shadow-xl flex flex-col origin-center will-change-transform transition-all duration-230 ease-[cubic-bezier(0.16,1,0.3,1)] ${closing ? "translate-y-2 opacity-0 scale-95 pointer-events-none" : hasEntered ? "translate-y-0 opacity-100 scale-100" : "translate-y-3 opacity-0 scale-95"} ${isMaximized ? "rounded-none shadow-none" : "rounded-xl"}`}
      >
        <div
          className="window-title bg-gray-700 p-2 flex justify-between items-center cursor-move select-none flex-shrink-0"
          onDoubleClick={handleMaximizeToggle}
          style={{ height: titleBarHeight }}
        >
          <div className="flex items-center gap-3">
            <strong>{title}</strong>
          </div>

          <div className="flex items-center gap-1 -mr-2">
            <button
              onClick={handleMinimize}
              aria-label="Minimize"
              className="px-3 py-2 hover:bg-white/10 rounded transition"
            >
              —
            </button>

            <button
              onClick={handleMaximizeToggle}
              aria-label="Maximize"
              className="px-3 py-2 hover:bg-white/10 rounded transition"
            >
              {isMaximized ? "❐" : "▢"}
            </button>

            <button
              onClick={handleClose}
              aria-label="Close"
              className="px-3 py-2 hover:bg-red-600 rounded transition"
            >
              ✖
            </button>
          </div>
        </div>

        {<div className={`${contentClassName} flex-1 ${hideScrollbar ? "overflow-hidden" : "overflow-auto"}`} style={{ display: minimized ? "none" : "block" }}>{children}</div>}
      </div>
    </Rnd>
  );
}
