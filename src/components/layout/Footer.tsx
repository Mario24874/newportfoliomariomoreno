// src/components/layout/Footer.tsx

import React from 'react';
// --- CORRECCIÓN: Se cambió la ruta relativa por el alias '@' ---
// '@' apunta a /src, por lo que la ruta correcta a portfolioData.ts es '@/data/portfolioData'
import { YOUR_NAME } from '@/data/portfolioData';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

const Footer: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800/50 border-t border-white/10 text-gray-400 py-6 text-center backdrop-blur-sm">
      <div className="container mx-auto px-6 lg:px-8">
        <p>© {currentYear} {YOUR_NAME}. {t.footer.rights}.</p>
        <p className="text-sm mt-1">
          {t.footer.builtWith}.
        </p>
      </div>
    </footer>
  );
};

export default Footer;