// src/components/ui/PrivacyPolicy.tsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const t = translations[language].privacy;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl my-8">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t.title}
                </h1>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <FaTimes className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 text-gray-700 dark:text-gray-300 max-h-[70vh] overflow-y-auto">
                {/* Last Updated */}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.lastUpdated}: {new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                {/* Introduction */}
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {t.introduction.title}
                  </h2>
                  <p className="leading-relaxed">{t.introduction.content}</p>
                </section>

                {/* Information Collection */}
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {t.dataCollection.title}
                  </h2>
                  <p className="mb-3 leading-relaxed">{t.dataCollection.intro}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    {t.dataCollection.items.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </section>

                {/* How We Use Information */}
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {t.dataUsage.title}
                  </h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    {t.dataUsage.items.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </section>

                {/* Third-Party Services */}
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {t.thirdParty.title}
                  </h2>
                  <p className="mb-3 leading-relaxed">{t.thirdParty.intro}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    {t.thirdParty.services.map((service: string, index: number) => (
                      <li key={index}>{service}</li>
                    ))}
                  </ul>
                </section>

                {/* Cookies */}
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {t.cookies.title}
                  </h2>
                  <p className="leading-relaxed">{t.cookies.content}</p>
                </section>

                {/* Data Security */}
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {t.security.title}
                  </h2>
                  <p className="leading-relaxed">{t.security.content}</p>
                </section>

                {/* User Rights */}
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {t.userRights.title}
                  </h2>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    {t.userRights.items.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </section>

                {/* Changes to Policy */}
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {t.changes.title}
                  </h2>
                  <p className="leading-relaxed">{t.changes.content}</p>
                </section>

                {/* Contact */}
                <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {t.contact.title}
                  </h2>
                  <p className="leading-relaxed mb-2">{t.contact.content}</p>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="font-semibold">Mario Moreno</p>
                    <p>Email: marioivanmorenopineda@gmail.com</p>
                    <p>WhatsApp: +58 412 052 6989</p>
                    <p className="mt-2">
                      LinkedIn: <a href="https://linkedin.com/in/mario-moreno-9916043b" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">linkedin.com/in/mario-moreno-9916043b</a>
                    </p>
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PrivacyPolicy;
