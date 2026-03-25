import ProjectInfo from "../components/folder_styles/ProjectInfo";
import RecycleBin from "../components/folder_styles/RecycleBin";
import MyNotes from "../components/Folders/MyNotes";
import PDFViewer from "../components/folder_styles/PDFViewer";
import DOSWindow from "../components/DOOM/DOSWindow";
import Documents from "../components/Folders/Documents";
import ThisPC from "../components/Folders/ThisPC";
import ProjectsFolder from "../components/Folders/Projects";
import DinoWindow from "../components/ChromeDino/ChromeDino";
import Browser from "../components/Browser/Browser";
import YouTubeWindow from "../components/folder_styles/YoutubePlayer";
import ImagePlayerWindow from "../components/folder_styles/ImagePlayerWindow";
import { desktopIconsData } from "./desktopIcons";

export const windowsConfig = {
  projects: ProjectsFolder,
  about: ProjectInfo,
  recycle: RecycleBin,
  notes: MyNotes,
  readme: MyNotes,
  cv: PDFViewer,
  dino: DinoWindow,
  doom: DOSWindow,
  documents: Documents,
  thispc: ThisPC,
  photos: ThisPC,
  games: Documents,
  browser: Browser,
  youtube: YouTubeWindow,
  image: ImagePlayerWindow,
};

export const initialIcons = desktopIconsData.map((icon, idx) => ({
  ...icon,
  x: 1,
  y: 1 + idx * 96,
}));

// Derive windowIcons from initialIcons to avoid duplication
export const windowIcons = Object.fromEntries(
  initialIcons.map(({ id, icon }) => [id, icon])
);

// Taskbar icons for folder windows
windowIcons.documents = "/icons/icons8-folder-94.png";
windowIcons.thispc = "🖥️";
windowIcons.photos = "/icons/icons8-folder-94.png";
windowIcons.games = "/icons/icons8-folder-94.png";
windowIcons.notes = "/icons/notepad.ico";
windowIcons.readme = "/icons/notepad.ico";
windowIcons.cv = "/icons/pdf-file-format.ico";
windowIcons.dino = "🦖";
windowIcons.youtube = "/icons/youtube.png";
windowIcons.image = "/icons/player.png";