import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTelegram, FaPaperPlane, FaSpinner, FaRobot, FaBoxOpen, FaTag } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';

interface SodaProduct {
  id: number;
  name: string;
  nameEs: string;
  flavor: string;
  flavorEs: string;
  image: string;
  bgColor: string;
  category: string;
  categoryEs: string;
}

interface Presentation {
  type: 'unit' | '6pack' | '24pack';
  label: string;
  labelEs: string;
  basePrice: number;
  icon: string;
}

interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const AIVirtualWarehouse: React.FC = () => {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPresentation, setCurrentPresentation] = useState<Presentation['type']>('unit');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: language === 'es'
        ? '👋 ¡Bienvenido al Almacén Virtual AI! Puedo ayudarte a cambiar presentaciones y precios.'
        : '👋 Welcome to AI Virtual Warehouse! I can help you change presentations and prices.',
      isBot: true,
      timestamp: new Date()
    }
  ]);

  const products: SodaProduct[] = [
    {
      id: 1,
      name: 'Lemon Soda',
      nameEs: 'Soda de Limón',
      flavor: 'Lemon',
      flavorEs: 'Limón',
      image: '/slider_soda-main/images/item1.png',
      bgColor: '#428372',
      category: 'Fruit Soda',
      categoryEs: 'Soda de Frutas'
    },
    {
      id: 2,
      name: 'Orange Soda',
      nameEs: 'Soda de Naranja',
      flavor: 'Orange',
      flavorEs: 'Naranja',
      image: '/slider_soda-main/images/item2.png',
      bgColor: '#EEAA19',
      category: 'Fruit Soda',
      categoryEs: 'Soda de Frutas'
    },
    {
      id: 3,
      name: 'Apple Soda',
      nameEs: 'Soda de Manzana',
      flavor: 'Apple',
      flavorEs: 'Manzana',
      image: '/slider_soda-main/images/item3.png',
      bgColor: '#e86c3f',
      category: 'Fruit Soda',
      categoryEs: 'Soda de Frutas'
    }
  ];

  const presentations: Presentation[] = [
    {
      type: 'unit',
      label: 'Single Unit',
      labelEs: 'Unidad',
      basePrice: 1,
      icon: '🥤'
    },
    {
      type: '6pack',
      label: '6-Pack',
      labelEs: 'Paquete de 6',
      basePrice: 5.50,
      icon: '📦'
    },
    {
      type: '24pack',
      label: '24-Pack Box',
      labelEs: 'Caja de 24',
      basePrice: 20,
      icon: '📦'
    }
  ];

  const currentProduct = products[currentSlide];
  const currentPresentationData = presentations.find(p => p.type === currentPresentation)!;
  const currentPrice = currentPresentationData.basePrice;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
  };

  const addChatMessage = (text: string, isBot: boolean) => {
    const newMessage: ChatMessage = {
      id: Date.now(),
      text,
      isBot,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    addChatMessage(userMessage, false);
    setMessage('');
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const messageLower = userMessage.toLowerCase();
      let botResponse = '';
      let presentationChanged = false;

      // Check for presentation change commands
      if (messageLower.includes('unit') || messageLower.includes('unidad') || messageLower.includes('single')) {
        setCurrentPresentation('unit');
        botResponse = language === 'es'
          ? `✅ Presentación cambiada a Unidad. Precio actualizado: $${presentations[0].basePrice}`
          : `✅ Presentation changed to Single Unit. Price updated: $${presentations[0].basePrice}`;
        presentationChanged = true;
      } else if (messageLower.includes('6') || messageLower.includes('six') || messageLower.includes('seis')) {
        setCurrentPresentation('6pack');
        botResponse = language === 'es'
          ? `✅ Presentación cambiada a 6-Pack. Precio actualizado: $${presentations[1].basePrice}`
          : `✅ Presentation changed to 6-Pack. Price updated: $${presentations[1].basePrice}`;
        presentationChanged = true;
      } else if (messageLower.includes('24') || messageLower.includes('box') || messageLower.includes('caja')) {
        setCurrentPresentation('24pack');
        botResponse = language === 'es'
          ? `✅ Presentación cambiada a Caja de 24. Precio actualizado: $${presentations[2].basePrice}`
          : `✅ Presentation changed to 24-Pack Box. Price updated: $${presentations[2].basePrice}`;
        presentationChanged = true;
      } else {
        botResponse = language === 'es'
          ? '❌ Comando no reconocido. Prueba: "cambiar a unidad", "cambiar a 6-pack" o "cambiar a caja de 24"'
          : '❌ Command not recognized. Try: "change to unit", "change to 6-pack" or "change to 24-pack box"';
      }

      addChatMessage(botResponse, true);
      setIsLoading(false);
    }, 1000);
  };

  const quickCommands = [
    {
      text: language === 'es' ? 'Cambiar a Unidad' : 'Change to Unit',
      command: language === 'es' ? 'Cambiar a unidad' : 'Change to unit'
    },
    {
      text: language === 'es' ? 'Cambiar a 6-Pack' : 'Change to 6-Pack',
      command: language === 'es' ? 'Cambiar a 6-pack' : 'Change to 6-pack'
    },
    {
      text: language === 'es' ? 'Cambiar a Caja 24' : 'Change to Box 24',
      command: language === 'es' ? 'Cambiar a caja de 24' : 'Change to 24-pack box'
    }
  ];

  return (
    <div className="ai-virtual-warehouse relative w-full h-[700px] rounded-xl overflow-hidden shadow-2xl">
      {/* Main Carousel Section */}
      <div
        className="relative h-[500px] transition-colors duration-700"
        style={{ backgroundColor: currentProduct.bgColor }}
      >
        {/* Large Background Text Effect */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-[12rem] font-black text-white uppercase leading-none select-none"
            style={{
              textShadow: '0 0 40px rgba(0,0,0,0.3)',
              WebkitTextStroke: '2px rgba(255,255,255,0.1)'
            }}
          >
            {language === 'es' ? currentProduct.flavorEs : currentProduct.flavor}
          </motion.div>
        </div>

        {/* Logo/Brand */}
        <div className="absolute top-6 left-6 z-10">
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            <FaRobot className="inline-block mr-2" />
            <span className="text-white/90">AI</span> WAREHOUSE
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
        >
          <FaChevronLeft className="text-white text-xl" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
        >
          <FaChevronRight className="text-white text-xl" />
        </button>

        {/* Product Display */}
        <div className="relative h-full flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, clipPath: 'polygon(0 0, 0 0, 0 100%, 0% 100%)' }}
              animate={{ opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              className="w-full h-full relative"
            >
              {/* Product Layout */}
              <div className="container mx-auto h-full flex items-center justify-between px-12">
                {/* Product Image with Mask Effect */}
                <motion.div
                  initial={{ x: -200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative w-80 h-full flex items-center"
                >
                  <div
                    className="w-72 h-[450px] relative"
                    style={{
                      backgroundImage: `${currentProduct.image}, url(/slider_soda-main/images/soda.png)`,
                      backgroundPosition: '0 0, 0 0',
                      backgroundSize: '100% auto, 100% auto',
                      backgroundRepeat: 'no-repeat, no-repeat',
                      backgroundBlendMode: 'multiply',
                      WebkitMaskImage: 'url(/slider_soda-main/images/soda.png)',
                      WebkitMaskSize: '100% auto',
                      WebkitMaskRepeat: 'no-repeat',
                      maskImage: 'url(/slider_soda-main/images/soda.png)',
                      maskSize: '100% auto',
                      maskRepeat: 'no-repeat',
                      filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))'
                    }}
                  />
                </motion.div>

                {/* Product Info */}
                <motion.div
                  initial={{ x: 200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="flex-1 max-w-md text-white"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-2 text-sm font-medium opacity-90"
                  >
                    {language === 'es' ? currentProduct.categoryEs : currentProduct.category}
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-5xl font-black mb-6 uppercase leading-tight"
                  >
                    {language === 'es' ? currentProduct.nameEs : currentProduct.name}
                  </motion.h1>

                  {/* Presentation Selector */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mb-6"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <FaBoxOpen className="text-white/80" />
                      <span className="text-sm font-medium opacity-90">
                        {language === 'es' ? 'PRESENTACIÓN' : 'PRESENTATION'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {presentations.map((pres) => (
                        <button
                          key={pres.type}
                          onClick={() => setCurrentPresentation(pres.type)}
                          className={`p-3 rounded-lg backdrop-blur-md transition-all duration-300 ${
                            currentPresentation === pres.type
                              ? 'bg-white text-gray-900 shadow-lg scale-105'
                              : 'bg-white/20 hover:bg-white/30'
                          }`}
                        >
                          <div className="text-2xl mb-1">{pres.icon}</div>
                          <div className="text-xs font-semibold">
                            {language === 'es' ? pres.labelEs : pres.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Price Display */}
                  <motion.div
                    key={`price-${currentPresentation}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                    className="mb-6"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <FaTag className="text-white/80" />
                      <span className="text-sm font-medium opacity-90">
                        {language === 'es' ? 'PRECIO' : 'PRICE'}
                      </span>
                    </div>
                    <div className="text-6xl font-black text-white drop-shadow-lg">
                      ${currentPrice.toFixed(2)}
                    </div>
                    <div className="text-sm opacity-80 mt-1">
                      {language === 'es' ? currentPresentationData.labelEs : currentPresentationData.label}
                    </div>
                  </motion.div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="text-white/90 leading-relaxed"
                  >
                    {language === 'es'
                      ? 'Refresco de frutas premium con sabor natural. Perfecto para cualquier ocasión.'
                      : 'Premium fruit soda with natural flavor. Perfect for any occasion.'}
                  </motion.p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Product Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 w-2 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Telegram Chat Simulation */}
      <div className="h-[200px] bg-gradient-to-b from-gray-900 to-black">
        {/* Chat Header */}
        <div className="bg-blue-600 px-4 py-2 flex items-center space-x-2">
          <FaTelegram className="text-white text-xl" />
          <div className="flex-1">
            <div className="text-white font-semibold text-sm">
              {language === 'es' ? 'Asistente de Almacén' : 'Warehouse Assistant'}
            </div>
            <div className="text-blue-100 text-xs">
              {isLoading ? (language === 'es' ? 'Escribiendo...' : 'Typing...') : 'Online'}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-24 overflow-y-auto px-4 py-2 space-y-2 bg-gray-800">
          {chatMessages.slice(-3).map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                  msg.isBot
                    ? 'bg-gray-700 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-white px-3 py-2 rounded-lg">
                <FaSpinner className="animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Quick Commands */}
        <div className="px-4 py-1 flex gap-2 bg-gray-800/50">
          {quickCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => setMessage(cmd.command)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-full transition-colors"
              disabled={isLoading}
            >
              {cmd.text}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-2 bg-gray-900 flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={language === 'es'
              ? 'Escribe un comando...'
              : 'Type a command...'
            }
            className="flex-1 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white p-2 rounded-lg transition-colors"
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIVirtualWarehouse;
