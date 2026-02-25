import { useEffect, useRef, useState } from "react";

export default function useWindowsState(windowIds = []) {
  const [openWindows, setOpenWindows] = useState(
    Object.fromEntries(windowIds.map((id) => [id, { open: false, minimized: false }]))
  );
  const closeTimersRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(closeTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const openWindow = (id) => {
    if (closeTimersRef.current[id]) {
      window.clearTimeout(closeTimersRef.current[id]);
      delete closeTimersRef.current[id];
    }
    setOpenWindows((p) => ({ ...p, [id]: { ...(p[id] || {}), open: true, minimized: false, closing: false } }));
  };

  const closeWindow = (id) => {
    if (closeTimersRef.current[id]) {
      window.clearTimeout(closeTimersRef.current[id]);
      delete closeTimersRef.current[id];
    }

    setOpenWindows((p) => {
      const prev = p[id] || {};
      return { ...p, [id]: { ...prev, open: true, minimized: false, closing: true } };
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
  const toggleWindow = (id) =>
    setOpenWindows((prev) => {
      const win = prev[id];
      if (!win) return prev;
      if (win.closing) return prev;
      if (!win.open) return { ...prev, [id]: { ...win, open: true, minimized: false } };
      if (win.minimized) return { ...prev, [id]: { ...win, minimized: false } };
      return { ...prev, [id]: { ...win, minimized: true } };
    });

  const minimizeWindow = (id) =>
    setOpenWindows((p) => ({ ...p, [id]: { ...(p[id] || {}), minimized: true } }));

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
