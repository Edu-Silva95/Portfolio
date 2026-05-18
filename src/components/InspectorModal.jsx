import React, { useEffect, useState } from "react";
import { Rnd } from "react-rnd";

const formatFieldValue = (value) => {
  if (value == null) return "—";
  const text = String(value).trim();
  return text ? text : "—";
};

export default function InspectorModal({ open, mode = "inspect", html = "", styles = {}, properties = null, onClose = () => {} }) {
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 420, height: 500 });
  const [zIndex, setZIndex] = useState(() => {
    if (typeof window !== "undefined") {
      window.__appZIndex = (window.__appZIndex || 1000) + 1;
      return window.__appZIndex;
    }
    return 1000;
  });

  const bringToFront = () => {
    if (typeof window !== "undefined") {
      window.__appZIndex = (window.__appZIndex || 1000) + 1;
      setZIndex(window.__appZIndex);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      bringToFront();
    }
  }, [open]);

  if (!open) return null;

  if (mode === "properties" && properties) {
    const details = Array.isArray(properties.details) ? properties.details : [];
    const icon = typeof properties.icon === "string" ? properties.icon : null;

    return (
      <Rnd
        position={pos}
        size={size}
        onDragStart={bringToFront}
        onDrag={(_, d) => setPos({ x: d.x, y: d.y })}
        onDragStop={(_, d) => setPos({ x: d.x, y: d.y })}
        onResizeStart={bringToFront}
        onResizeStop={(_, __, ref, ___, deltaPos) => {
          const w = parseInt(ref.style.width || ref.offsetWidth, 10);
          const h = parseInt(ref.style.height || ref.offsetHeight, 10);
          setSize({ width: Math.max(320, w), height: Math.max(200, h) });
          setPos(deltaPos);
        }}
        bounds="parent"
        dragHandleClassName="inspector-title"
        cancel=".inspector-controls, .inspector-controls *"
        style={{ zIndex }}
      >
        <div className="w-full h-full rounded-[20px] border border-black/10 bg-[#f5f5f7] text-[#111827] shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden" onPointerDown={bringToFront}>
          <div
            className="inspector-title bg-white/70 backdrop-blur px-4 py-3 flex items-center justify-between border-b border-black/10 cursor-move select-none shrink-0"
            onDoubleClick={onClose}
          >
            <div>
              <h3 className="text-base font-semibold tracking-tight">Properties</h3>
              <p className="text-xs text-black/55">General</p>
            </div>
            <button
              className="inspector-controls flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-black/60 transition hover:bg-black/5 hover:text-black"
              onClick={onClose}
              aria-label="Close properties"
            >
              ✖
            </button>
          </div>

          <div className="flex-1 overflow-auto space-y-4 px-4 py-4">
            <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eef2ff] text-2xl shadow-inner">
                {icon ? <img src={icon} alt="" className="h-10 w-10 object-contain" /> : <span>{properties.name?.[0] || "?"}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-lg font-semibold tracking-tight">{formatFieldValue(properties.title || properties.name)}</h4>
                <p className="mt-0.5 text-sm text-black/55">{formatFieldValue(properties.subtitle)}</p>
              </div>
            </div>

            <div className="grid gap-2 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5">
              {details.map((field) => (
                <div key={field.label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 text-sm">
                  <span className="text-black/45">{field.label}</span>
                  <span className="min-w-0 break-words text-black/90">{formatFieldValue(field.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Rnd>
    );
  }

  return (
    <Rnd
      position={pos}
      size={size}
      onDragStart={bringToFront}
      onDrag={(_, d) => setPos({ x: d.x, y: d.y })}
      onDragStop={(_, d) => setPos({ x: d.x, y: d.y })}
      onResizeStart={bringToFront}
      onResizeStop={(_, __, ref, ___, deltaPos) => {
        const w = parseInt(ref.style.width || ref.offsetWidth, 10);
        const h = parseInt(ref.style.height || ref.offsetHeight, 10);
        setSize({ width: Math.max(400, w), height: Math.max(300, h) });
        setPos(deltaPos);
      }}
      bounds="parent"
      dragHandleClassName="inspector-title"
      cancel=".inspector-controls, .inspector-controls *"
      style={{ zIndex }}
    >
      <div className="w-full h-full rounded-lg bg-white text-black shadow-lg flex flex-col overflow-hidden border border-gray-200" onPointerDown={bringToFront}>
        <div
          className="inspector-title bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between cursor-move select-none shrink-0"
          onDoubleClick={onClose}
        >
          <h3 className="text-lg font-semibold">Inspector</h3>
          <button
            className="inspector-controls px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
            onClick={onClose}
            aria-label="Close inspector"
          >
            ✖
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <h4 className="mb-2 font-medium">Element HTML</h4>
          <pre className="overflow-auto rounded bg-gray-100 p-3 text-xs mb-4">{html}</pre>

          <h4 className="mb-2 font-medium">Computed Styles (sample)</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(styles).map(([k, v]) => (
              <div key={k} className="rounded bg-gray-50 px-2 py-1">
                <strong className="mr-1">{k}:</strong>
                <span>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Rnd>
  );
}
