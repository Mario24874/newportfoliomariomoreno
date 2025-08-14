import { NavItem, SkillCategory, Project } from '@/types';

export const NAV_ITEMS: NavItem[] = [
  { name: 'About', href: '#about', key: 'about' },
  { name: 'Skills', href: '#skills', key: 'skills' },
  { name: 'Projects', href: '#projects', key: 'projects' },
  { name: 'AI Demos', href: '#demos', key: 'demos' },
  { name: 'Mobile Apps', href: '#mobile-apps', key: 'apps' },
  { name: 'Contact', href: '#contact', key: 'contact' },
];

// 💪 SKILLS SECTION - Easy to customize
// You can add, remove, or modify skill categories and individual skills
// Simply edit the arrays below to match your expertise

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    title: 'Programming Languages',
    skills: [
      { name: 'HTML' }, { name: 'CSS' }, { name: 'JavaScript' }, { name: 'TypeScript' },
      { name: 'Java' }, { name: 'Python' }, { name: 'C' }, { name: 'C++' },
      { name: 'C#' }, { name: 'PHP' }, { name: 'SQL' },
    ],
  },
  {
    title: 'APIs & Frameworks',
    skills: [
      { name: 'React.JS' }, { name: 'Angular.JS' }, { name: 'Vue.JS' }, 
      { name: 'Node.js (Express.JS)' }, { name: 'Spring Boot (Java)' }, { name: 'Django REST (Python)' }, 
      { name: 'Flask (Python)' }, { name: 'Web2py (Python)' }, { name: 'Symfony (PHP)' }, { name: 'Laravel (PHP)' },
      { name: 'ASP.NET Core' }, { name: 'ADO.NET' }, { name: 'Ruby on Rails' }, { name: 'Sinatra (Ruby)'},
      { name: 'Slim (PHP)' }, { name: 'Nancy (.NET)'}, { name: 'Play Framework (Java)'}
    ],
  },
  {
    title: 'Development & Operations',
    skills: [
      { name: 'Software Management & IDEs' }, { name: 'Web Development' }, { name: 'Multiplatform Mobile Apps' },
      { name: 'Version Control (Git)' }, { name: 'Container Management (Docker)' },
      { name: 'Orchestration (Kubernetes)' }, { name: 'Server Management' }, { name: 'Database Management' },
      { name: 'Cloud Services (AWS, Azure, GCP)' },
    ],
  },
  {
    title: 'Automation & AI',
    skills: [
      { name: 'n8n' }, { name: 'Flowise' }, { name: 'Make (Integromat)' }, { name: 'Conversational Agents' },
      { name: 'Chatbots' }, { name: 'Virtual Assistants' }, { name: 'AI Integration' }
    ],
  },
  {
    title: 'Business & Marketing',
    skills: [
      { name: 'SEO (Search Engine Optimization)' }, { name: 'ERP (Enterprise Resource Planning)' },
      { name: 'Social Media Management' },
    ],
  },
  {
    title: 'Soft & Organizational Skills',
    skills: [
      { name: 'Problem Solving' }, { name: 'Teamwork & Collaboration' }, { name: 'Human Resources Management' },
      { name: 'Occupational Risk Prevention' }, { name: 'Agile Methodologies (Scrum, Kanban)' },
    ],
  },
];

export const LANGUAGE_SKILLS: SkillCategory = {
  title: 'Language Proficiency',
  skills: [
    { name: 'Spanish (Native)' },
    { name: 'English (Intermediate)' },
    { name: 'Italian (Intermediate)' },
  ],
};

// 💼 PROJECTS SECTION - Easy to update and replace
// To add a new project, copy the template below and fill in your information
// To remove a project, delete the entire object from the array
// To change project order, simply reorder the objects in the array

export const PROJECTS: Project[] = [
  {
    id: 'proj1', // ✏️ Unique identifier
    title: 'Italianto', // ✏️ Project title
    description: 'We developed a complete platform for learning Italian language and culture, with tutorials, exercises, online classes and AI tutors.', // ✏️ Project description
    technologies: ['React', 'Node.js', 'TypeScript', 'Python (for AI)', 'n8n', 'PostgreSQL', 'Docker'], // ✏️ Technologies used
    imageUrl: '/images/logo_Italianto.png', // ✏️ Replace with your project image URL
    liveUrl: '#', // ✏️ Replace with live demo URL or remove if not available
    repoUrl: '#', // ✏️ Replace with repository URL or remove if not available
  },
  {
    id: 'proj2',
    title: 'Antyquim',
    description: 'Built a scalable e-commerce website with features like product listings, shopping cart, user authentication, and payment gateway integration. Focused on SEO optimization and responsive design.',
    technologies: ['Vue.js', 'Symfony (PHP)', 'MySQL', 'Stripe API', 'Tailwind CSS'],
    imageUrl: '/images/LogoAntyquimRSF.png',
    liveUrl: '#',
    // repoUrl: '#', // ℹ️ You can comment out or remove liveUrl/repoUrl if not needed
  },
  {
    id: 'proj3',
    title: 'UrbanDrive',
    description: 'Created a cross-platform mobile application for enterprise task management using React Native. Features include real-time collaboration, notifications, and offline capabilities.',
    technologies: ['React', 'Firebase', 'TypeScript', 'Jest'],
    imageUrl: '/images/UrbanDrive.png',
    repoUrl: '#',
  },
  {
    id: 'proj4',
    title: 'EduManager',
    description: 'Designed and implemented a web-based dashboard for visualizing and analyzing large datasets, leveraging cloud services for processing and storage. Used D3.js for complex visualizations.',
    technologies: ['Angular', 'Spring Boot (Java)', 'AWS (S3, Redshift)', 'D3.js', 'REST APIs'],
    imageUrl: '/images/LogoEduManager.jpeg',
    liveUrl: '#',
  },
  // ➕ TO ADD A NEW PROJECT, copy the template below:  
  {
    id: 'proj5', 
    title: 'BlogIT',
    description: 'Your project description here...',
    technologies: ['React', 'Node.js', 'TypeScript', 'Python (for AI)', 'n8n', 'PostgreSQL', 'Docker'],
    imageUrl: '/images/BlogIT.jpeg',
    liveUrl: 'https://your-live-demo.com', // Optional
    repoUrl: 'https://github.com/your-repo', // Optional
  },
  {
    id: 'proj6',
    title: 'Next Code Solutions',
    description: 'Your project description here...',
    technologies: ['React', 'Node.js', 'TypeScript', 'Python (for AI)', 'n8n', 'PostgreSQL', 'Docker'],
    imageUrl: '/images/NextCodeSolutions.jpeg',
    liveUrl: 'https://your-live-demo.com', // Optional
    repoUrl: 'https://github.com/your-repo', // Optional
  },
];

// 🔧 EASY CONFIGURATION - Update these values to customize your portfolio
// Simply replace the placeholder values with your actual information

export const YOUR_NAME = "Mario Moreno";
export const YOUR_TITLE = "AI Developer & Innovation Engineer";
export const YOUR_WHATSAPP_NUMBER = "+584145364657"; // Número actualizado
export const YOUR_EMAIL = "marioivanmorenopineda@gmail.com"; // Email corregido
export const YOUR_LINKEDIN_URL = "https://www.linkedin.com/in/mario-moreno-9916043b"; // Update with real LinkedIn
export const YOUR_GITHUB_URL = "https://github.com/Mario24874"; // Update with real GitHub

// Additional profile information
export const YOUR_DESCRIPTION = "Specialist in creating modern web applications, automation, and AI solutions that generate real impact.";
export const YOUR_LOCATION = "Remote / Global";
export const YOUR_PHONE = "+1234567890"; // Update with real phone