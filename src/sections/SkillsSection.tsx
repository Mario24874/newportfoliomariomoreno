import React from 'react';
import { motion } from 'framer-motion';
import { SKILL_CATEGORIES, LANGUAGE_SKILLS } from '@/data/portfolioData';
import { SkillCategory, SkillItem } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

const SkillPill: React.FC<{ skill: SkillItem }> = ({ skill }) => (
  <motion.span 
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="bg-blue-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-md hover:bg-blue-600 transition-all duration-200 cursor-default flex-shrink-0"
  >
    {skill.name}
  </motion.span>
);

const CategoryCard: React.FC<{ category: SkillCategory }> = ({ category }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="bg-gray-800/50 backdrop-blur-sm border border-white/10 p-4 sm:p-6 lg:p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-blue-500/30 h-full"
  >
    <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-blue-400 mb-3 sm:mb-4">{category.title}</h3>
    {category.description && <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">{category.description}</p>}
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {category.skills.map((skill) => (
        <SkillPill key={skill.name} skill={skill} />
      ))}
    </div>
  </motion.div>
);

const SkillsSection: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  
  return (
    <section id="skills" className="py-12 sm:py-16 lg:py-24 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-blue-400 mb-4 sm:mb-6">
            {t.skills.title}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
            {t.skills.description}
          </p>
        </div>
        
        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          {SKILL_CATEGORIES.map((category) => (
            <CategoryCard key={category.title} category={category} />
          ))}
        </div>

        {/* Language Skills - Full Width */}
        <div className="max-w-4xl mx-auto">
          <CategoryCard category={LANGUAGE_SKILLS} />
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;