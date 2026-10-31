import React, { useEffect, useState } from 'react';
import { FaCogs, FaExternalLinkAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

// Portada única de la demo interactiva: un enlace a la galería de /public/leonardo (figuras hechas con Colorfigures, licencia MIT).
// La lista de inventos vive en public/leonardo/manifest.json: para sumar uno basta subir su página, su imagen y una entrada ahí;
// este componente no cambia. Si el manifiesto no carga, se muestran los inventos de esta lista inicial.
interface Machine { image: string; es: { name: string }; en: { name: string } }
const INITIAL: Machine[] = [
  { image: '/images/leonardo-cart.jpg', es: { name: 'Carro autopropulsado' }, en: { name: 'Self-propelled cart' } },
  { image: '/images/leonardo-ornithopter.jpg', es: { name: 'Ornitóptero' }, en: { name: 'Ornithopter' } },
  { image: '/images/leonardo-screw.jpg', es: { name: 'Tornillo aéreo' }, en: { name: 'Aerial screw' } },
  { image: '/images/leonardo-crossbow.jpg', es: { name: 'Ballesta gigante' }, en: { name: 'Giant crossbow' } },
  { image: '/images/leonardo-parachute.jpg', es: { name: 'Paracaídas' }, en: { name: 'Parachute' } },
];

const LeonardoSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const es = language === 'es';
  const [machines, setMachines] = useState<Machine[]>(INITIAL);

  useEffect(() => {
    // el parámetro por tramo de 10 minutos evita que la caché de Cloudflare sirva una lista vieja
    fetch(`/leonardo/manifest.json?t=${Math.floor(Date.now() / 600000)}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(m => { if (Array.isArray(m?.machines) && m.machines.length) setMachines(m.machines); })
      .catch(() => { /* se queda con la lista inicial */ });
  }, []);

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

        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`group mx-auto block max-w-5xl overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
          }`}
        >
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:gap-5 sm:p-6 lg:grid-cols-5">
            {machines.slice(0, 10).map(mc => {
              const name = es ? mc.es.name : mc.en.name;
              return (
                <figure key={mc.image} className="m-0 flex flex-col gap-2">
                  <div className={`overflow-hidden rounded-xl border-2 transition-transform duration-300 group-hover:-translate-y-0.5 ${
                    isDarkMode ? 'border-gray-300 shadow-[3px_3px_0_#d1d5db]' : 'border-gray-900 shadow-[3px_3px_0_#111827]'
                  }`}>
                    <img src={mc.image} alt={name} width={1200} height={899} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  </div>
                  <figcaption className={`text-center text-xs font-semibold sm:text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{name}</figcaption>
                </figure>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-2 text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {es ? 'La misma técnica sirve para demos de productos físicos, productos digitales y servicios: la galería muestra ejemplos de qué se puede hacer con ella.' : 'The same technique works for demos of physical products, digital products and services: the gallery shows examples of what can be done with it.'}
            </p>
            <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all group-hover:from-blue-700 group-hover:to-purple-700">
              {es ? 'Abrir la demo' : 'Open the demo'}
              <FaExternalLinkAlt className="h-3.5 w-3.5" />
            </span>
          </div>
        </motion.a>
      </div>
    </section>
  );
};

export default LeonardoSection;
