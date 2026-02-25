import { useEffect, useRef, useState } from "react";

export default function ContextMenu({ items = [], x = 0, y = 0, open = false, onClose = () => {} }) {
  const ref = useRef(null);
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    ref.current?.focus();

    function onKey(e) {
      if (e.key === "Escape") return onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, items.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const it = items[focusIndex];
        if (it && typeof it.onClick === "function") it.onClick();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, focusIndex, onClose]);

  // Close on any outside pointer (left click) or touch
  useEffect(() => {
    if (!open) return;
    function onDocPointer(e) {
      const target = e.target;
      if (ref.current && ref.current.contains(target)) return;
      onClose();
    }
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open, onClose]);

  if (!open) return null;

  // clamp to viewport
  const width = 220;
  const height = items.length * 36 + 8;
  const clampedX = Math.min(Math.max(8, x), Math.max(8, window.innerWidth - width - 8));
  const clampedY = Math.min(Math.max(8, y), Math.max(8, window.innerHeight - height - 8));

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="fixed"
      style={{ left: clampedX, top: clampedY, zIndex: 10000 }}
      role="menu"
      aria-hidden={!open}
    >
      <div className="bg-gray-800 text-white rounded shadow-lg py-1 w-[220px] ring-1 ring-black/30">
        {items.map((it, idx) => (
          <button
            key={it.key || idx}
            className={`w-full text-left px-3 py-2 text-sm transition ${
              idx === focusIndex ? "bg-white/10" : "hover:bg-white/5"
            }`}
            onClick={() => {
              it.onClick?.();
              onClose();
            }}
            onMouseEnter={() => setFocusIndex(idx)}
            role="menuitem"
          >
            {it.icon && <span className="mr-2 inline-block align-middle">{it.icon}</span>}
            <span className="align-middle">{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
