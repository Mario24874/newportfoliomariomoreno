import React from 'react';
import { FaMicrophone, FaRobot, FaBrain, FaCode } from 'react-icons/fa';
import { SiOpenai } from 'react-icons/si';
import { motion } from 'framer-motion';
import EmbeddedElevenLabsWidget from '@/components/ui/EmbeddedElevenLabsWidget';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

const DemosSection: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

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
      id: 'ai-chatbot',
      title: 'GPT-4 Code Assistant',
      description: 'Advanced AI assistant specialized in code generation, debugging, and technical consultation.',
      icon: SiOpenai,
      gradient: 'from-green-500 to-teal-500',
      component: (
        <div className="text-center p-6">
          <p className="text-gray-600 mb-4">Coming Soon</p>
          <button className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-lg font-medium">
            Try Demo
          </button>
        </div>
      )
    },
    {
      id: 'ml-predictor',
      title: 'ML Prediction Engine',
      description: 'Real-time machine learning model for data analysis and predictive insights.',
      icon: FaBrain,
      gradient: 'from-blue-500 to-indigo-500',
      component: (
        <div className="text-center p-6">
          <p className="text-gray-600 mb-4">Coming Soon</p>
          <button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-lg font-medium">
            Try Demo
          </button>
        </div>
      )
    },
    {
      id: 'automation-bot',
      title: 'n8n Automation Agent',
      description: 'Intelligent workflow automation powered by n8n and custom AI integrations.',
      icon: FaRobot,
      gradient: 'from-orange-500 to-red-500',
      component: (
        <div className="text-center p-6">
          <p className="text-gray-600 mb-4">Coming Soon</p>
          <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg font-medium">
            Try Demo
          </button>
        </div>
      )
    }
  ];

  return (
    <section id="demos" className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {t.demos.title}
          </h2>
          <p className="text-xl text-gray-300 mb-4">
            {t.demos.subtitle}
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto">
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
              className="bg-white rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
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
            <h3 className="text-2xl font-bold mb-4">Want a Custom AI Solution?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              I specialize in creating tailored AI solutions for businesses. Let's discuss how AI can transform your operations.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Schedule a Consultation
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemosSection;