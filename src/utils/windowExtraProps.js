const applySavedNavigation = (extraProps, win) => {
  if (win?.currentPath) {
    extraProps.savedPath = win.currentPath;
    extraProps.savedHistory = win.navigationHistory;
  }
};

export function buildWindowExtraProps({
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
}) {
  const extraProps = {
    onContextMenuRequested: openContextMenu,
    onMoveToRecycleBin: moveFolderItemToRecycleBin,
    onCreateDesktopShortcut: createDesktopShortcut,
    pendingRestores,
    onConsumeRestore: consumeRestoreForPath,
  };

  if (id === "readme") {
    extraProps.filePath = "/files/Readme.txt";
    extraProps.title = "Readme.txt";
  }

  if (id === "cv") {
    extraProps.filePath = "/files/Curriculum_Vitae_2026.pdf";
    extraProps.title = "Curriculum_Vitae_2026.pdf";
    extraProps.centered = true;
    extraProps.defaultWidth = 900;
    extraProps.defaultHeight = 600;
  }

  if (id === "about") {
    extraProps.onOpenReadme = () => openWindow("readme");
    extraProps.onNavigateSystemPath = (targetPath) => {
      const path = targetPath || "This PC";
      const history = path === "This PC > Desktop" ? ["This PC", "This PC > Desktop"] : ["This PC"];
      openWindow("thispc");
      updateWindowPath("thispc", path, history);
      closeWindow("about");
    };
  }

  if (id === "recycle") {
    extraProps.recycleBin = recycleBin;
    extraProps.onRestore = restoreFromRecycleBin;
    extraProps.onDeleteForever = deleteForeverFromRecycleBin;
    extraProps.onEmptyRecycleBin = emptyRecycleBin;
  }

  if (id === "documents") {
    extraProps.onOpenWindow = openWindow;
    extraProps.centered = true;
    extraProps.defaultWidth = 900;
    extraProps.defaultHeight = 550;
    extraProps.windowId = id;
    extraProps.updateWindowPath = updateWindowPath;
    applySavedNavigation(extraProps, win);
  }

  if (id === "projects") {
    extraProps.onOpenWindow = openWindow;
    extraProps.initialPath = "Documents > Projects";
    extraProps.centered = true;
    extraProps.defaultWidth = 900;
    extraProps.defaultHeight = 550;
    extraProps.windowId = id;
    extraProps.updateWindowPath = updateWindowPath;
    applySavedNavigation(extraProps, win);
  }

  if (id === "thispc") {
    extraProps.onOpenWindow = openWindow;
    extraProps.centered = true;
    extraProps.defaultWidth = 900;
    extraProps.defaultHeight = 550;
    extraProps.windowId = id;
    extraProps.updateWindowPath = updateWindowPath;
    extraProps.desktopIcons = icons;
    extraProps.openableIds = openableIds;
    applySavedNavigation(extraProps, win);
  }

  if (id === "photos") {
    extraProps.centered = true;
    extraProps.defaultWidth = 900;
    extraProps.defaultHeight = 550;
    extraProps.initialPath = "This PC > Documents > Photos";
    extraProps.windowId = id;
    extraProps.updateWindowPath = updateWindowPath;
    extraProps.desktopIcons = icons;
    extraProps.openableIds = openableIds;
    applySavedNavigation(extraProps, win);
  }

  if (id === "games") {
    extraProps.onOpenWindow = openWindow;
    extraProps.centered = true;
    extraProps.defaultWidth = 900;
    extraProps.defaultHeight = 550;
    extraProps.initialPath = "Documents > Games";
    extraProps.windowId = id;
    extraProps.updateWindowPath = updateWindowPath;
    applySavedNavigation(extraProps, win);
  }

  if (id === "notes") {
    extraProps.centered = true;
    extraProps.defaultWidth = 900;
    extraProps.defaultHeight = 550;

    // Allow dynamic "open file" behavior by storing filePath in `currentPath`
    // and optional metadata in `navigationHistory`.
    if (typeof win?.currentPath === "string" && win.currentPath.trim()) {
      extraProps.filePath = win.currentPath;
    }
    if (win?.navigationHistory && typeof win.navigationHistory === "object") {
      extraProps.title = win.navigationHistory.title || extraProps.title;
      extraProps.content = win.navigationHistory.content || extraProps.content;
    }
  }

  if (id === "browser") {
    // Browser can be retargeted to a URL by storing it in the window's `currentPath`.
    if (typeof win?.currentPath === "string" && win.currentPath.trim()) {
      extraProps.initialUrl = win.currentPath;
    }
  }

  if (id === "localdisc_c") {
    extraProps.title = "Local Disk (C:)";
    extraProps.centered = true;
    extraProps.defaultWidth = 900;
    extraProps.defaultHeight = 550;
  }

  if (id === "localdisc_d") {
    extraProps.title = "Local Disk (D:)";
    extraProps.centered = true;
    extraProps.defaultWidth = 900;
    extraProps.defaultHeight = 550;
  }

  return extraProps;
}
