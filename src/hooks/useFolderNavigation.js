import { useEffect, useRef, useState } from "react";

export default function useFolderNavigation({
  initialPath,
  savedPath = null,
  savedHistory = null,
  windowId = "",
  updateWindowPath = null,
}) {
  const seedPath = savedPath ?? initialPath;
  const seedHistory = savedHistory ?? [seedPath];

  const [currentPath, setCurrentPath] = useState(seedPath);
  const [navigationHistory, setNavigationHistory] = useState(seedHistory);
  const [historyIndex, setHistoryIndex] = useState(() => {
    const idx = seedHistory.lastIndexOf(seedPath);
    return idx >= 0 ? idx : seedHistory.length - 1;
  });

  // Restore full navigation state when component remounts with saved state
  useEffect(() => {
    if (savedPath !== null && savedPath !== currentPath) {
      setCurrentPath(savedPath);
      const idx = navigationHistory.lastIndexOf(savedPath);
      if (idx >= 0) setHistoryIndex(idx);
    }
  }, [savedPath]);

  useEffect(() => {
    if (savedHistory !== null && JSON.stringify(savedHistory) !== JSON.stringify(navigationHistory)) {
      setNavigationHistory(savedHistory);
      const idx = savedHistory.lastIndexOf(savedPath ?? savedHistory[savedHistory.length - 1]);
      if (idx >= 0) setHistoryIndex(idx);
    }
  }, [savedHistory]);

  const lastSyncedRef = useRef(null);

  // Sync navigation state to parent window state
  useEffect(() => {
    if (updateWindowPath && windowId) {
      const snapshot = JSON.stringify({ currentPath, navigationHistory });
      if (lastSyncedRef.current !== snapshot) {
        lastSyncedRef.current = snapshot;
        updateWindowPath(windowId, currentPath, navigationHistory);
      }
    }
  }, [currentPath, navigationHistory, updateWindowPath, windowId]);

  const pushPath = (newPath) => {
    setCurrentPath(newPath);
    setNavigationHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1).concat(newPath);
      return next;
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(navigationHistory[newIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPath(navigationHistory[newIndex]);
    }
  };

  return {
    currentPath,
    navigationHistory,
    setCurrentPath,
    setNavigationHistory,
    pushPath,
    handleBack,
    handleForward,
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < navigationHistory.length - 1,
  };
}
