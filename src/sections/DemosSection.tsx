import React, { useState } from 'react';
import { FaMicrophone, FaRobot, FaBrain, FaCode, FaStore, FaPlay, FaWarehouse, FaSearch, FaPen, FaHeadset } from 'react-icons/fa';
import { SiOpenai, SiTelegram } from 'react-icons/si';
import { motion } from 'framer-motion';
import EmbeddedElevenLabsWidget from '@/components/ui/EmbeddedElevenLabsWidget';
import AIDemoModal from '@/components/ui/AIDemoModal';
import N8nAutomationDemo from '@/components/ui/N8nAutomationDemo';
import ScheduleConsultationModal from '@/components/ui/ScheduleConsultationModal';
import { ResearchAgentDemo, ContentAgentDemo, SupportAgentDemo } from '@/components/ui/N8nAgentDemos';
import GeminiVoiceDemo from '@/components/ui/GeminiVoiceDemo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';
import { ELEVENLABS_AGENT_ID } from '@/config/elevenlabs';

// ---------------------------------------------------------------------------
// Agent card config for the new live agents
// ---------------------------------------------------------------------------
interface AgentCardConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  component: React.ReactNode;
}

const DemosSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const t = translations[language];
  const agentId = ELEVENLABS_AGENT_ID;
  const [modalOpen, setModalOpen] = useState(false);
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [currentDemo, setCurrentDemo] = useState<'telegram-store' | 'voice-assistant' | 'automation-flow' | 'telegram-voice-assistant' | 'ai-warehouse'>('telegram-store');

  const openModal = (demoType: 'telegram-store' | 'voice-assistant' | 'automation-flow' | 'telegram-voice-assistant' | 'ai-warehouse') => {
    setCurrentDemo(demoType);
    setModalOpen(true);
  };

  // New live AI agent demos
  const agentDemos: AgentCardConfig[] = [
    {
      id: 'research-agent',
      title: language === 'es' ? 'Agente de Investigación' : 'Research Agent',
      description: language === 'es'
        ? 'Escribe cualquier tema y en segundos obtienes un reporte estructurado con hallazgos clave, tendencias y recomendaciones accionables.'
        : 'Write any topic and within seconds get a structured report with key findings, trends and actionable recommendations.',
      icon: FaSearch,
      gradient: 'from-blue-600 to-indigo-600',
      component: <ResearchAgentDemo />,
    },
    {
      id: 'content-agent',
      title: language === 'es' ? 'Agente de Contenido' : 'Content Agent',
      description: language === 'es'
        ? 'Ingresa tu marca y tema, y el agente genera contenido nativo optimizado para Instagram, YouTube, LinkedIn y Twitter en un solo clic.'
        : 'Enter your brand and topic, and the agent generates native content optimized for Instagram, YouTube, LinkedIn and Twitter in one click.',
      icon: FaPen,
      gradient: 'from-purple-600 to-pink-600',
      component: <ContentAgentDemo />,
    },
    {
      id: 'support-agent',
      title: language === 'es' ? 'Agente de Soporte CRM' : 'CRM Support Agent',
      description: language === 'es'
        ? 'Pega cualquier mensaje de cliente y el agente lo clasifica por sentimiento, urgencia y categoría, y genera una respuesta profesional lista para enviar.'
        : 'Paste any customer message and the agent classifies it by sentiment, urgency and category, then generates a professional ready-to-send response.',
      icon: FaHeadset,
      gradient: 'from-teal-600 to-cyan-600',
      component: <SupportAgentDemo />,
    },
  ];

  const demos = [
    {
      id: 'gemini-voice',
      title: language === 'es' ? 'Asistente de Voz con Visión IA' : 'AI Voice & Vision Assistant',
      description: language === 'es'
        ? 'Habla con Gemini en tiempo real. Activa tu cámara y el agente también puede ver y describir lo que hay frente a ella.'
        : 'Talk to Gemini in real time. Enable your camera and the agent can also see and describe what is in front of it.',
      icon: FaRobot,
      gradient: 'from-blue-600 to-violet-600',
      component: <GeminiVoiceDemo />,
    },
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
      id: 'ai-warehouse',
      title: language === 'es' ? 'AI Virtual Warehouse' : 'AI Virtual Warehouse',
      description: language === 'es'
        ? 'Almacén virtual inteligente con cambio automático de presentaciones (Unidad, 6-Pack, Caja) y precios mediante comandos de Telegram.'
        : 'Smart virtual warehouse with automatic presentation changes (Unit, 6-Pack, Box) and prices via Telegram commands.',
      icon: FaWarehouse,
      gradient: 'from-green-500 to-emerald-500',
      component: (
        <div className="text-center p-6">
          <div className="mb-4">
            <FaWarehouse className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {language === 'es'
                ? 'Gestión automatizada de inventario y presentaciones'
                : 'Automated inventory and presentation management'
              }
            </p>
          </div>
          <button
            onClick={() => openModal('ai-warehouse')}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all flex items-center mx-auto"
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
      component: <N8nAutomationDemo />
    }
  ];

  return (
    <section id="demos" className={`py-20 transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50'
    }`}>
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section header */}
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

        {/* ---------------------------------------------------------------- */}
        {/* NEW: Agentes IA en Vivo                                          */}
        {/* ---------------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {language === 'es' ? 'Agentes IA en Vivo' : 'Live AI Agents'}
              </h3>
            </div>
            <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
            {agentDemos.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 transform hover:-translate-y-2 hover:shadow-3xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                {/* Card header */}
                <div className={`bg-gradient-to-r ${agent.gradient} p-6 text-white`}>
                  <div className="flex items-center space-x-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg flex-shrink-0">
                      <agent.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{agent.title}</h3>
                      <p className="text-sm opacity-90 mt-0.5">{agent.description}</p>
                    </div>
                  </div>
                </div>

                {/* Card body — form lives here */}
                <div className="p-6 flex-1">
                  {agent.component}
                </div>

                {/* Card footer */}
                <div className="px-6 pb-6">
                  <div className={`border-t pt-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="flex items-center space-x-1">
                        <FaBrain className="w-4 h-4" />
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
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/* Divider                                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className={`flex items-center gap-4 my-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <span className="text-sm font-medium px-2">
            {language === 'es' ? 'Más demos interactivas' : 'More interactive demos'}
          </span>
          <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Existing demos grid                                              */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid md:grid-cols-2 gap-8">
          {demos.map((demo, index) => (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
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
            <button
              onClick={() => setConsultationModalOpen(true)}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              {language === 'es' ? 'Programar una Consulta' : 'Schedule a Consultation'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Demo Modal */}
      <AIDemoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        demoType={currentDemo}
      />

      {/* Consultation Scheduling Modal */}
      <ScheduleConsultationModal
        isOpen={consultationModalOpen}
        onClose={() => setConsultationModalOpen(false)}
      />
    </section>
  );
};

export default DemosSection;
