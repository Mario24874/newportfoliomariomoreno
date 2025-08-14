// src/sections/HeroSection.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, Box } from '@mui/material';
import { YOUR_NAME } from '@/data/portfolioData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';
import { getHeroBackgroundConfig, generateEdgeFadeStyle, generateVignetteStyle } from '@/data/heroConfig';

const HeroSection: React.FC = () => {
    const { language } = useLanguage();
    const { isDarkMode } = useTheme();
    const t = translations[language];
    
    // Configuración de fondo basada en el tema
    const backgroundConfig = getHeroBackgroundConfig(isDarkMode);
    
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isWaiting, setIsWaiting] = useState(false);

    const heroTexts = [`${t.hero.greeting} ${YOUR_NAME}`];

    useEffect(() => {
        const typeSpeed = 120;
        const deleteSpeed = 75;
        const waitTime = 3000; // 3 segundos de pausa con cursor parpadeando

        const handleTyping = () => {
            const currentText = heroTexts[textIndex];
            
            if (isWaiting) {
                // Después de esperar, empezar a borrar
                setIsWaiting(false);
                setIsDeleting(true);
                return;
            }

            if (isDeleting) {
                // Borrando texto
                if (charIndex > 0) {
                    setDisplayedText(currentText.substring(0, charIndex - 1));
                    setCharIndex(prev => prev - 1);
                } else {
                    // Terminó de borrar, cambiar al siguiente texto y empezar a escribir
                    setIsDeleting(false);
                    setTextIndex(prev => (prev + 1) % heroTexts.length);
                }
            } else {
                // Escribiendo texto
                if (charIndex < currentText.length) {
                    setDisplayedText(currentText.substring(0, charIndex + 1));
                    setCharIndex(prev => prev + 1);
                } else {
                    // Terminó de escribir, esperar 3 segundos
                    setIsWaiting(true);
                    setTimeout(() => {
                        setIsWaiting(false);
                        setIsDeleting(true);
                    }, waitTime);
                    return;
                }
            }
        };

        if (!isWaiting) {
            const typingTimer = setTimeout(handleTyping, isDeleting ? deleteSpeed : typeSpeed);
            return () => clearTimeout(typingTimer);
        }
    }, [charIndex, isDeleting, textIndex, isWaiting, heroTexts]);

    const renderAnimatedText = () => {
        // Encontrar la posición del nombre en el texto
        const greetingText = t.hero.greeting;
        const nameStartIndex = greetingText.length + 1; // +1 por el espacio
        
        if (displayedText.length <= nameStartIndex) {
            // Solo mostrar el saludo
            return <span>{displayedText}</span>;
        } else {
            // Mostrar saludo + nombre (con color)
            const greeting = displayedText.substring(0, nameStartIndex);
            const name = displayedText.substring(nameStartIndex);
            return (
                <>
                    <span>{greeting}</span>
                    <span className="text-blue-400">{name}</span>
                </>
            );
        }
    };

    return (
        <section id="about" className="min-h-screen flex items-center justify-center text-center px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative overflow-hidden">
            {/* Background Image with Fade Effect */}
            <div className="absolute inset-0 z-0">
                {/* Main background image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transform"
                    style={{
                        backgroundImage: `url(${backgroundConfig.imageUrl})`,
                        filter: `blur(${backgroundConfig.effects.blur}px) brightness(${backgroundConfig.effects.brightness})`,
                        transform: `scale(${backgroundConfig.effects.scale})`,
                        willChange: 'transform',
                    }}
                />
                
                {/* Multi-layer gradient overlay for smooth blending */}
                <div className={`absolute inset-0 bg-gradient-to-b ${backgroundConfig.overlay.primary}`} />
                
                {/* Radial fade effect from center */}
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-radial' : 'bg-gradient-radial-light'}`} />
                
                {/* Edge fade effect for seamless blending */}
                <div 
                    className="absolute inset-0" 
                    style={{ background: generateEdgeFadeStyle(isDarkMode) }}
                />
                
                {/* Additional vignette effect */}
                <div 
                    className="absolute inset-0"
                    style={{ background: generateVignetteStyle(isDarkMode) }}
                />
            </div>
            
            <div className="container mx-auto max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6 sm:space-y-8"
                >
                    {/* Main Heading - Fully responsive */}
                    <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-tight">
                        <span className="block">
                            {renderAnimatedText()}
                            <span className={`border-r-2 border-white transition-opacity duration-200 ${isWaiting || (charIndex === heroTexts[textIndex].length && !isDeleting) ? 'animate-blink' : 'opacity-100'}`}> </span>
                        </span>
                    </h1>
                    
                    {/* Subtitle - Responsive sizing */}
                    <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-300 font-light leading-relaxed">
                        {t.hero.title}
                    </p>
                    
                    {/* Description - Better spacing and sizing */}
                    <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-4">
                        {t.hero.subtitle}
                    </p>
                    
                    {/* CTA Buttons - Responsive layout with MUI */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="pt-4 sm:pt-6 lg:pt-8"
                    >
                        <Box 
                            sx={{ 
                                display: 'flex', 
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 2, sm: 3 },
                                justifyContent: 'center',
                                alignItems: 'center',
                                maxWidth: { xs: 'md', sm: 'none' },
                                mx: 'auto'
                            }}
                        >
                            <Button 
                                href="#projects"
                                variant="contained"
                                color="primary"
                                size="large"
                                sx={{
                                    width: { xs: '100%', sm: 'auto' },
                                    px: { xs: 3, sm: 4, lg: 5 },
                                    py: { xs: 1.5, sm: 2 },
                                    fontSize: { xs: '1rem', sm: '1.125rem', lg: '1.25rem' },
                                    fontWeight: 'bold',
                                    boxShadow: 3,
                                    '&:hover': {
                                        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                                    }
                                }}
                            >
                                {t.hero.viewWork}
                            </Button>
                            <Button 
                                href="#contact"
                                variant="outlined"
                                color="primary"
                                size="large"
                                sx={{
                                    width: { xs: '100%', sm: 'auto' },
                                    px: { xs: 3, sm: 4, lg: 5 },
                                    py: { xs: 1.5, sm: 2 },
                                    fontSize: { xs: '1rem', sm: '1.125rem', lg: '1.25rem' },
                                    fontWeight: 'bold',
                                    borderColor: 'rgba(156, 163, 175, 0.5)',
                                    color: 'text.secondary',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                        color: 'text.primary',
                                    }
                                }}
                            >
                                {t.hero.cta}
                            </Button>
                        </Box>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;