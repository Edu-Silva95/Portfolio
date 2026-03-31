import { useState, useRef } from "react";

export default function DesktopIcon({
  id,
  label,
  icon,
  x = 0,
  y = 0,
  onClick,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onMove,
  onDrop,
  selected = false,
  inline = false,
  isShortcut = false,
}) {
  const resolvedIcon = icon ?? `/icons/${id}.png`;
  const isImageIcon = typeof resolvedIcon === "string" && (resolvedIcon.includes("/") || resolvedIcon.includes(".") || resolvedIcon.startsWith("data:"));
  const [imgSrc, setImgSrc] = useState(() => (isImageIcon ? resolvedIcon : null));
  const elRef = useRef(null);
  const lastTapRef = useRef({ at: 0 }); // for double-tap detection on touch devices
  const dragState = useRef({
    isDown: false,
    dragging: false,
    justDragged: false,
    justLongPressed: false,
    longPressTimer: null,
    startClientX: 0,
    startClientY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const isCoarsePointer = () => {
    if (typeof window === "undefined") return false;
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const touchPoints = typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 0;
    return coarse || touchPoints;
  };

  const clearLongPressTimer = () => {
    if (dragState.current.longPressTimer) {
      window.clearTimeout(dragState.current.longPressTimer);
      dragState.current.longPressTimer = null;
    }
  };

  function handleImgError() {
    if (imgSrc && imgSrc !== "/icons/icons8-folder-94.png") {
      setImgSrc("/icons/icons8-folder-94.png");
      return;
    }
    setImgSrc(null);
  }

  function onPointerDown(e) {
    const rect = elRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left - x;
    const offsetY = e.clientY - rect.top - y;

    dragState.current.isDown = true;
    dragState.current.dragging = false;
    dragState.current.startClientX = e.clientX;
    dragState.current.startClientY = e.clientY;
    dragState.current.offsetX = offsetX;
    dragState.current.offsetY = offsetY;

    clearLongPressTimer();
    if (isCoarsePointer() && typeof onContextMenu === "function") {
      const startX = e.clientX;
      const startY = e.clientY;
      dragState.current.longPressTimer = window.setTimeout(() => {
        if (!dragState.current.isDown) return;
        if (dragState.current.dragging) return;
        dragState.current.justLongPressed = true;
        if (typeof onSelect === "function") onSelect();
        onContextMenu({
          clientX: startX,
          clientY: startY,
          preventDefault: () => { },
          stopPropagation: () => { },
        });
        window.setTimeout(() => {
          dragState.current.justLongPressed = false;
        }, 0);
      }, 1000);
    }
  }

  function onPointerMove(e) {
    if (!dragState.current.isDown) return;

    const rect = elRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;

    if (!dragState.current.dragging) {
      const dx0 = e.clientX - dragState.current.startClientX;
      const dy0 = e.clientY - dragState.current.startClientY;
      const dist = Math.hypot(dx0, dy0);
      if (dist < 6) return;

      clearLongPressTimer();

      dragState.current.dragging = true;
      dragState.current.justDragged = true;

      // prepare for GPU-accelerated smooth movement
      if (elRef.current) {
        elRef.current.style.willChange = "transform";
        elRef.current.style.transition = "none";
      }

      elRef.current?.setPointerCapture(e.pointerId);
      e.preventDefault();
    }

    const nx = Math.max(0, e.clientX - rect.left - dragState.current.offsetX);
    const ny = Math.max(0, e.clientY - rect.top - dragState.current.offsetY);

    if (typeof onMove === "function") onMove(nx, ny);

    // Move visually using transform to avoid layout thrash and parent re-renders.
    if (elRef.current) {
      const dx = nx - x;
      const dy = ny - y;
      elRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
    // onDrop will be responsible for snapping and updating parent state.
  }

  function onPointerUp(e) {
    if (!dragState.current.isDown) return;
    dragState.current.isDown = false;

    clearLongPressTimer();

    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    try {
      elRef.current?.releasePointerCapture(e.pointerId);
    } catch (_err) {
      void _err;
    }

    // clear visual transform and will-change to let React position the element
    if (elRef.current) {
      elRef.current.style.transform = "";
      elRef.current.style.willChange = "auto";
      elRef.current.style.transition = "";
    }

    const rect = elRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const nx = Math.max(0, Math.round(e.clientX - rect.left - dragState.current.offsetX));
    const ny = Math.max(0, Math.round(e.clientY - rect.top - dragState.current.offsetY));

    if (typeof onDrop === "function") onDrop(nx, ny);

    window.setTimeout(() => {
      dragState.current.justDragged = false;
    }, 0);
  }

  return (
    <div
      ref={elRef}
      data-selected={selected}
      className={`flex flex-col items-center cursor-pointer select-none ${inline ? "relative" : "absolute"} rounded-md p-2 w-20 active:opacity-75 transition-all duration-150 ${
        selected ? "bg-white/10 z-50" : "hover:bg-white/10"
      }`}
      onDoubleClick={() => {
        if (typeof onDoubleClick === "function") return onDoubleClick();
        if (typeof onClick === "function") return onClick();
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (dragState.current.justDragged) return;
        if (dragState.current.justLongPressed) return;
        if (typeof onSelect === "function") onSelect();

        if (inline) return;

        const openFn = typeof onDoubleClick === "function" ? onDoubleClick : onClick;
        if (typeof openFn !== "function") return;

        if (isCoarsePointer()) {
          const now = Date.now();
          const isDoubleTap = now - lastTapRef.current.at < 350;
          lastTapRef.current.at = now;
          if (isDoubleTap) openFn();
          return;
        }

        if (typeof onClick === "function") onClick();
      }}
      onContextMenu={(e) => {
        if (typeof onContextMenu === "function") onContextMenu(e);
      }}
      onPointerDown={!inline ? onPointerDown : undefined}
      onPointerMove={!inline ? onPointerMove : undefined}
      onPointerUp={!inline ? onPointerUp : undefined}
      role="button"
      tabIndex={0}
      {...(!inline ? { style: { left: x, top: y } } : {})}
      data-id={id}
    >
      <div className={`relative ${inline ? "w-14 h-14" : "w-12 h-12"} flex items-center ${inline ? "mt-2" : "mt-1"} justify-center`}>
        {imgSrc ? (
          <img
            src={imgSrc}
            className="w-full h-full object-contain"
            alt={label}
            onError={handleImgError}
          />
        ) : typeof resolvedIcon === "string" && resolvedIcon ? (
          <span className={inline ? "text-3xl" : "text-2xl"} aria-hidden="true">{resolvedIcon}</span>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className={inline ? "w-10 h-10 text-white/80" : "w-9 h-9 text-white/80"}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        )}
        {isShortcut ? (
          <img
            src="/icons/shortcut.png"
            alt=""
            className="absolute -left-1 -bottom-1 w-5 h-5"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <p className="text-white text-xs mt-1 text-center leading-tight break-words">
        {label}
      </p>
    </div>
  );
}
