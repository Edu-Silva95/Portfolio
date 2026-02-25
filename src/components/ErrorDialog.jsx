export default function ErrorDialog({ isOpen, onClose, title = "Access Denied", message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white text-black rounded-lg shadow-2xl w-96 overflow-hidden">
        {/* Title Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex gap-4">
          {/* Error Icon */}
          <div className="flex-shrink-0">
            <svg className="w-10 h-10 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" opacity="0.2" />
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>

          {/* Message */}
          <div className="flex-1">
            <p className="text-sm text-gray-800 whitespace-pre-line">{message}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-gray-50 px-6 py-3 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded shadow transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
