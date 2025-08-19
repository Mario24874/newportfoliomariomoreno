// src/sections/ProjectsSection.tsx

import React from 'react';
import { motion } from 'framer-motion';

// --- CORRECCIÓN: La importación ahora apunta al archivo correcto 'portfolioData' ---
// Estábamos buscando en 'projects.ts', que no existe. 
// Todos nuestros datos están en 'portfolioData.ts'.
import { getProjects } from '@/data/portfolioData';
import ProjectCard from '@/components/ui/ProjectCard';
import { Project } from '@/types'; // Importamos el tipo para asegurar que 'project' no sea 'any'
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const ProjectsSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const t = translations[language];
  const projects = getProjects(t);
  
  return (
    <section id="projects" className={`py-20 sm:py-24 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900/70' : 'bg-gray-100'
    }`}>
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-blue-400">
            {t.projects.title}
          </h2>
          <p className={`mt-4 text-lg max-w-2xl mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t.projects.description}
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
        >
          {projects.map((project: Project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectsSection;