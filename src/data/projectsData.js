export const projectsData = [
  {
    id: "shoplisty",
    name: "ShopListy",
    tagline: "Shopping list app",
    description:
      "The first project I built myself after learning web development. A shopping list application with user creation, authentication, personalized lists and a many more features. Built with Ruby on Rails for the backend and SCSS, JavaScript and HTML for the frontend.",
    tech: ["Ruby on Rails", "SCSS", "PostgreSQL", "JavaScript"],
    folderPath:
      "This PC > Documents > Projects > Full-stack Projects > ShopListy",
    links: {
      live: "",
      repo: "https://github.com/Edu-Silva95/ShopListy",
      link: "www.shoplisty.space",
    },
    screenshots: [],
  },
{
  id: "chefie",
  name: "Chefie",
  tagline: "Recipe sharing platform",
  description:
    "This is my second solo project as a junior developer, created to try and use cleaner code I learnt from the courses I attended. Designed and coded by me. It's a recipe web-site where people can create an account, share recipes, share videos/courses teaching recipes. Many features included, here are a few: Create Account, change password, delete account. Like functionality. Comment functionality. Share recipes and video/courses which can also be deleted by the user that made the post. Report functionality. Change the user picture. Feed system. Topics/Discussions. Favorite fucntionality. Search functionality",
  tech: ["Ruby on Rails", "SCSS", "PostgreSQL", "JavaScript"],
    folderPath: "This PC > Documents > Projects > Full-stack Projects > Chefie",
    links: {
      live: "",
      repo: "https://github.com/Edu-Silva95/Chefie",
    },
    screenshots: [],
  },
  {
    id: "foodie",
    name: "Foodie",
    tagline: "Food ordering UI",
    description:
      "Foodie is a project I made on my own as a challenge made by the tutor to try to build this ourselves. Built using React and Node.js as backend. Built for \"React - The Complete Guide 2025 (incl. Next.js, Redux)\" - Udemy Course, it's in this folder because I built it myself had a few assets, and some backend code that I changed and upated.",
    tech: ["React.js", "Node.js", "Tailwind CSS"],
    folderPath: "This PC > Documents > Projects > Full-stack Projects > Foodie",
    links: {
      live: "",
      repo: "https://github.com/Edu-Silva95/Foodie",
    },
    screenshots: [],
  },
   {
    id: "super-simple-list",
    name: "Super Simple List",
    tagline: "Simple shopping list app",
    description:
      "A Full-Stack web app using MongoDB. A simple grocery list app where the user can add and remove items.",
    tech: ["React.js", "Typescript", "MongoDB", "Vercel", "CSS"],
    folderPath: "This PC > Documents > Projects > Full-stack Projects > Super Simple List",
    links: {
      live: "",
      repo: "https://github.com/Edu-Silva95/Super-Simple-List",
      link: "https://super-simple-list.vercel.app/newlist"
    },
    screenshots: [],
  },
];

export const projectsById = Object.fromEntries(
  projectsData.map((p) => [p.id, p]),
);

export const projectsByFolderPath = Object.fromEntries(
  projectsData
    .filter((p) => typeof p.folderPath === "string" && p.folderPath.trim())
    .map((p) => [p.folderPath, p]),
);

export function getProjectById(projectId) {
  if (!projectId) return null;
  return projectsById[projectId] || null;
}

export function getProjectByFolderPath(folderPath) {
  if (!folderPath) return null;
  return projectsByFolderPath[folderPath] || null;
}
