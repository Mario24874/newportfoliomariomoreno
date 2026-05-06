// src/App.tsx
import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import Analytics from '@/components/Analytics';
import HeaderMUI from '@/components/layout/HeaderMUI';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/sections/HeroSection';
import AIScrollSection from '@/sections/AIScrollSection';
import SkillsSection from '@/sections/SkillsSection';
import ProjectsSection from '@/sections/ProjectsSection';
import DemosSection from '@/sections/DemosSection';
import MobileAppsSection from '@/sections/MobileAppsSection';
import AboutSection from '@/sections/AboutSection';
import ContactSection from '@/sections/ContactSection';
import WhatsAppWidget from '@/components/ui/WhatsAppWidget';
import PrivacyPolicy from '@/components/ui/PrivacyPolicy';
import TermsConditions from '@/components/ui/TermsConditions';
import { YOUR_WHATSAPP_NUMBER } from '@/data/portfolioData';
import { useTheme } from '@/contexts/ThemeContext';

const App: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gray-900 text-gray-100'
        : 'bg-white text-gray-900'
    }`}>
      <Analytics />
      <HeaderMUI />
      <main>
        <HeroSection />
        <AIScrollSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <DemosSection />
        <MobileAppsSection />
        <ContactSection />
      </main>
      <WhatsAppWidget phoneNumber={YOUR_WHATSAPP_NUMBER} />
      <Footer
        onPrivacyClick={() => setShowPrivacyPolicy(true)}
        onTermsClick={() => setShowTerms(true)}
      />
      <PrivacyPolicy isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
      <TermsConditions isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
};

export default App;