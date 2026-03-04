import { useEffect, useMemo, useRef, useState } from "react";
import Window from "../folder_styles/FolderGeneral";

export default function NotepadWindow({
  onClose,
  onMinimize,
  filePath = "/files/untitled.txt",
  title = null,
  content = null,
  centered = false,
  defaultWidth = 700,
  defaultHeight = 420,
  closing = false,
}) {
  const [text, setText] = useState("");
  const [_loading, setLoading] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [lineCount, setLineCount] = useState(1);
  const [charCount, setCharCount] = useState(0);
  const [statusBarVisible, setStatusBarVisible] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [openMenu, setOpenMenu] = useState(null);
  const [fileHandle, setFileHandle] = useState(null);
  const resolvedTitle = useMemo(() => {
    if (typeof title === "string" && title.trim()) return title.trim();
    if (filePath) {
      const name = filePath.split("/").pop();
      if (name) return name;
    }
    return "MyNotes";
  }, [title, filePath]);

  const [fileName, setFileName] = useState(() => resolvedTitle);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    let canceled = false;
    async function load() {
      if (typeof content === "string") {
        setText(content);
        updateStats(content);
        setFileName(resolvedTitle);
        return;
      }
      if (!filePath) return;
      setLoading(true);
      try {
        const res = await fetch(filePath);
        const t = await res.text();
        if (!canceled) {
          setText(t);
          updateStats(t);
          setFileName(resolvedTitle);
        }
      } catch (err) {
        if (!canceled) setText(`Failed to load ${filePath}: ${err}`);
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    load();
    return () => (canceled = true);
  }, [filePath, content, resolvedTitle]);

  useEffect(() => {
    function handleDocPointerDown(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("pointerdown", handleDocPointerDown);
    return () => document.removeEventListener("pointerdown", handleDocPointerDown);
  }, []);

  function updateStats(value) {
    setLineCount(value.split("\n").length);
    setCharCount(value.length);
  }

  function handleTextChange(e) {
    const newText = e.target.value;
    setText(newText);
    updateStats(newText);
  }

  function downloadFile(contents, name) {
    const blob = new Blob([contents], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "untitled.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (fileHandle && fileHandle.createWritable) {
      const writable = await fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
      return;
    }
    downloadFile(text, fileName || "untitled.txt");
  }

  async function handleSaveAs() {
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName || "untitled.txt",
          types: [{ description: "Text Documents", accept: { "text/plain": [".txt"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(text);
        await writable.close();
        setFileHandle(handle);
        setFileName(handle.name || "untitled.txt");
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    const name = prompt("Save as", fileName || "untitled.txt");
    if (!name) return;
    downloadFile(text, name);
    setFileName(name);
  }

  async function handleOpen() {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: "Text Documents", accept: { "text/plain": [".txt"] } }],
          multiple: false,
        });
        const file = await handle.getFile();
        const t = await file.text();
        setText(t);
        updateStats(t);
        setFileHandle(handle);
        setFileName(file.name || "untitled.txt");
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    fileInputRef.current?.click();
  }

  function handleOpenFallback(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((t) => {
      setText(t);
      updateStats(t);
      setFileHandle(null);
      setFileName(file.name || "untitled.txt");
    });
    e.target.value = "";
  }

  function handleNew() {
    setText("");
    updateStats("");
    setFileHandle(null);
    setFileName("Untitled.txt");
  }

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<pre style="white-space: pre-wrap; font-family: monospace;">${text.replace(/</g, "&lt;")}</pre>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  function selectRange(start, end) {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(start, end);
  }

  function deleteSelection() {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start === end) return;
    const next = text.slice(0, start) + text.slice(end);
    setText(next);
    updateStats(next);
    selectRange(start, start);
  }

  function handleFind() {
    const query = prompt("Find", "");
    if (!query) return;
    const el = textareaRef.current;
    const startIndex = el?.selectionEnd ?? 0;
    let idx = text.indexOf(query, startIndex);
    if (idx === -1 && startIndex > 0) idx = text.indexOf(query, 0);
    if (idx === -1) {
      alert("Cannot find the text.");
      return;
    }
    selectRange(idx, idx + query.length);
  }

  function handleReplace() {
    const findValue = prompt("Find", "");
    if (!findValue) return;
    const replaceValue = prompt("Replace with", "");
    if (replaceValue === null) return;
    const next = text.split(findValue).join(replaceValue);
    setText(next);
    updateStats(next);
  }

  function handleGoTo() {
    const raw = prompt("Go to line", "1");
    if (!raw) return;
    const line = Number.parseInt(raw, 10);
    if (!Number.isFinite(line) || line < 1) {
      alert("Invalid line number.");
      return;
    }
    let index = 0;
    let currentLine = 1;
    while (currentLine < line && index < text.length) {
      if (text[index] === "\n") currentLine += 1;
      index += 1;
    }
    if (currentLine !== line) {
      alert("Line number out of range.");
      return;
    }
    selectRange(index, index);
  }

  function handleTimeDate() {
    const el = textareaRef.current;
    if (!el) return;
    const stamp = new Date().toLocaleString();
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const next = text.slice(0, start) + stamp + text.slice(end);
    setText(next);
    updateStats(next);
    selectRange(start + stamp.length, start + stamp.length);
  }

  const menuItems = {
    file: [
      { label: "New", shortcut: "Ctrl+N", action: handleNew },
      { label: "Open...", shortcut: "Ctrl+O", action: handleOpen },
      { label: "Save", shortcut: "Ctrl+S", action: handleSave },
      { label: "Save As...", action: handleSaveAs },
      { label: "Print...", shortcut: "Ctrl+P", action: handlePrint },
      { type: "separator" },
      { label: "Exit", action: () => onClose?.() },
    ],
    edit: [
      { label: "Undo", shortcut: "Ctrl+Z", action: () => document.execCommand("undo") },
      { label: "Redo", shortcut: "Ctrl+Y", action: () => document.execCommand("redo") },
      { type: "separator" },
      { label: "Cut", shortcut: "Ctrl+X", action: () => document.execCommand("cut") },
      { label: "Copy", shortcut: "Ctrl+C", action: () => document.execCommand("copy") },
      { label: "Paste", shortcut: "Ctrl+V", action: () => document.execCommand("paste") },
      { label: "Delete", shortcut: "Del", action: deleteSelection },
      { type: "separator" },
      { label: "Find...", shortcut: "Ctrl+F", action: handleFind },
      { label: "Replace...", shortcut: "Ctrl+H", action: handleReplace },
      { label: "Go To...", shortcut: "Ctrl+G", action: handleGoTo },
      { type: "separator" },
      { label: "Select All", shortcut: "Ctrl+A", action: () => textareaRef.current?.select() },
      { label: "Time/Date", shortcut: "F5", action: handleTimeDate },
    ],
    view: [
      { label: "Zoom In", shortcut: "Ctrl+Plus", action: () => setZoom((z) => Math.min(200, z + 10)) },
      { label: "Zoom Out", shortcut: "Ctrl+Minus", action: () => setZoom((z) => Math.max(50, z - 10)) },
      { label: "Restore Default Zoom", shortcut: "Ctrl+0", action: () => setZoom(100) },
      { type: "separator" },
      { label: "Word Wrap", checked: wordWrap, action: () => setWordWrap((v) => !v) },
      { label: "Status Bar", checked: statusBarVisible, action: () => setStatusBarVisible((v) => !v) },
      { label: "Font settings...", action: () => alert("Font settings are not available yet.") },
    ],
  };

  function handleMenuAction(action) {
    action?.();
    setOpenMenu(null);
  }

  function handleTextareaKeyDown(e) {
    if (e.ctrlKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSave();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "o") {
      e.preventDefault();
      handleOpen();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "n") {
      e.preventDefault();
      handleNew();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "f") {
      e.preventDefault();
      handleFind();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "h") {
      e.preventDefault();
      handleReplace();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "g") {
      e.preventDefault();
      handleGoTo();
      return;
    }
    if (e.ctrlKey && (e.key === "+" || e.key === "=")) {
      e.preventDefault();
      setZoom((z) => Math.min(200, z + 10));
      return;
    }
    if (e.ctrlKey && e.key === "-") {
      e.preventDefault();
      setZoom((z) => Math.max(50, z - 10));
      return;
    }
    if (e.ctrlKey && e.key === "0") {
      e.preventDefault();
      setZoom(100);
      return;
    }
    if (e.key === "F5") {
      e.preventDefault();
      handleTimeDate();
    }
  }

  return (
    <Window
      title={
        <span className="flex items-center gap-2">
          <img src="/icons/notepad.ico" alt="" className="w-4 h-4" />
          <span>{resolvedTitle}</span>
        </span>
      }
      onClose={onClose}
      onMinimize={onMinimize}
      closing={closing}
      centered={centered}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      contentClassName="p-0"
    >
      <div className="flex flex-col h-full">
        {/* Menu Bar */}
        <div ref={menuRef} className="border-b border-white/10 bg-gray-800 px-4 py-1 flex items-center gap-4 text-sm relative">
          {[
            { id: "file", label: "File" },
            { id: "edit", label: "Edit" },
            { id: "view", label: "View" },
          ].map((menu) => (
            <div key={menu.id} className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu((m) => (m === menu.id ? null : menu.id))}
                className={`px-2 py-1 rounded transition ${openMenu === menu.id ? "bg-white/10" : "hover:bg-white/10"}`}
              >
                {menu.label}
              </button>
              {openMenu === menu.id ? (
                <div className="absolute left-0 mt-2 w-56 bg-gray-900 border border-white/10 rounded shadow-lg z-50">
                  {menuItems[menu.id].map((item, idx) => (
                    item.type === "separator" ? (
                      <div key={`${menu.id}-sep-${idx}`} className="border-t border-white/10 my-1" />
                    ) : (
                      <button
                        key={`${menu.id}-${item.label}`}
                        type="button"
                        onClick={() => handleMenuAction(item.action)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-4 text-center text-white/70">{item.checked ? "✓" : ""}</span>
                          <span>{item.label}</span>
                        </span>
                        <span className="text-xs text-white/60">{item.shortcut || ""}</span>
                      </button>
                    )
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      
        {/* Editor */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleTextareaKeyDown}
          className={`flex-1 bg-gray-950 p-4 text-sm text-white focus:outline-none resize-none w-full h-full font-mono ${
            wordWrap ? "break-words" : "whitespace-pre overflow-x-auto"
          }`}
          spellCheck="false"
          style={{ fontSize: `${Math.round(12 * (zoom / 100))}px` }}
        />

        {/* Status Bar */}
        {statusBarVisible ? (
          <div className="bg-gray-800 border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-white/70">
            <div>
              <span>Lines: {lineCount} | Characters: {charCount}</span>
            </div>
            <div>
              <span>Zoom: {zoom}% | UTF-8 | Windows (CRLF)</span>
            </div>
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={handleOpenFallback}
        />
      </div>
    </Window>
  );
}
