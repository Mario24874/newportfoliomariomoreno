import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaRobot, FaStore, FaPaperPlane, FaWhatsapp, FaCheck, FaSpinner } from 'react-icons/fa';
import { SiTelegram } from 'react-icons/si';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';
import VirtualStoreDemo from './VirtualStoreDemo';
import TelegramVoiceAssistantDemo from './TelegramVoiceAssistantDemo';

interface AIDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  demoType: 'telegram-store' | 'voice-assistant' | 'automation-flow' | 'telegram-voice-assistant';
}

const AIDemoModal: React.FC<AIDemoModalProps> = ({ isOpen, onClose, demoType }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState(299);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setShowResult(false);
      setMessage('');
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsLoading(false);
      setShowResult(true);
      
      // Simulate price change based on message
      if (message.toLowerCase().includes('lower') || message.toLowerCase().includes('reduce') || message.toLowerCase().includes('bajar')) {
        setPrice(249);
      } else if (message.toLowerCase().includes('higher') || message.toLowerCase().includes('increase') || message.toLowerCase().includes('subir')) {
        setPrice(349);
      }
    }, 2000);
  };

  const renderTelegramStoreDemo = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <SiTelegram className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {language === 'es' ? 'Demo: Agente de Tienda Virtual IA' : 'Demo: AI Virtual Store Agent'}
        </h3>
        <p className="text-gray-600 mb-6">
          {language === 'es' 
            ? 'Tienda virtual futurista donde puedes cambiar precios enviando comandos por Telegram a un agente de IA'
            : 'Futuristic virtual store where you can change prices by sending Telegram commands to an AI agent'
          }
        </p>
      </div>

      {/* Virtual Store Demo */}
      <VirtualStoreDemo 
        onPriceUpdate={(productId, newPrice) => {
          console.log(`Product ${productId} price updated to ${newPrice}`);
        }}
      />

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
          <SiTelegram className="mr-2" />
          {language === 'es' ? 'Cómo usar la demo:' : 'How to use the demo:'}
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• {language === 'es' ? 'Navega entre productos usando las flechas' : 'Navigate between products using arrows'}</li>
          <li>• {language === 'es' ? 'Envía comandos como "Baja el precio a $2000"' : 'Send commands like "Lower the price to $2000"'}</li>
          <li>• {language === 'es' ? 'Prueba "Descuento 20%" o "Subir precio"' : 'Try "20% discount" or "Increase price"'}</li>
          <li>• {language === 'es' ? 'El agente de IA procesará tu mensaje y actualizará el precio' : 'The AI agent will process your message and update the price'}</li>
        </ul>
      </div>
    </div>
  );

  const renderVoiceAssistantDemo = () => (
    <div className="p-6 text-center">
      <div className="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaRobot className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">
        {language === 'es' ? 'Asistente de Voz IA' : 'AI Voice Assistant'}
      </h3>
      <p className="text-gray-600 mb-6">
        {language === 'es' 
          ? 'Esta demo muestra la integración real con ElevenLabs. Haz clic en el micrófono para hablar.'
          : 'This demo shows the real integration with ElevenLabs. Click the microphone to speak.'
        }
      </p>
      <div className="bg-gray-50 rounded-lg p-8">
        <p className="text-gray-500">
          {language === 'es' 
            ? 'Consulta la sección "AI Demos" para la experiencia completa'
            : 'Check the "AI Demos" section for the full experience'
          }
        </p>
      </div>
    </div>
  );

  const renderAutomationFlowDemo = () => (
    <div className="p-6">
      <div className="bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaRobot className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
        {language === 'es' ? 'Flujo de Automatización' : 'Automation Flow'}
      </h3>
      <p className="text-gray-600 text-center mb-6">
        {language === 'es' 
          ? 'Demo interactiva de un flujo de automatización n8n'
          : 'Interactive demo of an n8n automation flow'
        }
      </p>
      
      <div className="space-y-4">
        {[1, 2, 3, 4].map((step, index) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: currentStep >= index ? 1 : 0.3,
              x: 0 
            }}
            transition={{ delay: index * 0.5 }}
            className={`flex items-center p-4 rounded-lg border-2 ${
              currentStep >= index 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
              currentStep >= index 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > index ? <FaCheck /> : step}
            </div>
            <div>
              <h4 className="font-medium">
                {language === 'es' 
                  ? `Paso ${step}: ${['Recibir datos', 'Procesar con IA', 'Validar resultado', 'Ejecutar acción'][index]}`
                  : `Step ${step}: ${['Receive data', 'Process with AI', 'Validate result', 'Execute action'][index]}`
                }
              </h4>
              <p className="text-sm text-gray-600">
                {language === 'es' 
                  ? ['Webhook recibe solicitud', 'IA analiza contenido', 'Sistema valida respuesta', 'Acción automatizada'][index]
                  : ['Webhook receives request', 'AI analyzes content', 'System validates response', 'Automated action'][index]
                }
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => setCurrentStep(currentStep < 4 ? currentStep + 1 : 0)}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          {currentStep < 4 
            ? (language === 'es' ? 'Siguiente Paso' : 'Next Step')
            : (language === 'es' ? 'Reiniciar' : 'Restart')
          }
        </button>
      </div>
    </div>
  );

  const renderTelegramVoiceAssistantDemo = () => (
    <TelegramVoiceAssistantDemo />
  );

  const renderContent = () => {
    switch (demoType) {
      case 'telegram-store':
        return renderTelegramStoreDemo();
      case 'voice-assistant':
        return renderVoiceAssistantDemo();
      case 'automation-flow':
        return renderAutomationFlowDemo();
      case 'telegram-voice-assistant':
        return renderTelegramVoiceAssistantDemo();
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden relative shadow-2xl"
          >
            {/* Close Button - Fixed positioning */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-3 bg-white hover:bg-gray-100 rounded-full transition-colors z-[10000] shadow-lg border border-gray-200"
            >
              <FaTimes className="w-5 h-5 text-gray-700" />
            </button>
            
            {/* Scrollable Content */}
            <div className="max-h-[95vh] overflow-y-auto">
              {renderContent()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIDemoModal;