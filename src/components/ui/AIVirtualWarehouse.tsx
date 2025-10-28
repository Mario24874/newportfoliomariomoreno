import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTelegram, FaPaperPlane, FaSpinner, FaCheck, FaBoxOpen } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';

interface SodaProduct {
  id: number;
  name: string;
  nameEs: string;
  brand: string;
  brandEs: string;
  image: string;
  bgColor: string;
  category: string;
  categoryEs: string;
  description: string;
  descriptionEs: string;
}

interface Presentation {
  type: 'unit' | '6pack' | '24pack';
  label: string;
  labelEs: string;
  price: number;
  units: number;
}

const AIVirtualWarehouse: React.FC = () => {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const products: SodaProduct[] = [
    {
      id: 1,
      name: 'Sprite Soda',
      nameEs: 'Sprite Soda',
      brand: 'SPRITE',
      brandEs: 'SPRITE',
      image: '/images/item1.png',
      bgColor: '#00D856',
      category: 'Lemon-Lime Soda',
      categoryEs: 'Refresco de Limón-Lima',
      description: 'Refreshing lemon-lime flavored soda with crisp, clean taste.',
      descriptionEs: 'Refrescante refresco con sabor a limón-lima con un sabor fresco y limpio.'
    },
    {
      id: 2,
      name: 'Fanta Soda',
      nameEs: 'Fanta Soda',
      brand: 'FANTA',
      brandEs: 'FANTA',
      image: '/images/item2.png',
      bgColor: '#FF8C00',
      category: 'Orange Soda',
      categoryEs: 'Refresco de Naranja',
      description: 'Delicious orange flavored soda bursting with fruity flavor.',
      descriptionEs: 'Delicioso refresco con sabor a naranja lleno de sabor frutal.'
    },
    {
      id: 3,
      name: 'Coca-Cola Original',
      nameEs: 'Coca-Cola Original',
      brand: 'COCA-COLA',
      brandEs: 'COCA-COLA',
      image: '/images/item3.png',
      bgColor: '#E71D36',
      category: 'Classic Cola',
      categoryEs: 'Cola Clásica',
      description: 'The original and iconic cola taste that started it all.',
      descriptionEs: 'El sabor de cola original e icónico que comenzó todo.'
    }
  ];

  const presentations: Presentation[] = [
    {
      type: 'unit',
      label: 'Single Unit',
      labelEs: 'Unidad',
      price: 1.00,
      units: 1
    },
    {
      type: '6pack',
      label: '6-Pack',
      labelEs: 'Paquete de 6',
      price: 5.50,
      units: 6
    },
    {
      type: '24pack',
      label: '24-Pack Box',
      labelEs: 'Caja de 24',
      price: 20.00,
      units: 24
    }
  ];

  const [productsState, setProductsState] = useState(
    products.map(product => ({
      ...product,
      presentation: presentations[0]
    }))
  );

  const currentProduct = productsState[currentSlide];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % productsState.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + productsState.length) % productsState.length);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    setShowResult(false);

    // Simulate AI processing
    setTimeout(() => {
      const currentProductData = productsState[currentSlide];
      let newPresentation = currentProductData.presentation;
      let presentationChanged = false;

      const messageLower = message.toLowerCase();

      // Check for presentation change commands
      const unitKeywords = ['unit', 'unidad', 'single', 'individual', '1'];
      const sixPackKeywords = ['6', 'six', 'seis', '6-pack', '6pack', 'paquete'];
      const twentyFourKeywords = ['24', 'twenty', 'veinticuatro', '24-pack', '24pack', 'caja', 'box'];

      if (unitKeywords.some(keyword => messageLower.includes(keyword))) {
        newPresentation = presentations[0];
        presentationChanged = true;
      } else if (sixPackKeywords.some(keyword => messageLower.includes(keyword))) {
        newPresentation = presentations[1];
        presentationChanged = true;
      } else if (twentyFourKeywords.some(keyword => messageLower.includes(keyword))) {
        newPresentation = presentations[2];
        presentationChanged = true;
      }

      if (presentationChanged) {
        setProductsState(prev => {
          const newProducts = prev.map(product =>
            product.id === currentProductData.id
              ? { ...product, presentation: newPresentation }
              : product
          );
          return newProducts;
        });
      }

      setIsLoading(false);
      setShowResult(presentationChanged);
      setMessage('');

      setTimeout(() => setShowResult(false), 3000);
    }, 1500);
  };

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
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-[10rem] font-black text-white uppercase leading-none select-none"
            style={{
              textShadow: '0 0 40px rgba(0,0,0,0.3)',
              WebkitTextStroke: '2px rgba(255,255,255,0.1)'
            }}
          >
            {language === 'es' ? currentProduct.brandEs : currentProduct.brand}
          </motion.div>
        </div>

        {/* Logo/Brand */}
        <div className="absolute top-6 left-6 z-10">
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            <FaBoxOpen className="inline-block mr-2" />
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
                      backgroundImage: `url(${currentProduct.image}), url(/images/soda.png)`,
                      backgroundPosition: '0 0, 0 0',
                      backgroundSize: '100% auto, 100% auto',
                      backgroundRepeat: 'no-repeat, no-repeat',
                      backgroundBlendMode: 'multiply',
                      WebkitMaskImage: 'url(/images/soda.png)',
                      WebkitMaskSize: '100% auto',
                      WebkitMaskRepeat: 'no-repeat',
                      maskImage: 'url(/images/soda.png)',
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

                  {/* Presentation Display */}
                  <motion.div
                    key={`presentation-${currentProduct.id}-${currentProduct.presentation.type}`}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                    className="mb-6 bg-white/20 backdrop-blur-md rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium opacity-80 mb-1">
                          {language === 'es' ? 'PRESENTACIÓN' : 'PRESENTATION'}
                        </div>
                        <div className="text-2xl font-bold">
                          {language === 'es' ? currentProduct.presentation.labelEs : currentProduct.presentation.label}
                        </div>
                        <div className="text-sm opacity-80">
                          {currentProduct.presentation.units} {language === 'es' ? 'unidades' : 'units'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium opacity-80 mb-1">
                          {language === 'es' ? 'PRECIO' : 'PRICE'}
                        </div>
                        <div className="text-4xl font-black">
                          ${currentProduct.presentation.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-white/90 leading-relaxed text-sm"
                  >
                    {language === 'es' ? currentProduct.descriptionEs : currentProduct.description}
                  </motion.p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Product Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
          {productsState.map((_, index) => (
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

      {/* Telegram Control Panel */}
      <div className="h-[200px] bg-gradient-to-b from-gray-900 to-black">
        {/* Quick Command Buttons */}
        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2 bg-gray-800/50">
          <button
            onClick={() => setMessage(language === 'es' ? 'Cambiar a unidad' : 'Change to unit')}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
            disabled={isLoading}
          >
            {language === 'es' ? 'Cambiar a Unidad' : 'Change to Unit'}
          </button>
          <button
            onClick={() => setMessage(language === 'es' ? 'Cambiar a 6-pack' : 'Change to 6-pack')}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
            disabled={isLoading}
          >
            {language === 'es' ? 'Cambiar a 6-Pack' : 'Change to 6-Pack'}
          </button>
          <button
            onClick={() => setMessage(language === 'es' ? 'Cambiar a caja de 24' : 'Change to 24-pack box')}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
            disabled={isLoading}
          >
            {language === 'es' ? 'Cambiar a Caja 24' : 'Change to Box 24'}
          </button>
        </div>

        <div className="px-4 py-3 flex items-center space-x-3">
          <FaTelegram className="text-blue-400 text-xl flex-shrink-0" />
          <div className="flex-1 flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'es'
                ? 'Escribe un comando para cambiar presentación...'
                : 'Write a command to change presentation...'
              }
              className="flex-1 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              disabled={isLoading}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="px-4 text-blue-400 text-sm flex items-center space-x-2">
            <FaSpinner className="animate-spin" />
            <span>
              {language === 'es' ? 'Procesando comando...' : 'Processing command...'}
            </span>
          </div>
        )}

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 bg-green-600/20 border-t border-green-500/50 py-2 text-green-400 text-sm flex items-center space-x-2"
          >
            <FaCheck />
            <span>
              {language === 'es'
                ? `Presentación actualizada a ${currentProduct.presentation.labelEs} - $${currentProduct.presentation.price.toFixed(2)}`
                : `Presentation updated to ${currentProduct.presentation.label} - $${currentProduct.presentation.price.toFixed(2)}`
              }
            </span>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="px-4 py-2 text-gray-400 text-xs text-center">
          {language === 'es'
            ? '💡 Prueba: "Cambiar a 6-pack", "Unidad", "Caja de 24"'
            : '💡 Try: "Change to 6-pack", "Unit", "Box of 24"'
          }
        </div>
      </div>
    </div>
  );
};

export default AIVirtualWarehouse;
