import React from "react";

export default function InspectorModal({ open, html = "", styles = {}, onClose = () => {} }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white text-black rounded-lg shadow-lg max-w-3xl w-[90%] max-h-[80%] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Inspector</h3>
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={onClose}>Close</button>
        </div>
        <div className="p-4">
          <h4 className="font-medium mb-2">Element HTML</h4>
          <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">{html}</pre>

          <h4 className="font-medium mt-4 mb-2">Computed Styles (sample)</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(styles).map(([k, v]) => (
              <div key={k} className="px-2 py-1 bg-gray-50 rounded">
                <strong className="mr-1">{k}:</strong>
                <span>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
