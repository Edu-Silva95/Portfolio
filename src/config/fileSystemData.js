import { desktopIconsData } from "./desktopIcons";

const desktopContent = desktopIconsData.map((icon) => ({
  id: icon.id,
  name: icon.label,
  icon: icon.icon,
  type: icon.isFolder ? "Folder" : "Shortcut",
  size: icon.isFolder ? "—" : "1 KB",
  isFolder: !!icon.isFolder,
}));

export const pathMap = {
  "This PC": {
    folders: [
      { name: "Desktop", icon: "🖥️", type: "Folder", size: "—", isFolder: true },
      { name: "Documents", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "Downloads", icon: "⬇️", type: "Folder", size: "—", isFolder: true },
      { name: "Pictures", icon: "🖼️", type: "Folder", size: "—", isFolder: true },
      { name: "Music", icon: "🎵", type: "Folder", size: "—", isFolder: true },
      { name: "Videos", icon: "🎬", type: "Folder", size: "—", isFolder: true },
    ],
    drives: [
      { name: "OS (C:)", icon: "💾", type: "Local Disk", size: "476 GB free of 512 GB", isFolder: true },
      { name: "Local Disk (D:)", icon: "💾", type: "Local Disk", size: "189 GB free of 256 GB", isFolder: true },
    ]
  },
  "This PC > Desktop": {
    content: desktopContent,
  },
  "This PC > Documents": {
    content: [
      { name: "Curriculum Vitae.pdf", icon: "/icons/pdf-file-format.ico", type: "PDF Document", size: "245 KB", isImage: true },
      { name: "Presentation.pptx", icon: "📊", type: "PowerPoint", size: "1.2 MB" },
      { name: "Report.docx", icon: "/icons/notepad.ico", type: "Word Document", size: "89 KB" },
      { name: "Budget.xlsx", icon: "📈", type: "Excel Spreadsheet", size: "156 KB" },
      { name: "Games", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "Photos", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "Projects", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
    ]
  },
  "This PC > Documents > Projects": {
    content: [
      { name: "Portfolio Website", icon: "🌐", type: "Folder", size: "—", isFolder: true },
      { name: "ShopListy", icon: "🛒", type: "Folder", size: "—", isFolder: true },
      { name: "Foodie", icon: "🍽️", type: "Folder", size: "—", isFolder: true },
      { name: "Super Simple List", icon: "/icons/notepad.ico", type: "Folder", size: "—", isFolder: true },
    ]
  },
  "This PC > Documents > Photos": {
    content: [
      { name: "2024 Vacation", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "Family Events", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "Nature", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "Architecture", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "Favorites", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
    ]
  },
  "This PC > Documents > Games": {
    content: [
      { name: "Chrome Dino", icon: "🦖", type: "Application", size: "145 MB" },
      { name: "Pinball", icon: "🎱", type: "Application", size: "234 MB" },
    ]
  },
  "This PC > Downloads": {
    content: [
      { name: "installer.exe", icon: "⚙️", type: "Application", size: "245 MB" },
      { name: "image.zip", icon: "📦", type: "ZIP Archive", size: "156 MB" },
    ]
  },
  "This PC > Pictures": {
    content: [
      { name: "Screenshot 2024", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "Wallpapers", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "vacation.jpg", icon: "🖼️", type: "JPEG Image", size: "2.5 MB" },
    ]
  },
  "This PC > Music": {
    content: [
      { name: "My Playlists", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "song1.mp3", icon: "🎵", type: "MP3 Audio", size: "5.2 MB" },
      { name: "song2.mp3", icon: "🎵", type: "MP3 Audio", size: "4.8 MB" },
    ]
  },
  "This PC > Videos": {
    content: [
      { name: "home_videos", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "—", isFolder: true },
      { name: "tutorial.mp4", icon: "🎬", type: "MP4 Video", size: "125 MB" },
    ]
  },
};
