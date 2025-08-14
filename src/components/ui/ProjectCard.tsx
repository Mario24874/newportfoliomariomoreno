// src/components/ui/ProjectCard.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { FaGithub } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import { Project } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

// --- NUEVO: Variante de animación para la tarjeta individual ---
// Define cómo debe animarse el componente al pasar de 'hidden' a 'visible'.
const cardVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.25, 0.25, 0.75]
    }
  },
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const { language } = useLanguage();
  const t = translations[language];
  return (
    // --- CAMBIO: Convertido en un 'motion.div' para aplicar la animación ---
    <motion.div
      variants={cardVariants}
      className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg hover:shadow-blue-500/20 transition-all duration-300 flex flex-col group"
    >
      <div className="overflow-hidden">
        <img 
          src={project.imageUrl} 
          alt={`${t.projects.screenshot} ${project.title}`} 
          className="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-blue-400 mb-2">{project.title}</h3>
        <p className="text-gray-300 text-sm mb-6 flex-grow">{project.description}</p>
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">{t.projects.technologies}</h4>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech: string) => (
              <span key={tech} className="bg-gray-700 text-blue-300 px-3 py-1 text-xs rounded-full font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center space-x-4">
          {project.liveUrl && project.liveUrl !== '#' && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-gray-200 hover:text-blue-400 transition-colors font-semibold"
            >
              <FiExternalLink className="mr-2 h-4 w-4" /> {t.projects.liveDemo}
            </a>
          )}
          {project.repoUrl && project.repoUrl !== '#' && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-gray-200 hover:text-blue-400 transition-colors font-semibold"
            >
              <FaGithub className="mr-2 h-4 w-4" /> {t.projects.viewCode}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;