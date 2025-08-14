import React from 'react';
import { YOUR_NAME } from '@/data/portfolioData';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

const AboutSection: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  return (
    <section id="about" className="py-16 sm:py-24 bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-blue-400">{t.about.title}</h2>
          <p className="mt-4 text-lg text-gray-300">{t.about.subtitle}</p>
        </div>
        <div className="max-w-3xl mx-auto bg-gray-900 p-6 sm:p-8 rounded-xl shadow-2xl">
          <div className="flex flex-col md:flex-row items-center md:space-x-8">
            <div className="md:w-1/3 mb-6 md:mb-0">
              <img 
                src={`https://picsum.photos/seed/${YOUR_NAME.replace(/\s+/g, '')}/300/300`} 
                alt={YOUR_NAME} 
                className="rounded-full shadow-lg mx-auto w-48 h-48 sm:w-56 sm:h-56 object-cover border-4 border-blue-500"
              />
            </div>
            <div className="md:w-2/3 text-gray-300">
              <p className="mb-4 text-lg">
                {t.about.greeting} <span className="font-semibold text-blue-400">{YOUR_NAME}</span>{t.about.bio1}
              </p>
              <p className="mb-4">
                {t.about.bio2}
              </p>
              <p>
                {t.about.bio3}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;