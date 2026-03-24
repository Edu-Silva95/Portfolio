import { useEffect, useMemo, useState } from "react";

const clampIndex = (index, length) => {
  if (!Number.isFinite(index) || length <= 0) return 0;
  const normalized = Math.floor(index);
  return Math.min(Math.max(normalized, 0), length - 1);
};

export default function ImagePlayer({ images = [], initialIndex = 0 }) {
  const safeImages = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const [currentIndex, setCurrentIndex] = useState(() => (safeImages.length ? clampIndex(initialIndex, safeImages.length) : null));

  useEffect(() => {
    if (!safeImages.length) {
      setCurrentIndex(null);
      return;
    }
    setCurrentIndex(clampIndex(initialIndex, safeImages.length));
  }, [initialIndex, safeImages.length]);

  const openImage = (index) => setCurrentIndex(clampIndex(index, safeImages.length));
  const closeViewer = () => setCurrentIndex(null);
  const nextImage = () => setCurrentIndex((prev) => (prev == null ? 0 : (prev + 1) % safeImages.length));
  const prevImage = () => setCurrentIndex((prev) => (prev == null ? 0 : (prev === 0 ? safeImages.length - 1 : prev - 1)));

  useEffect(() => {
    const handleKey = (e) => {
      if (currentIndex === null) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") closeViewer();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, safeImages.length]);

  if (!safeImages.length) {
    return (
      <div className="h-full w-full flex items-center justify-center text-white/70 text-sm">
        No images found.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Thumbnails */}
      <div className="h-full overflow-auto p-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {safeImages.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => openImage(index)}
              className="group rounded border border-white/10 bg-white/5 hover:bg-white/10 transition overflow-hidden cursor-pointer"
              aria-label={`Open image ${index + 1}`}
            >
              <img
                src={src}
                alt=""
                className="w-full h-20 object-cover block group-hover:scale-[1.02] transition"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Viewer overlay */}
      {currentIndex !== null && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <button
            type="button"
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition"
            aria-label="Previous image"
          >
            ←
          </button>

          <img
            src={safeImages[currentIndex]}
            alt=""
            className="max-h-[85%] max-w-[90%] object-contain rounded"
          />

          <button
            type="button"
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition"
            aria-label="Next image"
          >
            →
          </button>

          <button
            type="button"
            onClick={closeViewer}
            className="absolute top-3 right-3 px-3 py-2 rounded bg-white/10 hover:bg-red-600 transition"
            aria-label="Close viewer"
          >
            ✕
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/80 bg-black/30 px-2 py-1 rounded">
            {currentIndex + 1} / {safeImages.length}
          </div>
        </div>
      )}
    </div>
  );
}