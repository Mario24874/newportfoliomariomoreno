import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaPlay, FaPause, FaCheckCircle, FaSpinner, FaRobot, FaCalendarAlt, FaEnvelope } from 'react-icons/fa';
import { SiTelegram, SiOpenai, SiGooglecalendar, SiGmail } from 'react-icons/si';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  isVoice?: boolean;
  timestamp: string;
}

const TelegramVoiceAssistantDemo: React.FC = () => {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const [userTelegramId, setUserTelegramId] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const workflowSteps = [
    {
      title: language === 'es' ? 'Mensaje de Voz' : 'Voice Message',
      description: language === 'es' ? 'Usuario envía audio por Telegram' : 'User sends audio via Telegram',
      icon: FaMicrophone,
      color: 'blue'
    },
    {
      title: language === 'es' ? 'Transcripción' : 'Transcription',
      description: language === 'es' ? 'OpenAI transcribe el audio a texto' : 'OpenAI transcribes audio to text',
      icon: SiOpenai,
      color: 'green'
    },
    {
      title: language === 'es' ? 'Procesamiento IA' : 'AI Processing',
      description: language === 'es' ? 'GPT-4 analiza y genera respuesta' : 'GPT-4 analyzes and generates response',
      icon: FaRobot,
      color: 'purple'
    },
    {
      title: language === 'es' ? 'Integración' : 'Integration',
      description: language === 'es' ? 'Accede a Calendar y Gmail' : 'Accesses Calendar and Gmail',
      icon: SiGooglecalendar,
      color: 'red'
    },
    {
      title: language === 'es' ? 'Respuesta' : 'Response',
      description: language === 'es' ? 'Envía respuesta a Telegram' : 'Sends response to Telegram',
      icon: SiTelegram,
      color: 'blue'
    }
  ];

  const demoMessages = [
    {
      user: { 
        content: language === 'es' ? "¿Qué tengo en mi calendario para mañana?" : "What's on my calendar for tomorrow?",
        isVoice: true
      },
      assistant: language === 'es' 
        ? "Revisando tu calendario... Mañana tienes 3 eventos: Reunión con el equipo a las 10 AM, Almuerzo con cliente a las 1 PM, y Llamada de seguimiento a las 4 PM."
        : "Checking your calendar... Tomorrow you have 3 events: Team meeting at 10 AM, Client lunch at 1 PM, and Follow-up call at 4 PM."
    },
    {
      user: { 
        content: language === 'es' ? "Revisa mis emails importantes de hoy" : "Check my important emails from today",
        isVoice: true
      },
      assistant: language === 'es'
        ? "He encontrado 5 emails importantes hoy. El CEO respondió a tu propuesta, hay una actualización del proyecto Alpha, y 3 solicitudes de reunión pendientes."
        : "I found 5 important emails today. The CEO replied to your proposal, there's an update on Project Alpha, and 3 pending meeting requests."
    },
    {
      user: { 
        content: language === 'es' ? "Programa una reunión para el viernes a las 3 PM" : "Schedule a meeting for Friday at 3 PM",
        isVoice: false
      },
      assistant: language === 'es'
        ? "Perfecto, he agregado la reunión para el viernes a las 3 PM en tu calendario. ¿Necesitas que envíe invitaciones a alguien?"
        : "Perfect, I've added the meeting for Friday at 3 PM to your calendar. Do you need me to send invitations to anyone?"
    }
  ];

  const simulateDemo = () => {
    setShowDemo(true);
    setMessages([]);
    let messageIndex = 0;

    const addMessage = () => {
      if (messageIndex < demoMessages.length) {
        const demo = demoMessages[messageIndex];
        
        // Add user message
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            content: demo.user.content,
            isVoice: demo.user.isVoice,
            timestamp: new Date().toLocaleTimeString()
          }]);
          setIsProcessing(true);
          animateWorkflow();
        }, 500);

        // Add assistant response
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            type: 'assistant',
            content: demo.assistant,
            timestamp: new Date().toLocaleTimeString()
          }]);
          setIsProcessing(false);
          messageIndex++;
          
          // Continue with next message
          if (messageIndex < demoMessages.length) {
            setTimeout(addMessage, 2000);
          }
        }, 3000);
      }
    };

    addMessage();
  };

  const animateWorkflow = () => {
    let step = 0;
    const interval = setInterval(() => {
      if (step < workflowSteps.length) {
        setCurrentStep(step);
        step++;
      } else {
        clearInterval(interval);
        setCurrentStep(-1);
      }
    }, 600);
  };

  const handleVerification = () => {
    if (userTelegramId.trim()) {
      // In production, this would verify with backend
      setIsVerified(true);
      setTimeout(() => simulateDemo(), 1000);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <SiTelegram className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {language === 'es' ? 'Asistente de Voz IA con Telegram' : 'AI Voice Assistant with Telegram'}
        </h3>
        <p className="text-gray-600">
          {language === 'es' 
            ? 'Asistente personal con OpenAI que responde mensajes de voz y accede a tu calendario y email'
            : 'Personal assistant with OpenAI that responds to voice messages and accesses your calendar and email'
          }
        </p>
      </div>

      {/* Verification Section */}
      {!isVerified && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-blue-800 mb-3">
            {language === 'es' ? 'Verificación de Seguridad' : 'Security Verification'}
          </h4>
          <p className="text-sm text-blue-700 mb-4">
            {language === 'es' 
              ? 'Para garantizar la privacidad, ingresa tu ID de Telegram (solo para demo, no se guardará)'
              : 'To ensure privacy, enter your Telegram ID (demo only, will not be saved)'
            }
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder={language === 'es' ? 'Tu ID de Telegram' : 'Your Telegram ID'}
              value={userTelegramId}
              onChange={(e) => setUserTelegramId(e.target.value)}
              className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleVerification}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {language === 'es' ? 'Verificar' : 'Verify'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {language === 'es' 
              ? '* En producción, esto se conectaría a tu cuenta real de Telegram'
              : '* In production, this would connect to your actual Telegram account'
            }
          </p>
        </div>
      )}

      {/* Workflow Visualization */}
      {isVerified && (
        <>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-4">
              {language === 'es' ? 'Flujo de Trabajo n8n' : 'n8n Workflow'}
            </h4>
            <div className="flex justify-between items-center">
              {workflowSteps.map((step, index) => (
                <div key={index} className="flex-1 text-center">
                  <motion.div
                    animate={{
                      scale: currentStep === index ? 1.2 : 1,
                      opacity: currentStep >= index || currentStep === -1 ? 1 : 0.3
                    }}
                    className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-${step.color}-100`}
                  >
                    <step.icon className={`w-6 h-6 text-${step.color}-600`} />
                  </motion.div>
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  {index < workflowSteps.length - 1 && (
                    <div className="absolute mt-6 w-full h-0.5 bg-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SiTelegram className="w-6 h-6" />
                  <span className="font-semibold">AI Assistant Bot</span>
                </div>
                {isProcessing && (
                  <FaSpinner className="w-5 h-5 animate-spin" />
                )}
              </div>
            </div>

            <div className="h-96 overflow-y-auto p-4 bg-gray-50">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      {message.isVoice && (
                        <div className="flex items-center space-x-2 mb-1">
                          <FaMicrophone className="w-3 h-3" />
                          <span className="text-xs opacity-75">
                            {language === 'es' ? 'Mensaje de voz' : 'Voice message'}
                          </span>
                        </div>
                      )}
                      <p className={message.type === 'user' ? 'text-white' : 'text-gray-800'}>
                        {message.content}
                      </p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {messages.length === 0 && showDemo && (
                <div className="text-center text-gray-500 mt-8">
                  <p>{language === 'es' ? 'Iniciando demo...' : 'Starting demo...'}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={simulateDemo}
                disabled={!isVerified || isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FaPlay className="w-4 h-4" />
                <span>
                  {language === 'es' ? 'Iniciar Demo Interactiva' : 'Start Interactive Demo'}
                </span>
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <SiGmail className="w-6 h-6 text-red-500 mb-2" />
              <h5 className="font-semibold text-gray-800">
                {language === 'es' ? 'Integración Gmail' : 'Gmail Integration'}
              </h5>
              <p className="text-sm text-gray-600">
                {language === 'es' ? 'Lee y gestiona emails' : 'Read and manage emails'}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <SiGooglecalendar className="w-6 h-6 text-blue-500 mb-2" />
              <h5 className="font-semibold text-gray-800">
                {language === 'es' ? 'Google Calendar' : 'Google Calendar'}
              </h5>
              <p className="text-sm text-gray-600">
                {language === 'es' ? 'Gestiona tu agenda' : 'Manage your schedule'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TelegramVoiceAssistantDemo;