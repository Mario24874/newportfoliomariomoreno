import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';

const CRM_URL = 'https://app.mariomoreno.work';

const ClientSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const t = translations[language];
  const s = t.clientSection;

  return (
    <section
      id="become-client"
      className={`py-20 sm:py-24 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`max-w-3xl mx-auto rounded-2xl shadow-2xl overflow-hidden`}
        >
          {/* Top gradient band */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-10 text-white text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              {s.title}
            </h2>
            <p className="text-blue-100 text-lg sm:text-xl">
              {s.subtitle}
            </p>
          </div>

          {/* Body */}
          <div
            className={`px-8 py-10 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}
          >
            <p
              className={`text-center text-base sm:text-lg mb-8 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {s.description}
            </p>

            {/* Feature list */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              {s.features.map((feature: string) => (
                <li key={feature} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span
                    className={`text-sm sm:text-base font-medium ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
              <a
                href={`${CRM_URL}/register`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                {s.cta}
              </a>
              <p
                className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {s.alreadyClient}{' '}
                <a
                  href={`${CRM_URL}/login`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400 font-semibold transition-colors"
                >
                  {s.login}
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ClientSection;
