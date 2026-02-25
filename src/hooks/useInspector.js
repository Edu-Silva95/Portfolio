import { useState } from "react";

// inspector/mouse right - click menu 
export default function useInspector() {
  const [inspector, setInspector] = useState({ open: false, html: "", styles: {} });

  const viewPageSource = () => {
    const w = window.open("", "_blank");
    if (!w) return alert("Popup blocked: allow popups to view source in a new tab.");
    const doc = w.document;
    const html = document.documentElement.outerHTML;
    const safe = html.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    doc.open();
    doc.write(`<html><head><title>Page Source</title><meta charset="utf-8" /><style>body{font-family:monospace;white-space:pre-wrap;padding:16px}</style></head><body><pre>${safe}</pre></body></html>`);
    doc.close();
  };

  const inspectElement = (targetId) => {
    if (!targetId) return;
    const el = document.querySelector(`[data-id="${targetId}"]`);
    if (!el) return alert("Element not found in DOM");
    const html = el.outerHTML;
    const cs = window.getComputedStyle(el);
    const keys = [
      "display",
      "position",
      "left",
      "top",
      "width",
      "height",
      "color",
      "background-color",
      "font-size",
      "padding",
      "margin",
      "border",
      "box-shadow",
    ];
    const styles = {};
    keys.forEach((k) => {
      styles[k] = cs.getPropertyValue(k);
    });
    setInspector({ open: true, html, styles });
  };

  const closeInspector = () => setInspector({ open: false, html: "", styles: {} });

  return { inspector, viewPageSource, inspectElement, closeInspector };
}
