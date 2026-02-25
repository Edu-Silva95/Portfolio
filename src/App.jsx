// No direct React hooks imported here; app state lives in custom hooks
import Desktop from "./components/Desktop";
import ContextMenu from "./components/ContextMenu";
import InspectorModal from "./components/InspectorModal";
// window components moved to config
import Taskbar from "./components/Taskbar/Taskbar";
import ScreenSaver from "./components/ScreenSaver";

// hooks
import useDesktopState from "./hooks/useDesktopState";
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

import { windowsConfig, initialIcons } from "./config/desktopConfig";

function App() {
  const openableIds = Object.keys(windowsConfig);
  // split state into hooks
  const desktop = useDesktopState(initialIcons, { ICON_W, ICON_H, PADDING_X, PADDING_Y });
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const { openWindows, setOpenWindows, openWindow, closeWindow, toggleWindow, minimizeWindow, updateWindowPath } = useWindowsState(
    Object.keys(windowsConfig)
  );
  const { inspector, viewPageSource, inspectElement, closeInspector } = useInspector();

  const { icons, draggingPositions, updateIconPosition, selectedIds, setSelectedIds } = desktop;
  const { findFreePosition, moveSelectedIcons } = useDesktopGrid({
    icons,
    selectedIds,
    setIcons: desktop.setIcons,
    updateIconPosition,
    iconWidth: ICON_W,
    iconHeight: ICON_H,
    paddingX: PADDING_X,
    paddingY: PADDING_Y,
  });
  
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
    setIcons: desktop.setIcons,
    setOpenWindows,
    windowsConfig,
    findFreePosition,
  });

  const createDesktopShortcut = useCreateShortcut({ icons, setIcons: desktop.setIcons, windowsConfig, findFreePosition });

  const contextMenuItems = buildDesktopContextMenuItems({
    contextMenu,
    icons: desktop.icons,
    setIcons: desktop.setIcons,
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
          if ((!win.open && !win.closing) || win.minimized) return null;
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
        />
        <ScreenSaver timeout={120000} onActive={() => console.log("screensaver active")} />
      </div>
    </div>
  );
}

export default App;
