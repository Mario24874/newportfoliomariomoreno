// src/components/layout/Footer.tsx

import React from 'react';
// --- CORRECCIÓN: Se cambió la ruta relativa por el alias '@' ---
// '@' apunta a /src, por lo que la ruta correcta a portfolioData.ts es '@/data/portfolioData'
import { YOUR_NAME } from '@/data/portfolioData';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

interface FooterProps {
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onPrivacyClick, onTermsClick }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 dark:bg-gray-800/50 border-t border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 py-6 text-center backdrop-blur-sm">
      <div className="container mx-auto px-6 lg:px-8">
        <p>© {currentYear} {YOUR_NAME}. {t.footer.rights}.</p>
        <p className="text-sm mt-1">
          {t.footer.builtWith}.
        </p>
        <div className="mt-3 text-sm flex items-center justify-center gap-4">
          <button
            onClick={onPrivacyClick}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 underline decoration-dotted underline-offset-4"
          >
            {t.footer.privacyPolicy}
          </button>
          <span className="text-gray-400 dark:text-gray-600">·</span>
          <button
            onClick={onTermsClick}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 underline decoration-dotted underline-offset-4"
          >
            {t.footer.termsConditions}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;