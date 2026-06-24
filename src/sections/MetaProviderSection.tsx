import React from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaInstagram, FaFacebookMessenger, FaCheck } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';

type Product = { name: string; Icon: IconType; color: string };

// Official Meta product brand colors. Logos rendered via react-icons brand glyphs.
const PRODUCTS: Product[] = [
  { name: 'WhatsApp', Icon: FaWhatsapp, color: '#25D366' },
  { name: 'Instagram', Icon: FaInstagram, color: '#E4405F' },
  { name: 'Messenger', Icon: FaFacebookMessenger, color: '#0084FF' },
];

const MetaProviderSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const t = translations[language].metaProvider;

  return (
    <section
      id="meta-provider"
      className={`py-12 sm:py-16 lg:py-24 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-blue-950/30'
          : 'bg-gradient-to-b from-white to-blue-50/60'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Verification seal — custom check, intentionally NOT a replica of Meta's verified badge */}
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-5 sm:mb-6 ${
              isDarkMode
                ? 'bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/30'
                : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
            }`}
          >
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white">
              <FaCheck className="w-2.5 h-2.5" aria-hidden="true" />
            </span>
            {t.eyebrow}
          </span>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-blue-400 mb-4 sm:mb-6">
            {t.title}
          </h2>

          {/* Value line */}
          <p
            className={`text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mb-10 sm:mb-12 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            {t.valueLine}
          </p>

          {/* Integrations label framed by hairline rules */}
          <div className="flex items-center gap-4 max-w-2xl mx-auto mb-8">
            <span className={`h-px flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
            <span
              className={`text-[11px] sm:text-xs font-semibold uppercase tracking-[0.15em] ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {t.integrationsLabel}
            </span>
            <span className={`h-px flex-1 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
          </div>

          {/* Official product logos */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 sm:mb-12">
            {PRODUCTS.map(({ name, Icon, color }) => (
              <motion.div
                key={name}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`flex flex-col items-center gap-2 w-28 sm:w-32 py-5 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-gray-800/40 ring-1 ring-white/10 hover:ring-white/20'
                    : 'bg-white ring-1 ring-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                <Icon
                  className="w-9 h-9 sm:w-10 sm:h-10"
                  style={{ color }}
                  role="img"
                  aria-label={name}
                />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {name}
                </span>
              </motion.div>
            ))}
          </div>

          {/* CTA → Contact */}
          <a
            href="#contact"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base font-medium shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-105"
          >
            {t.cta}
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default MetaProviderSection;
