import { useEffect, useState } from "react";
import Window from "./FolderGeneral";

export default function TextFileWindow({ onClose, onMinimize, content, title, filePath, closing = false }) {
  const [text, setText] = useState(content || "");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!filePath) return;
      try {
        const res = await fetch(filePath);
        const t = await res.text();
        if (!cancelled) setText(t);
      } catch (err) {
        if (!cancelled) setText(`Failed to load ${filePath}: ${err}`);
      }
    }
    load();
    return () => (cancelled = true);
  }, [filePath]);

  function handleSave() {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = title || (filePath ? filePath.split("/").pop() : "file.txt");
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Window title={title} onClose={onClose} onMinimize={onMinimize} closing={closing}>
      <div className="flex flex-col h-full">
        <div className="p-1  border-b border-white/10 bg-gray-800 flex items-center gap-2">
          <button onClick={handleSave} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded">Save</button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-transparent p-4 text-sm text-white focus:outline-none resize-none w-full h-full"
        />
      </div>
    </Window>
  );
}
