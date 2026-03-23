import Window from "./FolderGeneral";

export default function PDFViewer({ onClose, onMinimize, minimized = false, minimizing = false, filePath, title, closing = false }) {
  return (
    <Window title={title || "PDF Viewer"} onClose={onClose} onMinimize={onMinimize} minimized={minimized} minimizing={minimizing} closing={closing}>
      <div className="flex flex-col h-full">
        <iframe
          src={filePath}
          className="flex-1 w-full h-full border-none rounded"
          title={title}
        />
      </div>
    </Window>
  );
}
