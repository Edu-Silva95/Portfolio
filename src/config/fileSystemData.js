import { desktopIconsData } from "./desktopIcons";
import { getProjectById } from "../data/projectsData";

const desktopContent = desktopIconsData.map((icon) => {
  const isFolder = !!icon.isFolder;
  const type = icon.type ?? (isFolder ? "File folder" : "Shortcut");
  const size = icon.size ?? (isFolder ? "—" : "1 KB");

  return {
    id: icon.id,
    name: icon.label,
    icon: icon.icon,
    type,
    size,
    isFolder,
    isOpenable: true,
    url: icon.url,
    targetId: icon.targetId,
    targetWindowId: icon.targetWindowId,
    targetPath: icon.targetPath,
  };
});

// Project URL helper functions
const getProjectPreferredUrl = (projectId) => {
  const project = getProjectById(projectId);
  const links = project?.links || {};
  return links.live || links.link || links.repo || "";
};

const projectUrlItem = (projectId) => {
  const project = getProjectById(projectId);
  const url = getProjectPreferredUrl(projectId);
  if (!url) return [];
  return [
    {
      id: `${projectId}-live-url`,
      name: project?.name ? `${project.name} Live Site.url` : "Live Site.url",
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
        isOpenable: true,
        targetWindowId: "cv",
      },
      {
        name: "Games",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "238 MB",
        type: "Folder",
      },
      {
        name: "Photos",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
        type: "Folder",
      },
      {
        name: "Projects",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "4.40 GB",
        type: "Folder",
      },
    ],
  },
  "This PC > Documents > Projects": {
    content: [
      {
        name: "Full-Stack Projects",
        isFolder: true,
        icon: "/icons/icons8-folder-94.png",
        size: "—",
        type: "Folder",
      },
      {
        name: "Front-End Projects",
        isFolder: true,
        icon: "/icons/icons8-folder-94.png",
        size: "—",
        type: "Folder",
      },
      {  
        name: "Course Projects",
        isFolder: true,
        icon: "/icons/icons8-folder-94.png",
        size: "—",
        type: "Folder",
      },
      {
        name: "GitHub Profile.url",
        icon: "/icons/github.png",
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
        size: "—",
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
        size: "—",
      },
      {
        name: "Chefie",
        isFolder: true,
        isProject: true,
        projectId: "chefie",
        isOpenable: true,
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "—",
      },
      {
        name: "Foodie",
        isFolder: true,
        isProject: true,
        projectId: "foodie",
        isOpenable: true,
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "—",
      },
      {
        name: "Super Simple List",
        isFolder: true,
        isProject: true,
        projectId: "super-simple-list",
        isOpenable: true,
        icon: "/icons/icons8-folder-94.png",
        type: "Folder",
        size: "—",
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
      { name: "Screenshots", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "8.04 MB", isOpenable: true, isFolder: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "5 MB", isOpenable: true, projectId: "shoplisty", projectVirtualKind: "readme" },
      { name: "ShopListy_Live_Demo.mp4", icon: "/icons/youtube.png", type: "Video", size: "78.9 MB", isOpenable: true, projectId: "shoplisty", projectVirtualKind: "demo" },
      { name: "ShopListy_Repo.url", icon: "/icons/github.png", type: "URL", size: "1 KB", isOpenable: true, url: ("https://github.com/Edu-Silva95/ShopListy") },
      ...projectUrlItem("shoplisty"),
    ],
  },
   "This PC > Documents > Projects > Full-Stack Projects > ShopListy > Screenshots": {
    content: [
      { name: "Login.png", icon: "/projects/shoplisty/LogIn_page.PNG", path: "/projects/shoplisty/LogIn_page.PNG", type: "PNG Image", size: "904 KB", isOpenable: true },
      { name: "Homepage.png", icon: "/projects/shoplisty/Homepage.PNG", path: "/projects/shoplisty/Homepage.PNG", type: "PNG Image", size: "1.48 MB", isOpenable: true },
      { name: "Closest_Supermarkets.png", icon: "/projects/shoplisty/5closest_places.PNG", path: "/projects/shoplisty/5closest_places.PNG", type: "PNG Image", size: "952 KB", isOpenable: true },
      { name: "Categories.png", icon: "/projects/shoplisty/Category_page.PNG", path: "/projects/shoplisty/Category_page.PNG", type: "PNG Image", size: "988 KB", isOpenable: true },
      { name: "Cart_page.png", icon: "/projects/shoplisty/Cart_page.PNG", path: "/projects/shoplisty/Cart_page.PNG", type: "PNG Image", size: "852 KB", isOpenable: true },
      { name: "List_Management.png", icon: "/projects/shoplisty/List_Management_page.PNG", path: "/projects/shoplisty/List_Management_page.PNG", type: "PNG Image", size: "720 KB", isOpenable: true },
      { name: "List_View.png", icon: "/projects/shoplisty/List_View_page.PNG", path: "/projects/shoplisty/List_View_page.PNG", type: "PNG Image", size: "776 KB", isOpenable: true },
      { name: "Messages_page.png", icon: "/projects/shoplisty/Messages_page.PNG", path: "/projects/shoplisty/Messages_page.PNG", type: "PNG Image", size: "460 KB", isOpenable: true },
      { name: "Chat_page.png", icon: "/projects/shoplisty/Chat_page.PNG", path: "/projects/shoplisty/Chat_page.PNG", type: "PNG Image", size: "1.04 MB", isOpenable: true },
    ],  
  },
  "This PC > Documents > Projects > Full-Stack Projects > Chefie": {
    content: [
      { name: "Screenshots", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "2.80 MB", isOpenable: true, isFolder: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "5 MB", isOpenable: true, projectId: "chefie", projectVirtualKind: "readme" },
      { name: "Chefie_Live_Demo.mp4", icon: "/icons/youtube.png", type: "Video", size: "42.6 MB", isOpenable: true, projectId: "chefie", projectVirtualKind: "demo" },
      { name: "Chefie_Repo.url", icon: "/icons/github.png", type: "URL", size: "1 KB", isOpenable: true, url: "https://github.com/Edu-Silva95/Chefie" },
      ...projectUrlItem("chefie"),
    ],
  },
  "This PC > Documents > Projects > Full-Stack Projects > Chefie > Screenshots": {
    content: [
      { name: "Chefie_Landing_Page.png", icon: "/projects/chefie/landing_page.PNG", path: "/projects/chefie/landing_page.PNG", type: "PNG Image", size: "192 KB", isOpenable: true },
      { name: "Chefie_Home_Page.png", icon: "/projects/chefie/homepage.PNG", path: "/projects/chefie/homepage.PNG", type: "PNG Image", size: "750 KB", isOpenable: true },
      { name: "Chefie_Home_Bottom_Page.png", icon: "/projects/chefie/homepage_bottom.png", path: "/projects/chefie/homepage_bottom.png", type: "PNG Image", size: "357 KB", isOpenable: true },
      { name: "Chefie_Recipe_Page.png", icon: "/projects/chefie/recipe_page.png", path: "/projects/chefie/recipe_page.png", type: "PNG Image", size: "293 KB", isOpenable: true },
      { name: "Chefie_Recipe_Bottom_Page.png", icon: "/projects/chefie/recipe_page_bottom.png", path: "/projects/chefie/recipe_page_bottom.png", type: "PNG Image", size: "345 KB", isOpenable: true },
      { name: "Chefie_New_Recipe_Page.png", icon: "/projects/chefie/new_recipe_page.png", path: "/projects/chefie/new_recipe_page.png", type: "PNG Image", size: "40.3 KB", isOpenable: true },
      { name: "Chefie_Favorites_Page.png", icon: "/projects/chefie/favorites_page.png", path: "/projects/chefie/favorites_page.png", type: "PNG Image", size: "264 KB", isOpenable: true },
      { name: "Chefie_Courses_&_Feed_Page.png", icon: "/projects/chefie/courses_&_feed.png", path: "/projects/chefie/courses_&_feed.png", type: "PNG Image", size: "264 KB", isOpenable: true },
      { name: "Chefie_Courses_&_Feed_Bottom_Page.png", icon: "/projects/chefie/courses_&_feed_bottom.png", path: "/projects/chefie/courses_&_feed_bottom.png", type: "PNG Image", size: "183 KB", isOpenable: true },
      { name: "Chefie_Community_Page.png", icon: "/projects/chefie/community_page.png", path: "/projects/chefie/community_page.png", type: "PNG Image", size: "50.1 KB", isOpenable: true },
      { name: "Chefie_New_Community_Page.png", icon: "/projects/chefie/new_community_page.png", path: "/projects/chefie/new_community_page.png", type: "PNG Image", size: "49.5 KB", isOpenable: true },
      { name: "Chefie_Forum_Page.png", icon: "/projects/chefie/forum_page.png", path: "/projects/chefie/forum_page.png", type: "PNG Image", size: "52.4 KB", isOpenable: true },
    ],
  },
  "This PC > Documents > Projects > Full-Stack Projects > Foodie": {
    content: [
      { name: "screenshot.png", icon: "/icons/image.png", type: "PNG Image", size: "15 MB", isOpenable: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "3 MB", isOpenable: true, projectId: "foodie", projectVirtualKind: "readme" },
      { name: "Foodie_Live_Demo.mp4", icon: "/icons/youtube.png", type: "Video", size: "1 GB", isOpenable: true, projectId: "foodie", projectVirtualKind: "demo" },
      { name: "Foodie_Repo.url", icon: "/icons/github.png", type: "URL", size: "1 KB", isOpenable: true, url: "https://github.com/Edu-Silva95/Foodie" },
      ...projectUrlItem("foodie"),
    ],
  },
  "This PC > Documents > Projects > Full-Stack Projects > Super Simple List": {
    content: [
      { name: "Screenshots", icon: "/icons/icons8-folder-94.png", type: "Folder", size: "1.15 MB", isOpenable: true, isFolder: true },
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "3 MB", isOpenable: true, projectId: "super-simple-list", projectVirtualKind: "readme" },
      { name: "Super Simple List_Live_Demo.mp4", icon: "/icons/youtube.png", type: "Video", size: "5.31 MB", isOpenable: true, projectId: "super-simple-list", projectVirtualKind: "demo" },
      { name: "Super Simple List_Repo.url", icon: "/icons/github.png", type: "URL", size: "1 KB", isOpenable: true, url: "https://github.com/Edu-Silva95/Super-Simple-List" },
      ...projectUrlItem("super-simple-list"),
    ],
  },
   "This PC > Documents > Projects > Full-Stack Projects > Super Simple List > Screenshots": {
    content: [
      { name: "HomePage.png", icon: "/projects/SuperSimpleList/HomePage.png", path: "/projects/SuperSimpleList/HomePage.png", type: "PNG Image", size: "164 KB", isOpenable: true },
      { name: "Create New List.png", icon: "/projects/SuperSimpleList/CreateNewList.png", path: "/projects/SuperSimpleList/CreateNewList.png", type: "PNG Image", size: "164 KB", isOpenable: true },
      { name: "Add Product.png", icon: "/projects/SuperSimpleList/AddProduct.png", path: "/projects/SuperSimpleList/AddProduct.png", type: "PNG Image", size: "168 KB", isOpenable: true },
      { name: "List Preview.png", icon: "/projects/SuperSimpleList/ListPreview.png", path: "/projects/SuperSimpleList/ListPreview.png", type: "PNG Image", size: "140 KB", isOpenable: true },
      { name: "List Page.png", icon: "/projects/SuperSimpleList/ListPage.png", path: "/projects/SuperSimpleList/ListPage.png", type: "PNG Image", size: "168 KB", isOpenable: true },
      { name: "Update List.png", icon: "/projects/SuperSimpleList/UpdateList.png", path: "/projects/SuperSimpleList/UpdateList.png", type: "PNG Image", size: "376 KB", isOpenable: true },
    ],
  },
  // Front-end projects with a custom icon and an image file.
  "This PC > Documents > Projects > Front-End Projects > Portfolio": {
    content: [
      { name: "README.txt", icon: "/icons/document.png", type: "Text Document", size: "4 MB", isOpenable: true, projectId: "portfolio", projectVirtualKind: "readme" },
      ...projectUrlItem("portfolio"),
    ],
  },
  "This PC > Documents > Photos": {
    content: [
      {
        name: "Favorites",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
        type: "Folder",
      },
    ],
  },
  "This PC > Documents > Games": {
    content: [
      { name: "Dino Game", icon: "🦖", type: "Application", size: "1.5 MB", isOpenable: true, targetWindowId: "dino" },
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
        type: "Folder",
      },
      {
        name: "Wallpapers",
        icon: "/icons/icons8-folder-94.png",
        isFolder: true,
        size: "—",
        type: "Folder",
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
        type: "Folder",
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
        type: "Folder",
      },
      { name: "tutorial.mp4", icon: "🎬", type: "MP4 Video", size: "125 MB" },
    ],
  },
};
