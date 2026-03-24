import { useMemo, useState } from "react";
import Window from "./FolderGeneral";
import FolderToolbar from "../Folders/FolderToolbar";
import useFolderNavigation from "../../hooks/useFolderNavigation";
import { formatPath, getWindowTitle, buildPathSegments } from "../../utils/folderPath";
import FileTable from "../Folders/FileTable";

export default function RecycleWindow({
  recycleBin = [],
  onRestore,
  onDeleteForever,
  onEmptyRecycleBin,
  onClose,
  onMinimize,
  minimized = false,
  minimizing = false,
  closing = false,
}) {
  const { currentPath, navigationHistory: _navigationHistory, pushPath, handleBack, handleForward, canGoBack, canGoForward } = useFolderNavigation({
    initialPath: "Recycle Bin",
    windowId: "recycle",
    savedPath: null,
    savedHistory: null,
    updateWindowPath: null,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return recycleBin;
    const q = searchQuery.toLowerCase();
    return recycleBin.filter((it) => it.name.toLowerCase().includes(q));
  }, [recycleBin, searchQuery]);

  const getItemKey = (item) => item.id ?? item.name;

  const itemCount = filtered.length;

  const pathDisplay = `🗑️ ${formatPath(currentPath, { segmentIcon: "/icons/windows-recycle.png" })}`;
  const windowTitle = getWindowTitle(currentPath, { segmentIcon: "/icons/windows-recycle.png" });
  const pathSegments = buildPathSegments(currentPath);

  return (
    <Window title={windowTitle} icon="/icons/windows-recycle.png" onClose={onClose} onMinimize={onMinimize} minimized={minimized} minimizing={minimizing} closing={closing}>
      <div className="flex flex-col h-full text-sm">
        <FolderToolbar
          onBack={handleBack}
          canGoBack={canGoBack}
          onForward={handleForward}
          canGoForward={canGoForward}
          pathDisplay={pathDisplay}
          pathSegments={pathSegments}
          onNavigatePath={(path) => pushPath(path)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className="flex-1 overflow-auto min-h-0 folder-scroll">
          {itemCount === 0 ? (
            <p className="text-gray-400 px-2">Recycle Bin is empty.</p>
          ) : viewMode === "icons" ? (
            <FileTable
              items={filtered.map((it) => ({ id: it.id, name: it.name, icon: it.icon, isImage: false, isFolder: false }))}
              viewMode="icons"
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onItemClick={(item) => setSelectedIds([getItemKey(item)])}
              onItemDoubleClick={() => { }}
              actions={(item) => (
                <>
                  <button className="text-blue-400 hover:underline" onClick={(e) => { e.stopPropagation(); onRestore(item.id); }}>Restore</button>
                  <button className="text-red-500 hover:underline" onClick={(e) => { e.stopPropagation(); onDeleteForever(item.id); }}>Delete</button>
                </>
              )}
            />
          ) : (
            <FileTable
              items={filtered.map((it) => ({ id: it.id, name: it.name, icon: it.icon, isImage: false, isFolder: false, type: "File", size: "—" }))}
              viewMode="list"
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onItemClick={(item) => setSelectedIds([getItemKey(item)])}
              onItemDoubleClick={() => { }}
              actions={(item) => (
                <div className="flex items-center justify-end gap-2">
                  <button className="text-blue-400 hover:underline" onClick={(e) => { e.stopPropagation(); onRestore(item.id); }}>Restore</button>
                  <button className="text-red-500 hover:underline" onClick={(e) => { e.stopPropagation(); onDeleteForever(item.id); }}>Delete</button>
                </div>
              )}
            />
          )}
        </div>
         {/* Status bar */}
        <div className="pt-2 px-2 border-t border-white/10 text-xs text-white/70 flex justify-between">
          <span>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
          {selectedIds.length > 0 ? (
            <span>
              {selectedIds.length} selected
            </span>
          ) : null}

          {itemCount > 0 && (
            <button
              className="text-red-400 hover:underline"
              onClick={() => {
                const ok = window.confirm(
                  "Are you sure you want to empty the Recycle Bin?"
                );
                if (ok) onEmptyRecycleBin();
              }}
            >
              Empty Recycle Bin
            </button>
          )}
        </div>
      </div>
    </Window>
  );
}
