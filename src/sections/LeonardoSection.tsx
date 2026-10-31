import React from 'react';
import { FaCogs, FaExternalLinkAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

// Galería estática en /public/leonardo (figuras hechas con Colorfigures, licencia MIT); se abre en pestaña nueva.
const LeonardoSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const es = language === 'es';
  const href = `/leonardo/index.html?lang=${es ? 'es' : 'en'}`;

  return (
    <section id="leonardo" className={`py-20 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {es ? 'Las máquinas de Leonardo' : 'Leonardo’s Machines'}
          </h2>
          <p className={`max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {es
              ? 'Inventos de Leonardo da Vinci que puedes preparar y ver funcionar, con su mecanismo por dentro.'
              : 'Leonardo da Vinci’s inventions you can set up and watch work, with their mechanism shown inside.'}
          </p>
        </motion.div>

        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`group mx-auto grid max-w-4xl overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:grid-cols-2 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
          }`}
        >
          <img
            src="/images/leonardo-cart.jpg"
            alt={es ? 'Carro autopropulsado de Leonardo da Vinci, ilustración isométrica' : 'Leonardo da Vinci’s self-propelled cart, isometric illustration'}
            width={1200}
            height={899}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="flex flex-col justify-center gap-4 p-6 lg:p-8">
            <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isDarkMode ? 'bg-blue-900/40 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
              <FaCogs className="h-3.5 w-3.5" />
              {es ? 'Interactivo' : 'Interactive'}
            </span>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {es ? 'Carro autopropulsado' : 'Self-propelled cart'}
            </h3>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {es
                ? 'Códice Atlántico, h. 1478–85. Elige las levas que programan la dirección, da cuerda a los resortes, suelta el freno y mira el recorrido. Es una reconstrucción basada en estudios publicados. Próximamente: ornitóptero, tornillo aéreo, ballesta gigante y paracaídas.'
                : 'Codex Atlanticus, c. 1478–85. Choose the cams that program the steering, wind the springs, release the brake and watch the path. A reconstruction based on published studies. Coming soon: ornithopter, aerial screw, giant crossbow and parachute.'}
            </p>
            <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all group-hover:from-blue-700 group-hover:to-purple-700">
              {es ? 'Probar el carro' : 'Try the cart'}
              <FaExternalLinkAlt className="h-3.5 w-3.5" />
            </span>
          </div>
        </motion.a>
      </div>
    </section>
  );
};

export default LeonardoSection;
