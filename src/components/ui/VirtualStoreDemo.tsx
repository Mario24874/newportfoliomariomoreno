import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaHeart, FaShoppingCart, FaTelegram, FaPaperPlane, FaSpinner, FaCheck } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';

interface Product {
  id: number;
  name: string;
  nameEs: string;
  price: number;
  originalPrice: number;
  image: string;
  background: string;
  specs: string[];
  specsEs: string[];
  durability: number;
}

interface VirtualStoreDemoProps {
  onPriceUpdate?: (productId: number, newPrice: number) => void;
}

const VirtualStoreDemo: React.FC<VirtualStoreDemoProps> = ({ onPriceUpdate }) => {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const products: Product[] = [
    {
      id: 1,
      name: 'AI NEURAL PROCESSOR',
      nameEs: 'PROCESADOR NEURAL IA',
      price: 2999,
      originalPrice: 2999,
      image: 'https://res.cloudinary.com/muhammederdem/image/upload/q_60/v1536405217/starwars/item-1.webp',
      background: 'https://res.cloudinary.com/muhammederdem/image/upload/q_60/v1536405222/starwars/item-1-bg.webp',
      specs: ['GPU CORES: 10,000', 'MEMORY: 128GB'],
      specsEs: ['NÚCLEOS GPU: 10,000', 'MEMORIA: 128GB'],
      durability: 95
    },
    {
      id: 2,
      name: 'QUANTUM LAPTOP',
      nameEs: 'LAPTOP CUÁNTICA',
      price: 4599,
      originalPrice: 4599,
      image: 'https://res.cloudinary.com/muhammederdem/image/upload/q_60/v1536405217/starwars/item-2.webp',
      background: 'https://res.cloudinary.com/muhammederdem/image/upload/q_60/v1536405222/starwars/item-2-bg.webp',
      specs: ['QUANTUM CORES: 256', 'HOLOGRAPHIC DISPLAY'],
      specsEs: ['NÚCLEOS CUÁNTICOS: 256', 'PANTALLA HOLOGRÁFICA'],
      durability: 88
    },
    {
      id: 3,
      name: 'AI SMART DRONE',
      nameEs: 'DRONE INTELIGENTE IA',
      price: 1899,
      originalPrice: 1899,
      image: 'https://res.cloudinary.com/muhammederdem/image/upload/q_60/v1536405218/starwars/item-3.webp',
      background: 'https://res.cloudinary.com/muhammederdem/image/upload/q_60/v1536405215/starwars/item-3-bg.webp',
      specs: ['FLIGHT TIME: 4H', 'AI RECOGNITION'],
      specsEs: ['TIEMPO VUELO: 4H', 'RECONOCIMIENTO IA'],
      durability: 92
    },
    {
      id: 4,
      name: 'VR HEADSET PRO',
      nameEs: 'CASCO VR PROFESIONAL',
      price: 1299,
      originalPrice: 1299,
      image: 'https://res.cloudinary.com/muhammederdem/image/upload/q_60/v1536405215/starwars/item-4.webp',
      background: 'https://res.cloudinary.com/muhammederdem/image/upload/q_60/v1536405223/starwars/item-4-bg.webp',
      specs: ['RESOLUTION: 8K', 'REFRESH: 240Hz'],
      specsEs: ['RESOLUCIÓN: 8K', 'REFRESCO: 240Hz'],
      durability: 85
    }
  ];

  const [productsState, setProductsState] = useState(products);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % productsState.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + productsState.length) % productsState.length);
  };

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setShowResult(false);
    
    // Simulate AI processing
    setTimeout(() => {
      const currentProduct = productsState[currentSlide];
      let newPrice = currentProduct.price;
      let priceChanged = false;
      
      // Simple AI logic for price changes
      const lowerKeywords = ['lower', 'reduce', 'bajar', 'reducir', 'menos', 'descuento', 'discount'];
      const higherKeywords = ['higher', 'increase', 'subir', 'aumentar', 'más', 'premium', 'raise'];
      
      const messageLower = message.toLowerCase();
      console.log('Processing message:', messageLower);
      console.log('Current product:', currentProduct);
      
      // Check for percentage patterns first
      const percentageMatch = messageLower.match(/(\d+)%/);
      
      if (lowerKeywords.some(keyword => messageLower.includes(keyword))) {
        if (percentageMatch) {
          // Apply percentage discount
          const percentage = parseInt(percentageMatch[1]);
          newPrice = Math.floor(currentProduct.originalPrice * (1 - percentage / 100));
          console.log(`Applying ${percentage}% discount:`, newPrice);
        } else {
          // Extract specific price if present
          const priceMatch = messageLower.match(/\$?(\d+)/);
          if (priceMatch) {
            newPrice = parseInt(priceMatch[1]);
            console.log('Setting specific price:', newPrice);
          } else {
            newPrice = Math.floor(currentProduct.originalPrice * 0.8); // 20% discount
            console.log('Applying default 20% discount:', newPrice);
          }
        }
        priceChanged = true;
      } else if (higherKeywords.some(keyword => messageLower.includes(keyword))) {
        if (percentageMatch) {
          // Apply percentage increase
          const percentage = parseInt(percentageMatch[1]);
          newPrice = Math.floor(currentProduct.originalPrice * (1 + percentage / 100));
          console.log(`Applying ${percentage}% increase:`, newPrice);
        } else {
          // Extract specific price if present
          const priceMatch = messageLower.match(/\$?(\d+)/);
          if (priceMatch) {
            newPrice = parseInt(priceMatch[1]);
            console.log('Setting specific price:', newPrice);
          } else {
            newPrice = Math.floor(currentProduct.originalPrice * 1.2); // 20% increase
            console.log('Applying default 20% increase:', newPrice);
          }
        }
        priceChanged = true;
      }
      
      // Ensure price changed
      if (newPrice !== currentProduct.price) {
        priceChanged = true;
      }
      
      if (priceChanged) {
        // Update product price
        setProductsState(prev => {
          const newProducts = prev.map(product => 
            product.id === currentProduct.id 
              ? { ...product, price: newPrice }
              : product
          );
          console.log('Updated products state:', newProducts);
          return newProducts;
        });
        
        onPriceUpdate?.(currentProduct.id, newPrice);
      }
      
      setIsLoading(false);
      setShowResult(priceChanged);
      setMessage(''); // Clear message after processing
      
      // Auto-hide result after 3 seconds
      setTimeout(() => setShowResult(false), 3000);
    }, 1500); // Reduced delay for better UX
  };

  const currentProduct = productsState[currentSlide];

  return (
    <div className="virtual-store-demo relative w-full h-[600px] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src="https://res.cloudinary.com/muhammederdem/image/upload/v1536405234/starwars/death_star.jpg"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-slate-900/80" />
      </div>

      {/* Logo/Brand */}
      <div className="absolute top-6 left-6 z-10">
        <div className="text-2xl font-bold text-white">
          <span className="text-blue-400">AI</span> STORE
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={prevSlide}
        disabled={currentSlide === 0}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-blue-600/80 hover:bg-blue-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all duration-300"
      >
        <FaChevronLeft className="text-white" />
      </button>

      <button
        onClick={nextSlide}
        disabled={currentSlide === productsState.length - 1}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-blue-600/80 hover:bg-blue-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all duration-300"
      >
        <FaChevronRight className="text-white" />
      </button>

      {/* Product Display */}
      <div className="relative h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full relative"
          >
            {/* Product Background */}
            <img 
              src={currentProduct.background}
              alt={currentProduct.name}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            
            {/* Product Image */}
            <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80">
              <img 
                src={currentProduct.image}
                alt={currentProduct.name}
                className="w-full h-full object-contain filter drop-shadow-2xl"
              />
            </div>

            {/* Product Info */}
            <div className="absolute right-0 top-0 h-full w-1/2 p-8 flex flex-col justify-center text-white">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold mb-4 leading-tight"
              >
                {language === 'es' ? currentProduct.nameEs : currentProduct.name}
              </motion.h1>

              <motion.div 
                key={`price-${currentProduct.id}-${currentProduct.price}`} // Force re-render on price change
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  color: currentProduct.price !== currentProduct.originalPrice ? '#10B981' : '#3B82F6' // Green if changed, blue if original
                }}
                transition={{ 
                  delay: 0.4,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 200
                }}
                className="text-5xl font-bold mb-6 relative"
              >
                <span className={`transition-colors duration-500 ${
                  currentProduct.price !== currentProduct.originalPrice 
                    ? 'text-green-400' 
                    : 'text-blue-400'
                }`}>
                  ${currentProduct.price.toLocaleString()}
                </span>
                {currentProduct.price !== currentProduct.originalPrice && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xl text-gray-400 line-through ml-3"
                  >
                    ${currentProduct.originalPrice.toLocaleString()}
                  </motion.span>
                )}
                {currentProduct.price !== currentProduct.originalPrice && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full"
                  >
                    {currentProduct.price < currentProduct.originalPrice ? '↓' : '↑'}
                  </motion.div>
                )}
              </motion.div>

              {/* Specs */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold mb-3 text-blue-300">
                  {language === 'es' ? 'ESPECIFICACIONES' : 'SPECIFICATIONS'}
                </h3>
                <div className="space-y-2">
                  {(language === 'es' ? currentProduct.specsEs : currentProduct.specs).map((spec, index) => (
                    <div key={index} className="text-gray-300 text-sm">
                      {spec}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Durability */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-6"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgba(59, 130, 246, 0.3)"
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${currentProduct.durability * 2.51}, 251`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-400">
                        {currentProduct.durability}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-blue-300">
                      {language === 'es' ? 'CALIDAD' : 'QUALITY'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {language === 'es' ? 'ÍNDICE DE DURABILIDAD' : 'DURABILITY INDEX'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex space-x-4"
              >
                <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg flex items-center space-x-2">
                  <FaShoppingCart />
                  <span>{language === 'es' ? 'AGREGAR AL CARRITO' : 'ADD TO CART'}</span>
                </button>
                
                <button 
                  onClick={() => toggleFavorite(currentProduct.id)}
                  className={`p-3 rounded-lg transition-all duration-300 ${
                    favorites.has(currentProduct.id)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <FaHeart />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Telegram Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
        {/* Quick Command Buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setMessage(language === 'es' ? 'Descuento 20%' : '20% discount')}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
            disabled={isLoading}
          >
            {language === 'es' ? 'Descuento 20%' : '20% discount'}
          </button>
          <button
            onClick={() => setMessage(language === 'es' ? 'Bajar precio a $1500' : 'Lower price to $1500')}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
            disabled={isLoading}
          >
            {language === 'es' ? 'Precio $1500' : 'Price $1500'}
          </button>
          <button
            onClick={() => setMessage(language === 'es' ? 'Subir precio 10%' : 'Increase price 10%')}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
            disabled={isLoading}
          >
            {language === 'es' ? 'Subir 10%' : 'Increase 10%'}
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <FaTelegram className="text-blue-400 text-xl" />
          <div className="flex-1 flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'es' 
                ? 'Escribe un comando para cambiar el precio...'
                : 'Write a command to change the price...'
              }
              className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
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
          <div className="mt-2 text-blue-400 text-sm flex items-center space-x-2">
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
            className="mt-2 bg-green-600/20 border border-green-500/50 rounded-lg p-2 text-green-400 text-sm flex items-center space-x-2"
          >
            <FaCheck />
            <span>
              {language === 'es' 
                ? `Precio actualizado a $${currentProduct.price.toLocaleString()}`
                : `Price updated to $${currentProduct.price.toLocaleString()}`
              }
            </span>
          </motion.div>
        )}
      </div>

      {/* Product Indicators */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {productsState.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-blue-500 w-8' 
                : 'bg-gray-500 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default VirtualStoreDemo;