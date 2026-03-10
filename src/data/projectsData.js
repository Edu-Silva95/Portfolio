export const projectsData = [
  {
    id: "shoplisty",
    name: "ShopListy",
    tagline: "Full-stack shopping list web app",
    role: "Full-stack developer (solo project);",
    description: [
      "ShopListy is a full-stack web application that allows users to create accounts, authenticate securely, and manage personalized shopping lists.",
      "Users can create, edit, and organize multiple lists while keeping their data isolated and persistent.",
      "The application includes a friend system and integrated chat, allowing users to collaborate and communicate while organizing their shopping.",
      "The backend was built with Ruby on Rails and PostgreSQL, providing structured data persistence and secure user authentication.",
      "The frontend uses HTML, SCSS, and JavaScript to deliver a simple and responsive user interface.",
    ],
    tech: ["Ruby on Rails", "PostgreSQL", "JavaScript", "SCSS", "Fly.io"],
    features: [
      "User account registration and authentication",
      "Map showing the 5 closest supermarkets based on the user's location",
      "Friend system for connecting users",
      "Admin dashboard for managing users",
      "User profile management with profile picture upload",
      "Integrated chat functionality",
      "Personalized shopping list management",
      "Add, edit, and delete lists and items",
      "Persistent user data with PostgreSQL",
      "Full-stack architecture built with Ruby on Rails",
      "Mobile-responsive design for seamless use on various devices",
    ],
    highlights: [
      "Authentication system implemented with Devise",
      "RESTful Rails application architecture",
      "Relational database design using PostgreSQL",
      "Geolocation-based supermarket search",
      "Deployed to Fly.io",
    ],
    folderPath:
      "This PC > Documents > Projects > Full-Stack Projects > ShopListy",
    links: {
      live: "",
      repo: "https://github.com/Edu-Silva95/ShopListy",
      link: "shoplisty.space",
    },
    screenshots: [],
  },
  {
    id: "chefie",
    name: "Chefie",
    tagline: "Recipe sharing platform",
    role: "Full-stack developer (solo project)",
    description:
      "This is my second solo project as a junior developer, created to try and use cleaner code I learnt from the courses I attended. Designed and coded by me. It's a recipe web-site where people can create an account, share recipes, share videos/courses teaching recipes. Many features included, here are a few: Create Account, change password, delete account. Like functionality. Comment functionality. Share recipes and video/courses which can also be deleted by the user that made the post. Report functionality. Change the user picture. Feed system. Topics/Discussions. Favorite fucntionality. Search functionality",
    tech: ["Ruby on Rails", "SCSS", "PostgreSQL", "JavaScript"],
    folderPath: "This PC > Documents > Projects > Full-Stack Projects > Chefie",
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
      'Foodie is a project I made on my own as a challenge made by the tutor to try to build this ourselves. Built using React and Node.js as backend. Built for "React - The Complete Guide 2025 (incl. Next.js, Redux)" - Udemy Course, it\'s in this folder because I built it myself had a few assets, and some backend code that I changed and upated.',
    tech: ["React.js", "Node.js", "Tailwind CSS"],
    folderPath: "This PC > Documents > Projects > Full-Stack Projects > Foodie",
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
    folderPath:
      "This PC > Documents > Projects > Full-Stack Projects > Super Simple List",
    links: {
      live: "",
      repo: "https://github.com/Edu-Silva95/Super-Simple-List",
      link: "https://super-simple-list.vercel.app/newlist",
    },
    screenshots: [],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    tagline: "Desktop-style interactive portfolio",
    description:[
      "An interactive portfolio that mimics a Windows desktop experience: icons, folders, a taskbar, and multi-window apps.",
      "Built with React + Vite and styled with Tailwind CSS.",
      "The structure is data-driven, so I can add projects and content by updating configuration instead of rewriting UI logic.", 
      "Deployed on Vercel and iterated continuously as I polish the UX.",
    ],
    tech: [
      "React.js",
      "Vite",
      "JavaScript",
      "Tailwind CSS",
      "react-rnd",
      "js-dos",
      "Vercel",
    ],
    features: [
      "Window manager with focus and z-index (open/close/focus)",
      "Desktop grid with shortcuts, folders, and a taskbar",
      "Right-click context menus and mouse interactions",
      "Data-driven file system that maps folders/files to windows",
      "Responsive layout with ongoing UX polish",
    ],
    highlights: [
      "Reusable UI primitives (windows, icons, menus) powering the whole experience",
      "Architecture designed to scale: add new content via config/data",
      "Deployed on Vercel with a fast Vite build and iterative improvements",
    ],
    folderPath:
      "This PC > Documents > Projects > Front-End Projects > Portfolio",
    links: {
      live: "",
      repo: "https://github.com/Edu-Silva95/Portfolio",
      link: "https://portfolio-hazel-psi-92.vercel.app/",
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
