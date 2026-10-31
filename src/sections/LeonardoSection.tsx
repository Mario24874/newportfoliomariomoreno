import React from 'react';
import { FaCogs, FaExternalLinkAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

// Demo interactivo: galería estática en /public/leonardo (figuras hechas con Colorfigures, licencia MIT).
// Para activar un invento nuevo: agregar su página a public/leonardo, su imagen a public/images y moverlo de `soon` a `machines`.
const VER = 'v=4'; // cambia al actualizar las páginas: evita que la caché de Cloudflare sirva una versión vieja

interface Machine { page: string; image: string; es: { name: string; meta: string; alt: string; text: string }; en: { name: string; meta: string; alt: string; text: string } }

const machines: Machine[] = [
  {
    page: 'carro.html',
    image: '/images/leonardo-cart.jpg',
    es: { name: 'Carro autopropulsado', meta: 'Códice Atlántico · h. 1478–85', alt: 'Carro autopropulsado de Leonardo da Vinci, ilustración isométrica',
      text: 'Elige las levas que programan la dirección, da cuerda a los resortes, suelta el freno y mira el recorrido.' },
    en: { name: 'Self-propelled cart', meta: 'Codex Atlanticus · c. 1478–85', alt: 'Leonardo da Vinci’s self-propelled cart, isometric illustration',
      text: 'Choose the cams that program the steering, wind the springs, release the brake and watch the path.' },
  },
  {
    page: 'ornitoptero.html',
    image: '/images/leonardo-ornithopter.jpg',
    es: { name: 'Ornitóptero', meta: 'Diseño · h. 1485–1505', alt: 'Ornitóptero de Leonardo da Vinci, ilustración isométrica',
      text: 'Alas de membrana movidas por estribos y palancas. Aletea y prueba el despegue: es un diseño, nunca voló.' },
    en: { name: 'Ornithopter', meta: 'Design · c. 1485–1505', alt: 'Leonardo da Vinci’s ornithopter, isometric illustration',
      text: 'Membrane wings driven by stirrups and levers. Flap it and try to take off: a design, it never flew.' },
  },
  {
    page: 'tornillo.html',
    image: '/images/leonardo-screw.jpg',
    es: { name: 'Tornillo aéreo', meta: 'Diseño · Manuscrito B · h. 1487–89', alt: 'Tornillo aéreo de Leonardo da Vinci, ilustración isométrica',
      text: 'Un tornillo helicoidal de lino que giran cuatro hombres sobre una plataforma. Hazlo girar y prueba el despegue: es un diseño, nunca voló.' },
    en: { name: 'Aerial screw', meta: 'Design · Manuscript B · c. 1487–89', alt: 'Leonardo da Vinci’s aerial screw, isometric illustration',
      text: 'A helical linen screw turned by four men on a platform. Spin it and try to take off: a design, it never flew.' },
  },
];

const soon = {
  es: ['Ballesta gigante', 'Paracaídas'],
  en: ['Giant crossbow', 'Parachute'],
};

const LeonardoSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const es = language === 'es';
  const q = `?lang=${es ? 'es' : 'en'}&${VER}`;
  const galleryHref = `/leonardo/index.html${q}`;

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
          <span className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isDarkMode ? 'bg-blue-900/40 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
            <FaCogs className="h-3.5 w-3.5" />
            {es ? 'Demo interactivo' : 'Interactive demo'}
          </span>
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {es ? 'Las máquinas de Leonardo' : 'Leonardo’s Machines'}
          </h2>
          <p className={`max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {es
              ? 'Inventos de Leonardo da Vinci que puedes preparar y ver funcionar, con su mecanismo por dentro. Cada uno se muestra como lo dibujó: donde el diseño es discutido o nunca funcionó, la página lo dice.'
              : 'Leonardo da Vinci’s inventions you can set up and watch work, with their mechanism shown inside. Each is shown as he drew it: where the design is disputed or never worked, the page says so.'}
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {machines.map((mc, i) => {
            const t = es ? mc.es : mc.en;
            return (
              <motion.a
                key={mc.page}
                href={`/leonardo/${mc.page}${q}`}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
                className={`group flex flex-col overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
                }`}
              >
                <img src={mc.image} alt={t.alt} width={1200} height={899} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.name}</h3>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.meta}</p>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.text}</p>
                  <span className={`mt-auto inline-flex w-fit items-center gap-2 pt-2 text-sm font-semibold ${isDarkMode ? 'text-blue-300 group-hover:text-blue-200' : 'text-blue-600 group-hover:text-blue-700'}`}>
                    {es ? 'Probar' : 'Try it'}
                    <FaExternalLinkAlt className="h-3 w-3" />
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-8 flex max-w-5xl flex-col items-center gap-5"
        >
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {es ? 'Próximamente:' : 'Coming soon:'}{' '}
            {soon[es ? 'es' : 'en'].map((n, i, a) => (
              <span key={n} className="font-medium">{n}{i < a.length - 1 ? ' · ' : ''}</span>
            ))}
          </p>
          <a
            href={galleryHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
          >
            {es ? 'Abrir la galería completa' : 'Open the full gallery'}
            <FaExternalLinkAlt className="h-3.5 w-3.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default LeonardoSection;
