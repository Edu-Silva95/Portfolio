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
      { name: "Desktop", icon: "🖥️", isFolder: true, size: "—" },
      {
        name: "Documents",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      { name: "Downloads", icon: "⬇️", isFolder: true, size: "—" },
      { name: "Pictures", icon: "🖼️", isFolder: true, size: "—" },
      { name: "Music", icon: "🎵", isFolder: true, size: "—" },
      { name: "Videos", icon: "🎬", isFolder: true, size: "—" },
    ],
    drives: [
      {
        name: "OS (C:)",
        icon: "💾",
        type: "Local Disk",
        size: "476 GB free of 512 GB",
        isFolder: true,
      },
      {
        name: "Local Disk (D:)",
        icon: "💾",
        type: "Local Disk",
        size: "189 GB free of 256 GB",
        isFolder: true,
      },
    ],
  },
  "This PC > Desktop": {
    content: desktopContent,
  },
  "This PC > Documents": {
    content: [
      {
        name: "Curriculum Vitae.pdf",
        icon: "/icons/pdf-file-format.ico",
        type: "PDF Document",
        size: "245 KB",
        isImage: true,
      },
      {
        name: "Presentation.pptx",
        icon: "📊",
        type: "PowerPoint",
        size: "1.2 MB",
      },
      {
        name: "Report.docx",
        icon: "/icons/notepad.ico",
        type: "Word Document",
        size: "89 KB",
      },
      {
        name: "Budget.xlsx",
        icon: "📈",
        type: "Excel Spreadsheet",
        size: "156 KB",
      },
      {
        name: "Games",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      {
        name: "Photos",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      {
        name: "Projects",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
    ],
  },
  "This PC > Documents > Projects": {
    content: [
      {
        name: "Course Projects",
        isFolder: true,
        icon: "/icons/icons8-folder-94.png",
      },
      {
        name: "Full-stack Projects",
        isFolder: true,
        icon: "/icons/icons8-folder-94.png",
      },
    ],
  },
  "This PC > Documents > Projects > Course Projects": {
    content: [
      {
        name: "Natours",
        type: "Folder",
        isOpenable: true,
        isFolder: true,
        icon: "/icons/icons8-folder-94.png",
      },
    ],
  },
  "This PC > Documents > Projects > Full-stack Projects": {
    content: [
      {
        name: "ShopListy",
        isFolder: true,
        isOpenable: true,
        isProject: true, 
        projectId: "shoplisty",
        icon: "/icons/icons8-folder-94.png",
      },
      {
        name: "Foodie",
        isFolder: true,
        isProject: true,
        projectId: "foodie",
        isOpenable: true,
        icon: "/icons/icons8-folder-94.png",
      },
      {
        name: "Chefie",
        isFolder: true,
        isProject: true,
        projectId: "chefie",
        isOpenable: true,
        icon: "/icons/icons8-folder-94.png",
      },
      {
        name: "Super Simple List",
        isFolder: true,
        isProject: true,
        projectId: "super-simple-list",
        isOpenable: true,
        icon: "/icons/icons8-folder-94.png",
      }
    ],
  },
  "This PC > Documents > Projects > Full-stack Projects > ShopListy": {
    content: [
      { name: "screenshot.png", icon: "🖼️", type: "PNG Image", size: "500 KB", isOpenable: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "2 KB", isOpenable: true },
      { name: "live_demo_link.txt", icon: "/icons/document.png", type: "Text Document", size: "1 KB", isOpenable: true },
    ],
  },
  "This PC > Documents > Projects > Full-stack Projects > Chefie": {
    content: [
      { name: "screenshot.png", icon: "🖼️", type: "PNG Image", size: "500 KB", isOpenable: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "2 KB", isOpenable: true },
      { name: "live_demo_link.txt", icon: "/icons/document.png", type: "Text Document", size: "1 KB", isOpenable: true },
    ],
  },
  "This PC > Documents > Projects > Full-stack Projects > Foodie": {
    content: [
      { name: "screenshot.png", icon: "🖼️", type: "PNG Image", size: "500 KB", isOpenable: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "2 KB", isOpenable: true },
      { name: "live_demo_link.txt", icon: "/icons/document.png", type: "Text Document", size: "1 KB", isOpenable: true },
    ],
  },
  "This PC > Documents > Projects > Full-stack Projects > Super Simple List": {
    content: [
      { name: "screenshot.png", icon: "🖼️", type: "PNG Image", size: "500 KB", isOpenable: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "2 KB", isOpenable: true },
      { name: "live_demo_link.txt", icon: "/icons/document.png", type: "Text Document", size: "1 KB", isOpenable: true },
    ],
  },
  "This PC > Documents > Photos": {
    content: [
      {
        name: "2024 Vacation",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      {
        name: "Family Events",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      {
        name: "Nature",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      {
        name: "Architecture",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      {
        name: "Favorites",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
    ],
  },
  "This PC > Documents > Games": {
    content: [
      { name: "Dino Game", icon: "🦖", type: "Application", size: "145 MB", isOpenable: true },
      { name: "Pinball", icon: "🎱", type: "Application", size: "234 MB", isOpenable: true },
    ],
  },
  "This PC > Downloads": {
    content: [
      {
        name: "installer.exe",
        icon: "⚙️",
        type: "Application",
        size: "245 MB",
      },
      { name: "image.zip", icon: "📦", type: "ZIP Archive", size: "156 MB" },
    ],
  },
  "This PC > Pictures": {
    content: [
      {
        name: "Screenshot 2024",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      {
        name: "Wallpapers",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      { name: "vacation.jpg", icon: "🖼️", type: "JPEG Image", size: "2.5 MB" },
    ],
  },
  "This PC > Music": {
    content: [
      {
        name: "My Playlists",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      { name: "song1.mp3", icon: "🎵", type: "MP3 Audio", size: "5.2 MB" },
      { name: "song2.mp3", icon: "🎵", type: "MP3 Audio", size: "4.8 MB" },
    ],
  },
  "This PC > Videos": {
    content: [
      {
        name: "home_videos",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
      },
      { name: "tutorial.mp4", icon: "🎬", type: "MP4 Video", size: "125 MB" },
    ],
  },
};
