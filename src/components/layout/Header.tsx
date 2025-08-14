// src/components/layout/Header.tsx

import React, { useState, useEffect } from 'react';
import { NAV_ITEMS } from '@/data/portfolioData';
import { NavItem } from '@/types';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  // Effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) return;
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen]);


  const headerClasses = `
    sticky top-0 z-50 transition-all duration-300
    ${isScrolled || isOpen ? 'bg-gray-900/90 backdrop-blur-lg shadow-lg py-3 sm:py-4' : 'bg-transparent py-4 sm:py-6'}
  `;

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo/Title - Responsive text sizes */}
        <a href="#" className="text-lg sm:text-xl lg:text-2xl font-bold text-white hover:text-blue-400 transition-colors flex-shrink-0">
          <span className="hidden sm:inline">{t.header.welcome}</span>
          <span className="sm:hidden">{t.header.portfolio}</span>
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
          {NAV_ITEMS.map((item: NavItem) => (
            <a
              key={item.name}
              href={item.href}
              className="text-gray-300 hover:text-white px-2 xl:px-3 py-2 rounded-md text-sm xl:text-base font-medium transition-colors"
            >
              {t.nav[item.key as keyof typeof t.nav]}
            </a>
          ))}
          <div className="ml-2">
            <LanguageToggle />
          </div>
        </nav>
        
        {/* Mobile/Tablet Menu Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 p-2 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            <svg className={`h-6 w-6 fill-current transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 24 24">
              {isOpen ? (
                <path fillRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.828-4.828-4.828a1 1 0 0 1 1.414-1.414l4.828 4.828 4.829-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.828 4.828 4.828z" />
              ) : (
                <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile/Tablet Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-white/10">
          <nav className="px-4 pt-4 pb-6 space-y-2 bg-gray-900/95 backdrop-blur-lg">
            {NAV_ITEMS.map((item: NavItem) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:bg-gray-700/50 hover:text-white block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200"
              >
                {t.nav[item.key as keyof typeof t.nav]}
              </a>
            ))}
            <div className="pt-4 border-t border-white/10 flex justify-center">
              <LanguageToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;