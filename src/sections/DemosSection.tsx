import React, { useState } from 'react';
import { FaMicrophone, FaRobot, FaBrain, FaCode, FaStore, FaPlay } from 'react-icons/fa';
import { SiOpenai, SiTelegram } from 'react-icons/si';
import { motion } from 'framer-motion';
import EmbeddedElevenLabsWidget from '@/components/ui/EmbeddedElevenLabsWidget';
import AIDemoModal from '@/components/ui/AIDemoModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';

const DemosSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const t = translations[language];
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  
  // Debug log for agent ID
  console.log('DemosSection: ElevenLabs Agent ID:', agentId, typeof agentId);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentDemo, setCurrentDemo] = useState<'telegram-store' | 'voice-assistant' | 'automation-flow' | 'telegram-voice-assistant'>('telegram-store');

  const openModal = (demoType: 'telegram-store' | 'voice-assistant' | 'automation-flow' | 'telegram-voice-assistant') => {
    setCurrentDemo(demoType);
    setModalOpen(true);
  };

  const demos = [
    {
      id: 'voice-assistant',
      title: t.demos.elevenlabs.title,
      description: t.demos.elevenlabs.description,
      icon: FaMicrophone,
      gradient: 'from-purple-500 to-pink-500',
      component: agentId ? (
        <EmbeddedElevenLabsWidget agentId={agentId} />
      ) : (
        <div className="text-center p-6">
          <p className="text-gray-600 mb-4">Voice assistant demo requires ElevenLabs Agent ID</p>
          <p className="text-sm text-gray-500">Configure VITE_ELEVENLABS_AGENT_ID in your .env file</p>
        </div>
      )
    },
    {
      id: 'telegram-store',
      title: language === 'es' ? 'Agente de Tienda Telegram' : 'Telegram Store Agent',
      description: language === 'es' 
        ? 'Demo interactiva de una tienda virtual con IA que responde a comandos de Telegram para cambiar precios automáticamente.'
        : 'Interactive demo of a virtual store with AI that responds to Telegram commands to automatically change prices.',
      icon: SiTelegram,
      gradient: 'from-blue-500 to-cyan-500',
      component: (
        <div className="text-center p-6">
          <div className="mb-4">
            <FaStore className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {language === 'es' 
                ? 'Simula cambios de precio mediante mensajería'
                : 'Simulate price changes via messaging'
              }
            </p>
          </div>
          <button 
            onClick={() => openModal('telegram-store')}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all flex items-center mx-auto"
          >
            <FaPlay className="mr-2" />
            {language === 'es' ? 'Probar Demo' : 'Try Demo'}
          </button>
        </div>
      )
    },
    {
      id: 'telegram-voice-assistant',
      title: language === 'es' ? 'Asistente de Voz IA con Telegram' : 'AI Voice Assistant with Telegram',
      description: language === 'es' 
        ? 'Asistente personal con OpenAI que procesa mensajes de voz, accede a Gmail y Google Calendar.'
        : 'Personal assistant with OpenAI that processes voice messages, accesses Gmail and Google Calendar.',
      icon: SiOpenai,
      gradient: 'from-green-500 to-teal-500',
      component: (
        <div className="text-center p-6">
          <div className="mb-4">
            <SiOpenai className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {language === 'es' 
                ? 'Asistente con transcripción de voz y acceso a servicios'
                : 'Assistant with voice transcription and service access'
              }
            </p>
          </div>
          <button 
            onClick={() => openModal('telegram-voice-assistant')}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all flex items-center mx-auto"
          >
            <FaPlay className="mr-2" />
            {language === 'es' ? 'Probar Demo' : 'Try Demo'}
          </button>
        </div>
      )
    },
    {
      id: 'automation-bot',
      title: language === 'es' ? 'Agente de Automatización n8n' : 'n8n Automation Agent',
      description: language === 'es' 
        ? 'Automatización inteligente de flujos de trabajo impulsada por n8n e integraciones de IA personalizadas.'
        : 'Intelligent workflow automation powered by n8n and custom AI integrations.',
      icon: FaRobot,
      gradient: 'from-orange-500 to-red-500',
      component: (
        <div className="text-center p-6">
          <div className="mb-4">
            <FaRobot className="w-12 h-12 text-orange-500 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {language === 'es' 
                ? 'Visualización de flujo de automatización'
                : 'Automation flow visualization'
              }
            </p>
          </div>
          <button 
            onClick={() => openModal('automation-flow')}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all flex items-center mx-auto"
          >
            <FaPlay className="mr-2" />
            {language === 'es' ? 'Ver Flujo' : 'View Flow'}
          </button>
        </div>
      )
    }
  ];

  return (
    <section id="demos" className={`py-20 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50'
    }`}>
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {t.demos.title}
          </h2>
          <p className={`text-xl mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t.demos.subtitle}
          </p>
          <p className={`max-w-2xl mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {t.demos.description}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {demos.map((demo, index) => (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 ${
                isDarkMode ? 'bg-white' : 'bg-white'
              }`}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${demo.gradient} p-6 text-white`}>
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <demo.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{demo.title}</h3>
                    <p className="text-sm opacity-90">{demo.description}</p>
                  </div>
                </div>
              </div>

              {/* Demo Content */}
              <div className="p-6">
                {demo.component}
              </div>

              {/* Features */}
              <div className="px-6 pb-6">
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <FaCode className="w-4 h-4" />
                      <span>AI Powered</span>
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Live Demo
                    </span>
                  </div>
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              {language === 'es' ? '¿Quieres una Solución de IA Personalizada?' : 'Want a Custom AI Solution?'}
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              {language === 'es' 
                ? 'Me especializo en crear soluciones de IA personalizadas para empresas. Hablemos sobre cómo la IA puede transformar tus operaciones.'
                : 'I specialize in creating tailored AI solutions for businesses. Let\'s discuss how AI can transform your operations.'
              }
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              {language === 'es' ? 'Programar una Consulta' : 'Schedule a Consultation'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AIDemoModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        demoType={currentDemo}
      />
    </section>
  );
};

export default DemosSection;