// src/App.tsx
import React from 'react';
import HeaderMUI from '@/components/layout/HeaderMUI';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/sections/HeroSection';
import SkillsSection from '@/sections/SkillsSection';
import ProjectsSection from '@/sections/ProjectsSection';
import DemosSection from '@/sections/DemosSection';
import MobileAppsSection from '@/sections/MobileAppsSection';
import ContactSection from '@/sections/ContactSection';
import WhatsAppWidget from '@/components/ui/WhatsAppWidget';
import { YOUR_WHATSAPP_NUMBER } from '@/data/portfolioData';
import { useTheme } from '@/contexts/ThemeContext';

const App: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-white text-gray-900'
    }`}>
      <HeaderMUI />
      <main>
        <HeroSection />
        <SkillsSection />
        <ProjectsSection />
        <DemosSection />
        <MobileAppsSection />
        <ContactSection />
      </main>
      <WhatsAppWidget phoneNumber={YOUR_WHATSAPP_NUMBER} />
      <Footer />
    </div>
  );
};

export default App;