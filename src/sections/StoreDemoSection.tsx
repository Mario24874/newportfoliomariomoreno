import React from 'react';
import { FaShoppingBag } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

// Demo interactiva del proceso de compra de store.mariomoreno.work, incrustada para probarla aquí mismo.
// Página en public/store-demo/index.html (hecha con Colorfigures, licencia MIT; crédito en la propia página).
// Caddyfile le da una excepción de cabeceras: el resto del sitio no se puede enmarcar.
const StoreDemoSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const es = language === 'es';

  return (
    <section id="store-demo" className={`py-20 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isDarkMode ? 'bg-blue-900/40 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
            <FaShoppingBag className="h-3.5 w-3.5" />
            {es ? 'Demo interactivo' : 'Interactive demo'}
          </span>
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {es ? 'Así se compra en mi tienda' : 'How buying works in my store'}
          </h2>
          <p className={`max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {es
              ? 'Elige producto físico, digital o personalizado y avanza paso a paso. Activa «See-through» para ver por dentro el recorrido del pedido.'
              : 'Pick a physical, digital or custom product and move step by step. Turn on “See-through” to see the order’s path inside.'}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`mx-auto max-w-5xl overflow-hidden rounded-2xl shadow-xl ${isDarkMode ? 'border border-gray-700' : 'border border-gray-200'}`}
        >
          <iframe
            src={`/store-demo/index.html?lang=${es ? 'es' : 'en'}`}
            title={es ? 'Demo interactiva del proceso de compra' : 'Interactive demo of the buying process'}
            loading="lazy"
            className="block h-[78vh] min-h-[560px] w-full"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default StoreDemoSection;
