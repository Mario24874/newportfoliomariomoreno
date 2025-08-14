import React from 'react';
import { FaApple, FaGooglePlay, FaDownload, FaStar, FaMobile } from 'react-icons/fa';
import { SiFlutter, SiReact } from 'react-icons/si';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

const MobileAppsSection: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const apps = [
    {
      id: 'urban-drive-app',
      name: t.mobileApps.apps.urbanDriveApp.name,
      description: t.mobileApps.apps.urbanDriveApp.description,
      icon: '/images/UrbanDrive.png',
      rating: 4.8,
      downloads: '10K+',
      category: t.mobileApps.apps.urbanDriveApp.category,
      technologies: [SiFlutter, SiReact],
      features: t.mobileApps.apps.urbanDriveApp.features,
      screenshots: [
        '/images/UrbanDrive.png',
        'https://picsum.photos/seed/app1-2/300/600',
        'https://picsum.photos/seed/app1-3/300/600'
      ],
      androidUrl: '/downloads/UrbanDriveApp.apk',
      iosUrl: '#',
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
      technologies: [SiFlutter],
      features: t.mobileApps.apps.italiantoApp.features,
      screenshots: [
        '/images/logo_Italianto.png',
        'https://picsum.photos/seed/app2-2/300/600',
        'https://picsum.photos/seed/app2-3/300/600'
      ],
      androidUrl: '/downloads/ItaliantoApp.apk',
      iosUrl: '#',
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
      technologies: [SiReact],
      features: t.mobileApps.apps.btuCalculator.features,
      screenshots: [
        'https://picsum.photos/seed/app3-1/300/600',
        'https://picsum.photos/seed/app3-2/300/600',
        'https://picsum.photos/seed/app3-3/300/600'
      ],
      androidUrl: '/downloads/CalculadoraBTU.apk',
      iosUrl: '#',
      status: 'available'
    }
  ];

  return (
    <section id="mobile-apps" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {t.mobileApps.title}
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            {t.mobileApps.subtitle}
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
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
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* App Header */}
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-xl">
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
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {t.mobileApps.available}
                      </span>
                    ) : (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {t.mobileApps.comingSoon}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <FaStar className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">{app.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaDownload className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{app.downloads}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {app.technologies.map((Tech, techIndex) => (
                      <Tech key={techIndex} className="w-4 h-4 text-gray-600" />
                    ))}
                  </div>
                </div>
              </div>

              {/* App Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {app.description}
                </p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FaMobile className="w-4 h-4 mr-2 text-blue-600" />
                    {t.mobileApps.keyFeatures}
                  </h4>
                  <ul className="space-y-2">
                    {app.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="text-sm text-gray-600 flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Download Buttons */}
                <div className="space-y-3">
                  {app.status === 'available' ? (
                    <a
                      href={app.androidUrl}
                      download={app.id === 'btu-calculator'}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <FaDownload className="w-5 h-5" />
                      <span>{t.mobileApps.downloadAppHere}</span>
                    </a>
                  ) : (
                    <div className="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium text-center">
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
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">{t.mobileApps.needCustomApp}</h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              {t.mobileApps.customAppDescription}
            </p>
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              {t.mobileApps.discussProject}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MobileAppsSection;