import { useEffect, useRef, useState } from "react";

export default function useWindowsState(windowIds = []) {
  const [openWindows, setOpenWindows] = useState(
    Object.fromEntries(windowIds.map((id) => [id, { open: false, minimized: false }]))
  );
  const closeTimersRef = useRef({});
  const minimizeTimersRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(closeTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
      Object.values(minimizeTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const clearMinimizeTimer = (id) => {
    if (!minimizeTimersRef.current[id]) return;
    window.clearTimeout(minimizeTimersRef.current[id]);
    delete minimizeTimersRef.current[id];
  };

  const openWindow = (id) => {
    if (closeTimersRef.current[id]) {
      window.clearTimeout(closeTimersRef.current[id]);
      delete closeTimersRef.current[id];
    }
    clearMinimizeTimer(id);
    setOpenWindows((p) => ({ ...p, [id]: { ...(p[id] || {}), open: true, minimized: false, minimizing: false, closing: false } }));
  };

  const closeWindow = (id) => {
    if (closeTimersRef.current[id]) {
      window.clearTimeout(closeTimersRef.current[id]);
      delete closeTimersRef.current[id];
    }
    clearMinimizeTimer(id);

    setOpenWindows((p) => {
      const prev = p[id] || {};
      return { ...p, [id]: { ...prev, open: true, minimized: false, minimizing: false, closing: true } };
    });

    closeTimersRef.current[id] = window.setTimeout(() => {
      setOpenWindows((p) => {
        const prev = p[id] || {};
        return {
          ...p,
          [id]: {
            ...prev,
            open: false,
            minimized: false,
            closing: false,
            currentPath: undefined,
            navigationHistory: undefined,
          },
        };
      });
      delete closeTimersRef.current[id];
    }, 230);
  }; // Animate close before unmount

  const scheduleMinimize = (id) => {
    clearMinimizeTimer(id);
    minimizeTimersRef.current[id] = window.setTimeout(() => {
      setOpenWindows((p) => {
        const prev = p[id] || {};
        return { ...p, [id]: { ...prev, minimized: true, minimizing: false } };
      });
      delete minimizeTimersRef.current[id];
    }, 230);
  };

  const toggleWindow = (id) =>
    setOpenWindows((prev) => {
      const win = prev[id];
      if (!win) return prev;
      if (win.closing) return prev;
      if (win.minimizing) return prev;

      if (!win.open) {
        clearMinimizeTimer(id);
        return { ...prev, [id]: { ...win, open: true, minimized: false, minimizing: false } };
      }

      if (win.minimized) {
        clearMinimizeTimer(id);
        return { ...prev, [id]: { ...win, minimized: false, minimizing: false } };
      }

      // Start minimize animation; actual unmount happens after timer.
      scheduleMinimize(id);
      return { ...prev, [id]: { ...win, minimized: false, minimizing: true } };
    });

  const minimizeWindow = (id) =>
    setOpenWindows((prev) => {
      const win = prev[id];
      if (!win) return prev;
      if (!win.open) return prev;
      if (win.closing) return prev;
      if (win.minimized || win.minimizing) return prev;
      scheduleMinimize(id);
      return { ...prev, [id]: { ...win, minimized: false, minimizing: true } };
    });

  const updateWindowPath = (id, currentPath, navigationHistory) =>
    setOpenWindows((p) => {
      const prev = p[id] || {};
      if (prev.currentPath === currentPath && prev.navigationHistory === navigationHistory) {
        return p;
      }
      return { ...p, [id]: { ...prev, currentPath, navigationHistory } };
    });

  return { openWindows, setOpenWindows, openWindow, closeWindow, toggleWindow, minimizeWindow, updateWindowPath };
}
