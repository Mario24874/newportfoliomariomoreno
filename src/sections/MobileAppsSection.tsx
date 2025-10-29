import React from 'react';
import { FaApple, FaGooglePlay, FaDownload, FaStar, FaMobile, FaGlobe } from 'react-icons/fa';
import { SiReact, SiTypescript } from 'react-icons/si';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';

interface AppData {
  id: string;
  name: string;
  description: string;
  icon: string;
  rating: number;
  downloads: string;
  category: string;
  technologies: React.ComponentType<{ className?: string }>[];
  features: string[];
  screenshots?: string[];
  expoAndroidUrl?: string;
  isPWA?: boolean;
  pwaUrl?: string;
  status: 'available' | 'coming-soon';
}

const MobileAppsSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const t = translations[language];

  const apps: AppData[] = [
    {
      id: 'urban-drive-app',
      name: t.mobileApps.apps.urbanDriveApp.name,
      description: t.mobileApps.apps.urbanDriveApp.description,
      icon: '/images/UrbanDrive.png',
      rating: 4.8,
      downloads: '10K+',
      category: t.mobileApps.apps.urbanDriveApp.category,
      technologies: [SiReact, SiTypescript],
      features: t.mobileApps.apps.urbanDriveApp.features,
      isPWA: true,
      pwaUrl: 'https://urban-drive-master.netlify.app',
      status: 'available'
    },
    {
      id: 'italianto-app',
      name: t.mobileApps.apps.italiantoApp.name,
      description: t.mobileApps.apps.italiantoApp.description,
      icon: '/images/logo_Italianto.png',
      rating: 4.9,
      downloads: '25K+',
      category: t.mobileApps.apps.italiantoApp.category,
      technologies: [SiReact, SiTypescript],
      features: t.mobileApps.apps.italiantoApp.features,
      expoAndroidUrl: 'https://expo.dev/accounts/mario24874/projects/italiantoapp/builds/dc46c167-24c0-48b2-a4b8-20b28d290fd0',
      status: 'available'
    },
    {
      id: 'btu-calculator',
      name: t.mobileApps.apps.btuCalculator.name,
      description: t.mobileApps.apps.btuCalculator.description,
      icon: '❄️',
      rating: 4.9,
      downloads: '15K+',
      category: t.mobileApps.apps.btuCalculator.category,
      technologies: [SiReact, SiTypescript],
      features: t.mobileApps.apps.btuCalculator.features,
      expoAndroidUrl: 'https://expo.dev/accounts/mario24874/projects/calculadora-btu/builds/ff5bd940-a3fb-40cd-958d-dd51c03da4c9',
      status: 'available'
    }
  ];

  return (
    <section id="mobile-apps-section" className={`py-20 transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-gray-50 to-white'
    }`}>
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {t.mobileApps.title}
          </h2>
          <p className={`text-xl mb-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t.mobileApps.subtitle}
          </p>
          <p className={`max-w-2xl mx-auto ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {t.mobileApps.description}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
          {apps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${
                isDarkMode
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white'
              }`}
            >
              {/* App Header */}
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                      {app.icon.startsWith('/') ? (
                        <img
                          src={app.icon}
                          alt={`${app.name} icon`}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <span className="text-4xl">{app.icon}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{app.name}</h3>
                      <p className="text-blue-100 text-sm">{app.category}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {app.status === 'available' ? (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        {t.mobileApps.available}
                      </span>
                    ) : (
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        {t.mobileApps.comingSoon}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className={`px-6 py-3 flex items-center justify-between ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-1">
                    <FaStar className="w-4 h-4 text-yellow-500" />
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>{app.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaDownload className={`w-4 h-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>{app.downloads}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {app.technologies.map((Tech, techIndex) => (
                      <Tech
                        key={techIndex}
                        className={`w-5 h-5 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* App Content */}
              <div className="p-6">
                <p className={`mb-4 text-sm leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {app.description}
                </p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className={`font-semibold mb-3 flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <FaMobile className="w-4 h-4 mr-2 text-blue-600" />
                    {t.mobileApps.keyFeatures}
                  </h4>
                  <ul className="space-y-2">
                    {app.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className={`text-sm flex items-center ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Download/Access Buttons */}
                <div className="space-y-3">
                  {app.status === 'available' ? (
                    <>
                      {/* PWA Button for Urban Drive */}
                      {app.isPWA ? (
                        <>
                          <a
                            href={app.pwaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                          >
                            <FaGlobe className="w-5 h-5" />
                            <span>
                              {language === 'es' ? 'Abrir Aplicación Web' : 'Open Web App'}
                            </span>
                          </a>
                          <p className={`text-xs text-center ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {language === 'es'
                              ? '✨ Aplicación Web Progresiva - Funciona en todos los dispositivos'
                              : '✨ Progressive Web App - Works on all devices'
                            }
                          </p>
                        </>
                      ) : (
                        /* Expo Download Button (Android only) */
                        <>
                          {/* Android Button */}
                          <a
                            href={app.expoAndroidUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-4 shadow-lg hover:shadow-2xl group transform hover:scale-105"
                          >
                            <FaGooglePlay className="w-7 h-7 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                              <div className="text-xs opacity-90 font-normal">
                                {language === 'es' ? 'Descargar para' : 'Download for'}
                              </div>
                              <div className="text-lg font-bold">Android</div>
                            </div>
                          </a>

                          {/* Expo Info */}
                          <div className={`flex items-center justify-center space-x-2 text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <span>📱</span>
                            <span>
                              {language === 'es'
                                ? 'Descarga vía Expo - Instalación directa'
                                : 'Download via Expo - Direct install'
                              }
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className={`w-full py-3 px-4 rounded-xl font-medium text-center ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {t.mobileApps.comingSoon}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">
              {t.mobileApps.needCustomApp}
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto text-lg">
              {t.mobileApps.customAppDescription}
            </p>
            <button className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              {t.mobileApps.discussProject}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MobileAppsSection;
