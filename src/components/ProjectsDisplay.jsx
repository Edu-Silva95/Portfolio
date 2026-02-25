export default function Project({ name, description, link }) {
  return (
    <div className="project-window p-4 border border-white/10 rounded shadow-md hover:shadow-lg transition relative bg-black/80">
      <div className="title-bar flex justify-between items-center p-1 bg-gray-800/60 text-white text-sm font-semibold rounded-t">
        <span>{name}</span>
        <div className="window-buttons flex space-x-1">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
        </div>
      </div>
      <div className="p-2">
        <p className="text-white/70 mb-2">{description}</p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sky-400 hover:underline"
          >
            Launch
          </a>
        )}
      </div>
    </div>
  );
}