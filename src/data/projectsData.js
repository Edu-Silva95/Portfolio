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
    tech: [
      "Ruby on Rails",
      "PostgreSQL",
      "JavaScript",
      "SCSS",
      "Fly.io",
      "Hotwire (Turbo + Stimulus)",
      "Devise",
    ],
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
      demo: "https://youtu.be/ZTr1KtXVHO4",
      repo: "https://github.com/Edu-Silva95/ShopListy",
      live: "shoplisty.space",
    },
  },
  {
    id: "chefie",
    name: "Chefie",
    tagline: "Recipe sharing platform",
    role: "Full-stack developer (solo project)",
    description:
      "Chefie is a full-stack recipe sharing platform where users can create, discover, and interact with recipes, courses, and community discussions. The project focuses on building a scalable social-style application using Rails, including authentication, content creation, and real-time UI updates with Hotwire. A key challenge was implementing persistent media storage using Cloudflare R2 to handle Fly.io’s ephemeral filesystem.",
    tech: [
      "Ruby on Rails 7",
      "PostgreSQL",
      "Hotwire (Turbo + Stimulus)",
      "SCSS",
      "Active Storage",
      "Cloudflare R2 (S3-compatible)",
      "Fly.io",
    ],
    features: [
      "Authentication & account management (Devise)",
      "Recipe system: create, browse, search, categorize, and rate recipes",
      "Favorites system with personalized user collections",
      "User-generated content: posts, courses (YouTube), and discussions",
      "Social interactions: likes (posts/courses/replies) and comments",
      "Communities: topics, threaded replies, and search",
      "Pagination and search across multiple resources",
      "Image uploads for avatars and recipes via Active Storage",
    ],
    highlights: [
      "Designed and built a full-stack social platform with Rails 7, modeling complex relationships (users, recipes, posts, communities, and interactions)",
      "Implemented cloud-based image storage using Cloudflare R2 to handle Fly.io’s ephemeral filesystem constraints",
      "Built scalable search and pagination across multiple resources using Kaminari",
      "Developed polymorphic associations for likes and interactions across different models",
      "Integrated Hotwire (Turbo/Stimulus) for dynamic UI updates without heavy frontend frameworks",
      "Handled production deployment challenges including background jobs, asset precompilation, and external storage integration",
      "Structured a modular Rails codebase with clean separation of concerns and reusable components",
    ],
    folderPath: "This PC > Documents > Projects > Full-Stack Projects > Chefie",
    links: {
      demo: "https://youtu.be/omJfPkr3jys",
      repo: "https://github.com/Edu-Silva95/Chefie",
      live: "https://chefie-dry-sound-571.fly.dev/",
    },
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
      demo: "",
      repo: "https://github.com/Edu-Silva95/Foodie",
      live: "",
    },
  },
  {
    id: "super-simple-list",
    name: "Super Simple List",
    tagline: "A minimal full-stack shopping list app with persistent data",
    description:
      "A full-stack web application that allows users to create and manage shopping lists, with persistent data stored in MongoDB.",
    tech: ["React", "TypeScript", "MongoDB", "CSS", "Vercel", "Render"],
    features: [
      "Full CRUD functionality for lists and items",
      "Dynamic item management within each list",
      "Persistent storage using MongoDB",
      "RESTful API built with Node.js and Express",
      "Deployed frontend and backend on separate platforms",
    ],
    highlights: [
      "Built and connected a full-stack architecture using a React frontend and Node.js/Express backend",
      "Handled asynchronous data flow between client and server",
      "Designed a clean and intuitive UI focused on usability",
      "Deployed and configured separate frontend and backend services using modern cloud platforms",
    ],
    folderPath:
      "This PC > Documents > Projects > Full-Stack Projects > Super Simple List",
    links: {
      demo: "https://youtu.be/wtA8UH3oBGM",
      repo: "https://github.com/Edu-Silva95/Super-Simple-List",
      live: "https://super-simple-list.vercel.app/",
    },
  },
  {
    id: "portfolio",
    name: "Portfolio",
    tagline: "Desktop-style interactive portfolio",
    description: [
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
      repo: "https://github.com/Edu-Silva95/Portfolio",
      live: "https://portfolio-hazel-psi-92.vercel.app/",
    },
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
