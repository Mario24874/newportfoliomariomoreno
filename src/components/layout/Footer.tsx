// src/components/layout/Footer.tsx

import React from 'react';
import { FaYoutube, FaInstagram } from 'react-icons/fa';
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
        <div className="mt-3 flex items-center justify-center gap-4">
          <a
            href="https://www.youtube.com/@MarioMoreno-lA"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
            aria-label="YouTube"
          >
            <FaYoutube className="w-5 h-5" />
          </a>
          <a
            href="https://www.instagram.com/mario.moreno.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors duration-200"
            aria-label="Instagram"
          >
            <FaInstagram className="w-5 h-5" />
          </a>
        </div>
        <div className="mt-2 text-sm flex items-center justify-center gap-4">
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