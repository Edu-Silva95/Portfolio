import { desktopIconsData } from "./desktopIcons";
import { getProjectById } from "../data/projectsData";

const desktopContent = desktopIconsData.map((icon) => ({
  id: icon.id,
  name: icon.label,
  icon: icon.icon,
  type: icon.isFolder ? "Folder" : "Shortcut",
  size: icon.isFolder ? "—" : "1 KB",
  isFolder: !!icon.isFolder,
  isOpenable: true,
}));

// Project URL helper functions
const getProjectPreferredUrl = (projectId) => {
  const project = getProjectById(projectId);
  const links = project?.links || {};
  return links.link || links.live || links.repo || "";
};

const projectUrlItem = (projectId) => {
  const project = getProjectById(projectId);
  const url = getProjectPreferredUrl(projectId);
  if (!url) return [];
  return [
    {
      name: project?.name || "Project",
      icon: "/icons/url.png",
      type: "URL",
      size: "1 KB",
      isOpenable: true,
      url,
    },
  ];
};

export const pathMap = {
  "This PC": {
    folders: [
      { name: "Desktop", icon: "🖥️", isFolder: true, size: "1.2 MB", type: "System Folder" },
      {
        name: "Documents",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "6 GB",
        type: "Folder",
      },
      { name: "Downloads", icon: "⬇️", isFolder: true, size: "301 MB", type: "System Folder" },
      { name: "Pictures", icon: "🖼️", isFolder: true, size: "15 MB", type: "System Folder" },
      { name: "Music", icon: "🎵", isFolder: true, size: "20 MB" , type: "System Folder"},
      { name: "Videos", icon: "🎬", isFolder: true, size: "357 MB" , type: "System Folder"},
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
        name: "Curriculum_Vitae_2026.pdf",
        icon: "/icons/pdf-file-format.ico",
        type: "PDF Document",
        size: "245 KB",
        isImage: true,
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
        name: "Full-Stack Projects",
        isFolder: true,
        icon: "/icons/icons8-folder-94.png",
        size: "3.9 GB",
        type: "Folder",
      },
      {
        name: "Front-End Projects",
        isFolder: true,
        icon: "/icons/icons8-folder-94.png",
        size: "125 MB",
        type: "Folder",
      },
      {  
        name: "Course Projects",
        isFolder: true,
        icon: "/icons/icons8-folder-94.png",
        size: "345 MB",
        type: "Folder",
      },
      {
        name: "GitHub Profile.url",
        icon: "/icons/url.png",
        type: "URL",
        size: "1 KB",
        isOpenable: true,
        url: "https://github.com/Edu-Silva95",
      }
    ],
  },
  "This PC > Documents > Projects > Front-End Projects": {
    content: [
      {
        name: "Portfolio",
        type: "Folder",
        isOpenable: true,
        isFolder: true,
        icon: "/icons/icons8-folder-94.png",
      },
    ],
  },
  "This PC > Documents > Projects > Full-Stack Projects": {
    content: [
      {
        name: "ShopListy",
        isFolder: true,
        isOpenable: true,
        isProject: true, 
        projectId: "shoplisty",
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "1.8 GB",
      },
      {
        name: "Chefie",
        isFolder: true,
        isProject: true,
        projectId: "chefie",
        isOpenable: true,
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "890 MB",
      },
      {
        name: "Foodie",
        isFolder: true,
        isProject: true,
        projectId: "foodie",
        isOpenable: true,
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "674 MB",
      },
      {
        name: "Super Simple List",
        isFolder: true,
        isProject: true,
        projectId: "super-simple-list",
        isOpenable: true,
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "512 MB",
      }
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
        size: "345 MB",
      },
    ],
  },
  // Full-stack projects with a custom icon and an image file in each folder.
  "This PC > Documents > Projects > Full-Stack Projects > ShopListy": {
    content: [
      { name: "screenshot.png", icon: "/icons/image.png", type: "PNG Image", size: "500 KB", isOpenable: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "5 MB", isOpenable: true },
      { name: "ShopListy_Live_Demo.mp4", icon: "/icons/youtube.png", type: "Video", size: "1 KB", isOpenable: true },
      ...projectUrlItem("shoplisty"),
    ],
  },
  "This PC > Documents > Projects > Full-Stack Projects > Chefie": {
    content: [
      { name: "screenshot.png", icon: "/icons/image.png", type: "PNG Image", size: "15 MB", isOpenable: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "5 MB", isOpenable: true },
      { name: "Chefie_Live_Demo.mp4", icon: "/icons/youtube.png", type: "Video", size: "1.2 GB", isOpenable: true },
      ...projectUrlItem("chefie"),
    ],
  },
  "This PC > Documents > Projects > Full-Stack Projects > Foodie": {
    content: [
      { name: "screenshot.png", icon: "/icons/image.png", type: "PNG Image", size: "15 MB", isOpenable: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "3 MB", isOpenable: true },
      { name: "Foodie_Live_Demo.mp4", icon: "/icons/youtube.png", type: "Video", size: "1 GB", isOpenable: true },
      ...projectUrlItem("foodie"),
    ],
  },
  "This PC > Documents > Projects > Full-Stack Projects > Super Simple List": {
    content: [
      { name: "screenshot.png", icon: "/icons/image.png", type: "PNG Image", size: "500 KB", isOpenable: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "3 MB", isOpenable: true },
      { name: "Super Simple List_Live_Demo.mp4", icon: "/icons/youtube.png", type: "Video", size: "874 MB", isOpenable: true },
      ...projectUrlItem("super-simple-list"),
    ],
  },
  // Front-end projects with a custom icon and an image file.
  "This PC > Documents > Projects > Front-End Projects > Portfolio": {
    content: [
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "4 MB", isOpenable: true },
      ...projectUrlItem("portfolio"),
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
      { name: "Dino Game", icon: "🦖", type: "Application", size: "1.5 MB", isOpenable: true },
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
