// No direct React hooks imported here; app state lives in custom hooks
import { useState } from "react";
import Desktop from "./components/Desktop";
import ContextMenu from "./components/ContextMenu";
import InspectorModal from "./components/InspectorModal";
// window components moved to config
import Taskbar from "./components/Taskbar/Taskbar";
import ScreenSaver from "./components/ScreenSaver";

// hooks
import useDesktopGrid from "./hooks/useDesktopGrid";
import useContextMenu from "./hooks/useContextMenu";
import useWindowsState from "./hooks/useWindowsState";
import useInspector from "./hooks/useInspector";
import useRecycleBinState from "./hooks/useRecycleBinState";
import { openDesktopIcon } from "./utils/desktopIconRouting";
import { buildDesktopContextMenuItems } from "./utils/contextMenuItems";
import { buildWindowExtraProps } from "./utils/windowExtraProps";

import useCreateShortcut from "./hooks/useCreateShortcut";

// --- CONFIGURATION ---
const ICON_W = 100;
const ICON_H = 96;
const PADDING_X = 1;
const PADDING_Y = 1;

import { windowsConfig } from "./config/desktopConfig";
import { useFileSystem } from "./context/FileSystemContext";

function App() {
  const openableIds = Object.keys(windowsConfig);
  // split state into hooks
    // Desktop icon state is now stored in FileSystemContext
    const { getDesktopIcons, setDesktopIcons, findFreePosition, updateDesktopIconPosition } = useFileSystem();
    const icons = getDesktopIcons();
    const [draggingPositions, _setDraggingPositions] = useState({});
    const [selectedIds, setSelectedIds] = useState([]);
    const { moveSelectedIcons } = useDesktopGrid({
      icons,
      selectedIds,
      setIcons: setDesktopIcons,
      updateIconPosition: updateDesktopIconPosition,
      iconWidth: ICON_W,
      iconHeight: ICON_H,
      paddingX: PADDING_X,
      paddingY: PADDING_Y,
    });
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const { openWindows, setOpenWindows, openWindow, closeWindow, toggleWindow, minimizeWindow, updateWindowPath } = useWindowsState(
    Object.keys(windowsConfig)
  );
  const { inspector, viewPageSource, inspectElement, closeInspector } = useInspector();

  // Desktop helpers come from FileSystemContext; no registration needed
  
  const handleIconClick = (id) => {
    const icon = icons.find((it) => it.id === id);
    openDesktopIcon({
      icon,
      fallbackId: id,
      windowsConfig,
      openWindow,
      updateWindowPath,
    });
  };

  const {
    recycleBin,
    pendingRestores,
    moveDesktopIconToRecycleBin,
    restoreFromRecycleBin,
    deleteForeverFromRecycleBin,
    emptyRecycleBin,
    confirmDesktopDelete,
    moveFolderItemToRecycleBin,
    consumeRestoreForPath,
  } = useRecycleBinState({
    icons,
    setIcons: setDesktopIcons,
    setOpenWindows,
    findFreePosition,
  });

  const createDesktopShortcut = useCreateShortcut({ icons, setIcons: setDesktopIcons, windowsConfig, findFreePosition });

  const contextMenuItems = buildDesktopContextMenuItems({
    contextMenu,
    icons,
    setIcons: setDesktopIcons,
    windowsConfig,
    openWindow,
    closeContextMenu,
    inspectElement,
    viewPageSource,
    selectedIds,
    setSelectedIds,
    confirmDesktopDelete,
    moveDesktopIconToRecycleBin,
    findFreePosition,
    iconWidth: ICON_W,
    iconHeight: ICON_H,
    paddingX: PADDING_X,
    paddingY: PADDING_Y,
  });

  return (
    <div className="w-screen h-screen animated-desktop-bg">
      <div className="relative w-full h-full">
        <Desktop
          icons={icons}
          draggingPositions={draggingPositions}
          selectedIds={selectedIds}
          onSelect={(id) => setSelectedIds([id])}
          onSelectMultiple={setSelectedIds}
          onIconClick={handleIconClick}
          doubleClickOnly={Object.keys(windowsConfig)}
          onContextMenuRequested={openContextMenu}
          onMove={() => {}}
          onDrop={moveSelectedIcons}
          onClearSelection={() => setSelectedIds([])}
        />

        <ContextMenu
          open={contextMenu.open}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          items={contextMenuItems}
        />

        <InspectorModal
          open={inspector.open}
          html={inspector.html}
          styles={inspector.styles}
          onClose={closeInspector}
        />
        {/* Render all open windows dynamically */}
        {Object.entries(openWindows).map(([id, win]) => {
          if ((!win.open && !win.closing) || (win.minimized && !win.minimizing)) return null;
          const Component = windowsConfig[id];
          if (!Component) return null;
          const extraProps = buildWindowExtraProps({
            id,
            win,
            openWindow,
            closeWindow,
            updateWindowPath,
            recycleBin,
            restoreFromRecycleBin,
            deleteForeverFromRecycleBin,
            emptyRecycleBin,
            icons,
            openableIds,
            openContextMenu,
            moveFolderItemToRecycleBin,
            createDesktopShortcut,
            pendingRestores,
            consumeRestoreForPath,
          });

          return (
            <Component
              key={id}
              {...extraProps}
              windowId={id}
              dataWindowId={id}
              minimized={win.minimized}
              minimizing={!!win.minimizing}
              closing={!!win.closing}
              onClose={() => closeWindow(id)}
              onMinimize={() => minimizeWindow(id)}
              onOpenWindow={openWindow}
            />
          );
        })}

        <Taskbar
          onClearSelection={() => setSelectedIds([])}
          openWindows={openWindows}
          onToggleWindow={toggleWindow}
          onOpenWindow={openWindow}
          onCloseWindow={closeWindow}
          updateWindowPath={updateWindowPath}
        />
        <ScreenSaver onActive={() => console.log("screensaver active")} />
      </div>
    </div>
  );
}

export default App;
