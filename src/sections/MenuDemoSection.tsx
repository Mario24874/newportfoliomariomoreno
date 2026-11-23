import React from 'react';
import { FaQrcode, FaExternalLinkAlt, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

// Demo en vivo del menú digital con pedidos por QR (https://menu.mariomoreno.work). Es una tarjeta que abre la demo en otra pestaña,
// igual que la de Leonardo: cada visitante crea SU propio menú de prueba (privado, se borra a los 7 días).
const DEMO_URL = 'https://menu.mariomoreno.work';

interface Shot { image: string; es: string; en: string }
const SHOTS: Shot[] = [
  { image: '/images/menu-demo-menu.jpg', es: 'Menú que ve el cliente', en: 'The menu your customer sees' },
  { image: '/images/menu-demo-personalizar.jpg', es: 'Se personaliza desde el teléfono', en: 'Customized from your phone' },
  { image: '/images/menu-demo-qr.jpg', es: 'QR listo para imprimir o compartir', en: 'QR ready to print or share' },
  { image: '/images/menu-demo-cocina.jpg', es: 'Pedidos en vivo en la cocina', en: 'Live orders in the kitchen' },
];

const MenuDemoSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const es = language === 'es';

  const points = es
    ? [
        'Personaliza colores, logo, categorías, productos, imágenes y alérgenos (con los nombres de tu región).',
        'El cliente escanea el QR, pide desde su teléfono y la cocina recibe la comanda en tiempo real, con confirmación.',
        'Se instala como app (PWA) y el menú se ve aunque se vaya la señal.',
        'Tus pruebas son privadas: nadie más ve lo que creas, y se borran solas a los 7 días.',
      ]
    : [
        'Customize colors, logo, categories, products, images and allergens (named the way your region calls them).',
        'The customer scans the QR, orders from their phone and the kitchen gets the order in real time, with confirmation.',
        'It installs as an app (PWA) and the menu still shows if the signal drops.',
        'Your tests are private: nobody else sees what you create, and it is deleted automatically after 7 days.',
      ];

  return (
    <section id="menu-demo" className={`py-20 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isDarkMode ? 'bg-emerald-900/40 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
            <FaQrcode className="h-3.5 w-3.5" />
            {es ? 'Demo en vivo' : 'Live demo'}
          </span>
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {es ? 'Menú digital con pedidos por QR' : 'QR digital menu with ordering'}
          </h2>
          <p className={`max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {es
              ? 'Para restaurantes, panaderías, cafés, snack bars y cualquier negocio que venda por menú. Créalo tú mismo en un minuto, pruébalo como cliente y mira cómo llega el pedido a la cocina.'
              : 'For restaurants, bakeries, cafés, snack bars and any business that sells from a menu. Create one yourself in a minute, try it as a customer and watch the order reach the kitchen.'}
          </p>
        </motion.div>

        <motion.a
          href={DEMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`group mx-auto block max-w-5xl overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
            isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-100'
          }`}
        >
          <div className="grid grid-cols-2 gap-4 p-4 sm:p-6 lg:grid-cols-4 lg:gap-5">
            {SHOTS.map(s => {
              const caption = es ? s.es : s.en;
              return (
                <figure key={s.image} className="m-0 flex flex-col gap-2">
                  <div className={`overflow-hidden rounded-xl border-2 transition-transform duration-300 group-hover:-translate-y-0.5 ${
                    isDarkMode ? 'border-gray-300 shadow-[3px_3px_0_#d1d5db]' : 'border-gray-900 shadow-[3px_3px_0_#111827]'
                  }`}>
                    <img src={s.image} alt={caption} width={480} height={853} loading="lazy" className="aspect-[9/16] w-full object-cover object-top" />
                  </div>
                  <figcaption className={`text-center text-xs font-semibold sm:text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{caption}</figcaption>
                </figure>
              );
            })}
          </div>

          <ul className="mx-auto grid max-w-4xl gap-3 px-6 pb-2 pt-2 sm:grid-cols-2">
            {points.map(p => (
              <li key={p} className={`flex items-start gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <FaCheckCircle className={`mt-0.5 h-4 w-4 flex-none ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-4 text-center">
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {es ? 'Hecho con PocketBase, JavaScript sin framework y PWA; desplegado en mi propio servidor.' : 'Built with PocketBase, framework-free JavaScript and PWA; deployed on my own server.'}
            </p>
            <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all group-hover:from-emerald-700 group-hover:to-teal-700">
              {es ? 'Probar la demo' : 'Try the demo'}
              <FaExternalLinkAlt className="h-3.5 w-3.5" />
            </span>
          </div>
        </motion.a>
      </div>
    </section>
  );
};

export default MenuDemoSection;
