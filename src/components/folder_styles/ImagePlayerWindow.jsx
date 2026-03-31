import { useEffect, useState } from "react";
import Window from "./FolderGeneral";
import ImagePlayer from "./ImagePlayer";

export default function ImagePlayerWindow({
  onClose,
  onMinimize,
  minimized = false,
  minimizing = false,
  closing = false,
  title = "Image Player",
  images = [],
  startIndex = 0,
  centered = true,
  defaultWidth = 900,
  defaultHeight = 600,
  dataWindowId,
  icon = "/icons/player.png",
}) {
  const [showNotice, setShowNotice] = useState(true);
  const [noticeLeaving, setNoticeLeaving] = useState(false);

  useEffect(() => {
    // Reset the banner each time a new image set is loaded.
    setShowNotice(true);
    setNoticeLeaving(false);
  }, [images]);

  const dismissNotice = () => {
    setNoticeLeaving(true);
    window.setTimeout(() => setShowNotice(false), 220);
  };

  return (
    <Window
      title={title}
      icon={icon}
      onClose={onClose}
      onMinimize={onMinimize}
      minimized={minimized}
      minimizing={minimizing}
      closing={closing}
      centered={centered}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      hideScrollbar
      contentClassName="p-0"
      dataWindowId={dataWindowId}
    >
      {showNotice ? (
        <div
          className={`border-b border-white/10 bg-white/5 transition-all duration-200 ease-out ${noticeLeaving ? "-translate-y-2 opacity-0 max-h-0" : "translate-y-0 opacity-100 max-h-40"} overflow-hidden`}
        >
          <div className="flex items-start justify-between gap-3 p-4">
            <p className="text-sm text-white/90 leading-relaxed">
              <span className="font-semibold">Note:</span> All the images in this folder will be displayed here.
              Click a thumbnail to view it full-size. Use Arrow keys to navigate and Escape to close.
            </p>
            <button
              type="button"
              onClick={dismissNotice}
              className="shrink-0 rounded px-2 py-1 text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Dismiss message"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
      <ImagePlayer images={images} initialIndex={startIndex} />
    </Window>
  );
}
