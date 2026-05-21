// src/App.tsx
import React, { Suspense, useState, useEffect } from 'react';
import Lenis from 'lenis';
import Analytics from '@/components/Analytics';
import ReviewWidget from '@/components/ReviewWidget';
import HeaderMUI from '@/components/layout/HeaderMUI';
import HeroSection from '@/sections/HeroSection';
import { YOUR_WHATSAPP_NUMBER } from '@/data/portfolioData';
import { useTheme } from '@/contexts/ThemeContext';

const VISIT_API = 'https://app.mariomoreno.work/api/analytics/visit';

function trackVisit() {
  if (sessionStorage.getItem('pv_sent')) return;
  const session_id = crypto.randomUUID();
  sessionStorage.setItem('pv_sent', '1');
  fetch(VISIT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id,
      page: 'home',
      referrer: document.referrer || null,
    }),
  }).catch(() => {});
}

const AIScrollSection = React.lazy(() => import('@/sections/AIScrollSection'));
const AboutSection = React.lazy(() => import('@/sections/AboutSection'));
const SkillsSection = React.lazy(() => import('@/sections/SkillsSection'));
const ProjectsSection = React.lazy(() => import('@/sections/ProjectsSection'));
const DemosSection = React.lazy(() => import('@/sections/DemosSection'));
const MobileAppsSection = React.lazy(() => import('@/sections/MobileAppsSection'));
const ClientSection = React.lazy(() => import('@/sections/ClientSection'));
const ContactSection = React.lazy(() => import('@/sections/ContactSection'));
const Footer = React.lazy(() => import('@/components/layout/Footer'));
const WhatsAppWidget = React.lazy(() => import('@/components/ui/WhatsAppWidget'));
const PrivacyPolicy = React.lazy(() => import('@/components/ui/PrivacyPolicy'));
const TermsConditions = React.lazy(() => import('@/components/ui/TermsConditions'));

const App: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    trackVisit();
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
        <Suspense fallback={null}>
          <AIScrollSection />
          <AboutSection />
          <SkillsSection />
          <ProjectsSection />
          <DemosSection />
          <MobileAppsSection />
          <ClientSection />
          <ContactSection />
        </Suspense>
      </main>
      <ReviewWidget />
      <Suspense fallback={null}>
        <WhatsAppWidget phoneNumber={YOUR_WHATSAPP_NUMBER} />
        <Footer
          onPrivacyClick={() => setShowPrivacyPolicy(true)}
          onTermsClick={() => setShowTerms(true)}
        />
        <PrivacyPolicy isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
        <TermsConditions isOpen={showTerms} onClose={() => setShowTerms(false)} />
      </Suspense>
    </div>
  );
};

export default App;
