import Window from "./FolderGeneral";
import { parseYouTubeVideoId } from "../../utils/youtube";

export default function YoutubePlayer({
  onClose,
  onMinimize,
  minimized = false,
  minimizing = false,
  closing = false,
  title = "Project Demo",
  videoId = null,
  videoUrl = null,
}) {
  const resolvedVideoId = videoId || parseYouTubeVideoId(videoUrl);

  return (
    <Window
      title={
        <span className="flex items-center gap-2">
          <span className="text-base">🎬</span>
          <span>{title}</span>
        </span>
      }
      onClose={onClose}
      onMinimize={onMinimize}
      minimized={minimized}
      minimizing={minimizing}
      closing={closing}
      contentClassName="p-0"
    >
      <div className="h-full w-full bg-gray-900">
        {resolvedVideoId ? (
          <div className="p-4">
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe
                src={`https://www.youtube.com/embed/${encodeURIComponent(String(resolvedVideoId))}?rel=0`}
                title={title}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: 0,
                  borderRadius: "8px",
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center p-6 text-sm text-white/70">
            No YouTube demo configured for this project.
          </div>
        )}
      </div>
    </Window>
  );
}
