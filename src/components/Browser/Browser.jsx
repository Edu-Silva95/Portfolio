import { useEffect, useMemo, useRef, useState } from "react";
import Window from "../folder_styles/FolderGeneral";

export default function ChromeWindow({ onClose, onMinimize, closing = false, initialUrl = null }) {
  const HOME = "https://www.google.com/webhp?igu=1";

  const normalizedInitialUrl = useMemo(() => {
    const value = String(initialUrl || "").trim();
    if (!value) return HOME;
    if (/^data:/i.test(value)) return value;
    if (/^https?:\/\//i.test(value)) return value;
    if (/^[\w-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;
    return `https://www.google.com/search?igu=1&q=${encodeURIComponent(value)}`;
  }, [initialUrl]);

  const [history, setHistory] = useState([normalizedInitialUrl]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState(normalizedInitialUrl);
  const [reloadTick, setReloadTick] = useState(0);

  const iframeRef = useRef(null);

  const currentUrl = history[index];

  useEffect(() => {
    // When the window is opened/retargeted (e.g., from ProjectView), reset to the provided initial URL.
    setHistory([normalizedInitialUrl]);
    setIndex(0);
    setReloadTick((tick) => tick + 1);
  }, [normalizedInitialUrl]);

  useEffect(() => {
    setInput(currentUrl);
  }, [currentUrl]);

  // Build Google search URL (IMPORTANT: igu=1 included)
  function buildSearchUrl(value) {
    const encoded = encodeURIComponent(value.trim());
    return `https://www.google.com/search?igu=1&q=${encoded}`;
  }

  // Detect URL vs search
  function normalizeInput(value) {
    const trimmed = value.trim();
    if (!trimmed) return "";

    // Full URL
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // Looks like a domain (google.com, youtube.pt, etc.)
    if (/^[\w-]+\.[a-z]{2,}/i.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // Otherwise treat as Google search
    return buildSearchUrl(trimmed);
  }

  function navigate(value) {
    const newUrl = normalizeInput(value);
    if (!newUrl) return;

    const newHistory = history.slice(0, index + 1);
    newHistory.push(newUrl);

    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  }

  function goBack() {
    if (index > 0) {
      setIndex(index - 1);
    }
  }

  function goForward() {
    if (index < history.length - 1) {
      setIndex(index + 1);
    }
  }

  function refresh() {
    setReloadTick((tick) => tick + 1);
  }

  const canGoBack = index > 0;
  const canGoForward = index < history.length - 1;

  return (
    <Window
      title={
        <span className="flex items-center gap-2">
          <img src="/icons/chrome.png" alt="" className="w-4 h-4" />
          <span>Google - Browser</span>
        </span>
      }
      onClose={onClose}
      onMinimize={onMinimize}
      closing={closing}
      contentClassName="p-0"
    >
      <div className="flex flex-col h-full bg-[#202124] text-white">

        {/* Top Bar */}
        <div className="flex items-center gap-2 pt-4 p-2 bg-[#303134]">
          <button onClick={goBack} disabled={!canGoBack} className="px-2 disabled:opacity-40 hover:bg-white/10 rounded">
            ◀
          </button>

          <button onClick={goForward} disabled={!canGoForward} className="px-2 disabled:opacity-40 hover:bg-white/10 rounded">
            ▶
          </button>

          <button onClick={() => navigate(HOME)} className="px-2 py-1 hover:bg-white/10 rounded">
            <img src="/icons/home.png" alt="" className="w-4 h-4" />
          </button>

          <button onClick={refresh} className="px-2 hover:bg-white/10 rounded-full">
            ⟳
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate(input);
              }
            }}
            className="flex-1 bg-[#202124] px-3 py-1 rounded-full outline-blue-400 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-500"
            aria-label="Address"
            inputMode="url"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {/* Bookmarks Bar */}
        <div className="flex items-center gap-2 px-2 py-1 bg-[#303134]">
          <button
            type="button"
            onClick={() => navigate("https://trex-runner.com/")}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10"
            aria-label="Open T-Rex Runner"
            title="Dino Game"
          >
            <img src="/icons/dino_icon.png" alt="" className="w-7 h-7" />
          </button>

          <button
            type="button"
            onClick={() => navigate("https://archive.org/")}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10"
            aria-label="Open Archive.org"
            title="Archive.org"
          >
            <img src="/icons/internet_archive.png" alt="Wayback Machine" className="w-7 h-7" />
          </button>

          <button
            type="button"
            onClick={() => navigate("https://www.wikipedia.org/")}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10"
            aria-label="Open Wikipedia"
            title="Wikipedia"
          >
            <img src="/icons/wikipedia.png" alt="Wikipedia" className="w-7 h-7" />
          </button>
        </div>

        {/* Browser View */}
        <div className="flex-1 bg-white">
          <iframe
            key={`${currentUrl}-${reloadTick}`}
            src={currentUrl}
            ref={iframeRef}
            title="Browser"
            sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"
            referrerPolicy="no-referrer"
            credentialless="true"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </Window>
  );
}