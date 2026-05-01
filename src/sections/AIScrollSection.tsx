import React, { useEffect, useRef, useState } from 'react';
import { useScroll, motion, useMotionValueEvent } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const TOTAL_FRAMES = 100;

function getFramePath(index: number): string {
  return `/frames/frame_${String(index).padStart(3, '0')}.jpg`;
}

const beats = [
  {
    range: [0, 0.3] as [number, number],
    es: 'Inteligencia Artificial',
    en: 'Artificial Intelligence',
    sub_es: 'Soluciones que piensan por ti',
    sub_en: 'Solutions that think for you',
  },
  {
    range: [0.3, 0.65] as [number, number],
    es: 'Automatización Total',
    en: 'Full Automation',
    sub_es: 'Procesos inteligentes, resultados reales',
    sub_en: 'Smart processes, real results',
  },
  {
    range: [0.65, 1] as [number, number],
    es: 'El Futuro es Ahora',
    en: 'The Future is Now',
    sub_es: 'Transforma tu negocio hoy',
    sub_en: 'Transform your business today',
  },
];

const AIScrollSection: React.FC = () => {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [activeBeat, setActiveBeat] = useState(0);
  const [beatOpacity, setBeatOpacity] = useState(1);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Preload all frames
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) setLoaded(true);
      };
      images[i] = img;
    }
    framesRef.current = images;
  }, []);

  // Update frame and active beat on scroll
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const frame = Math.min(
      TOTAL_FRAMES - 1,
      Math.floor(progress * TOTAL_FRAMES)
    );
    setCurrentFrame(frame);

    const beatIndex = beats.findIndex(
      (b) => progress >= b.range[0] && progress < b.range[1]
    );
    const idx = beatIndex === -1 ? beats.length - 1 : beatIndex;

    if (idx !== activeBeat) {
      setBeatOpacity(0);
      setTimeout(() => {
        setActiveBeat(idx);
        setBeatOpacity(1);
      }, 200);
    }
  });

  // Draw frame on canvas
  useEffect(() => {
    if (!loaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = framesRef.current[currentFrame];
    if (!img) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
  }, [currentFrame, loaded]);

  const beat = beats[activeBeat];

  return (
    <section
      ref={containerRef}
      style={{ height: '300vh' }}
      className="relative"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: loaded ? 'block' : 'none' }}
        />

        {/* Loading state */}
        {!loaded && (
          <div className="absolute inset-0 bg-gray-950 flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Dark gradient overlay — bottom blend into next section */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 70%, rgba(17,24,39,1) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top gradient — blend from hero */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(17,24,39,1) 0%, transparent 15%)',
            pointerEvents: 'none',
          }}
        />

        {/* Beat text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          style={{
            opacity: beatOpacity,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        >
          <h2
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4"
            style={{
              textShadow: '0 2px 40px rgba(0,0,0,0.8)',
              letterSpacing: '-0.02em',
            }}
          >
            {language === 'es' ? beat.es : beat.en}
          </h2>
          <p
            className="text-lg sm:text-xl md:text-2xl text-blue-300 font-light"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}
          >
            {language === 'es' ? beat.sub_es : beat.sub_en}
          </p>
        </div>

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 h-0.5 bg-blue-500 origin-left"
          style={{
            width: '120px',
            scaleX: scrollYProgress,
            opacity: 0.7,
          }}
        />

        {/* Frame counter (dev hint — subtle) */}
        <div
          className="absolute bottom-8 right-6 text-xs text-gray-500 font-mono"
          style={{ opacity: 0.4 }}
        >
          {String(currentFrame + 1).padStart(3, '0')} / {TOTAL_FRAMES}
        </div>
      </div>
    </section>
  );
};

export default AIScrollSection;
