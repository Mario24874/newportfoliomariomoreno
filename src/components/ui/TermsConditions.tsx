import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

interface TermsConditionsProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsConditions: React.FC<TermsConditionsProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const t = translations[language].terms;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl my-8">
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <FaTimes className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-gray-700 dark:text-gray-300 max-h-[70vh] overflow-y-auto">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.lastUpdated}: {new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t.acceptance.title}</h2>
                  <p className="leading-relaxed">{t.acceptance.content}</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t.services.title}</h2>
                  <p className="leading-relaxed">{t.services.content}</p>
                </section>

                <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-5">
                  <h2 className="text-xl font-semibold mb-3 text-amber-800 dark:text-amber-300">{t.aiDisclaimer.title}</h2>
                  <p className="mb-3 leading-relaxed text-amber-700 dark:text-amber-400">{t.aiDisclaimer.intro}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-amber-700 dark:text-amber-400">
                    {t.aiDisclaimer.items.map((item: string, index: number) => (
                      <li key={index} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t.consultations.title}</h2>
                  <p className="leading-relaxed">{t.consultations.content}</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t.intellectualProperty.title}</h2>
                  <p className="leading-relaxed">{t.intellectualProperty.content}</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t.limitation.title}</h2>
                  <p className="leading-relaxed">{t.limitation.content}</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t.governing.title}</h2>
                  <p className="leading-relaxed">{t.governing.content}</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t.changes.title}</h2>
                  <p className="leading-relaxed">{t.changes.content}</p>
                </section>

                <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{t.contact.title}</h2>
                  <p className="leading-relaxed mb-2">{t.contact.content}</p>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="font-semibold">Mario Moreno</p>
                    <p>Email: marioivanmorenopineda@gmail.com</p>
                    <p>WhatsApp: +58 412 052 6989</p>
                    <p className="mt-2">
                      LinkedIn:{' '}
                      <a
                        href="https://linkedin.com/in/mario-moreno-9916043b"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        linkedin.com/in/mario-moreno-9916043b
                      </a>
                    </p>
                  </div>
                </section>
              </div>

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

export default TermsConditions;
