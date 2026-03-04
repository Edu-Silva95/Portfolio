import { useEffect, useRef } from "react";
import Window from "../folder_styles/FolderGeneral";

const DOOM_BUNDLE_URL = "https://v8.js-dos.com/bundles/doom.jsdos";

export default function DOSWindow({ onClose, onMinimize, closing = false }) {
  const containerRef = useRef(null);
  const dosRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        // Load js-dos runtime from local public folder (only once)
        if (!window.Dos) {
          if (!window.__jsDosLoading) {
            window.__jsDosLoading = new Promise((resolve, reject) => {
              const existing = document.getElementById("js-dos-runtime");
              if (existing) {
                existing.addEventListener("load", resolve, { once: true });
                existing.addEventListener(
                  "error",
                  () => reject(new Error("Failed to load js-dos library")),
                  { once: true }
                );
                return;
              }

              const script = document.createElement("script");
              script.id = "js-dos-runtime";
              script.src = "/js-dos/js-dos.js";
              script.onload = resolve;
              script.onerror = (err) => {
                console.error("[DOSWindow] Failed to load js-dos:", err);
                reject(new Error("Failed to load js-dos library"));
              };
              document.head.appendChild(script);
            });
          }

          await window.__jsDosLoading;
        }

        if (cancelled) return;

        // Create shadow-root container
        containerRef.current.innerHTML = "";
        const host = document.createElement("div");
        host.style.width = "100%";
        host.style.height = "100%";
        const shadow = host.attachShadow({ mode: "open" });

        const style = document.createElement("style");
        try {
          const cssText = await fetch("/js-dos/js-dos.css").then((res) => res.text());
          style.textContent = cssText;
        } catch (err) {
          console.warn("[DOSWindow] Failed to load js-dos CSS:", err);
        }

        const root = document.createElement("div");
        root.style.width = "100%";
        root.style.height = "100%";

        shadow.appendChild(style);
        shadow.appendChild(root);
        containerRef.current.appendChild(host);

        // Initialize DOS with volume option
        const dos = window.Dos(root, {
          pathPrefix: "/js-dos/",
          url: DOOM_BUNDLE_URL,
          autoStart: true,
          noCloud: true,
          volume: 1, // initial volume
        });
        dosRef.current = dos;

        // Unlock WebAudio on first user gesture
        const unlockAudio = async () => {
          try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) {
              const ctx = new AC();
              const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
              const src = ctx.createBufferSource();
              src.buffer = buffer;
              src.connect(ctx.destination);
              src.start(0);
              if (typeof ctx.resume === "function") await ctx.resume().catch(() => { });
            }
            dos.setVolume?.(1);
          } catch (err) {
            void err;
          }
        };
        // Wait for the Dos instance to be ready and attach to its canvas
        dos.ready?.then(() => {
          const canvas = root.querySelector("canvas");
          if (canvas) {
            canvas.addEventListener("pointerdown", unlockAudio, { once: true });
          } else {
            // fallback: attach to root if canvas not yet available
            root.addEventListener("pointerdown", unlockAudio, { once: true });
          }
        });
      } catch (err) {
        console.error("[DOSWindow] error:", err);
        if (containerRef.current && !cancelled) {
          containerRef.current.innerHTML = `
            <div style="color:#f55;padding:16px">
              Failed to load DOOM<br/>
              ${err?.message || err}
            </div>
          `;
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        dosRef.current?.stop?.();
      } catch (_err) {
        void _err;
      }
    };
  }, []);

  return (
    <Window title="DOOM" onClose={onClose} onMinimize={onMinimize} closing={closing} hideScrollbar>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#000",
          overflow: "hidden",
        }}
      />
    </Window>
  );
}
