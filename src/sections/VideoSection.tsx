import React from 'react';
import { motion } from 'framer-motion';
import { HiExternalLink } from 'react-icons/hi';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';
import { trackEvent } from '@/lib/analytics';

const MEDIA = 'https://store.mariomoreno.work/media/videos';
const STORE = 'https://store.mariomoreno.work';
const UTM = 'utm_source=portfolio&utm_medium=video&utm_campaign=n8n-asistente-ia';

/** Video del asistente de IA con n8n: se reproduce en el idioma seleccionado en la página (EN/ES) con sus subtítulos. */
const VideoSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const t = translations[language].videoShowcase;
  const pre = language === 'es' ? '/es' : '';
  const link = (path: string) => `${STORE}${pre}${path}?${UTM}`;
  const played = React.useRef<string>('');

  return (
    <section id="video" className={`py-20 transition-colors duration-300 ${
      isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-white'
    }`}>
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.title}</h2>
          <p className={`max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.subtitle}</p>
        </motion.div>

        <div className="mx-auto max-w-4xl">
          <video
            key={language}
            controls
            playsInline
            preload="none"
            poster={`${MEDIA}/poster-${language}.jpg`}
            width={1280}
            height={720}
            aria-label={t.videoLabel}
            className="w-full rounded-2xl bg-black shadow-xl aspect-video"
            onPlay={() => {
              if (played.current !== language) { played.current = language; trackEvent('video_play', { item_id: `n8n-assistant-${language}` }); }
            }}
          >
            <source src={`${MEDIA}/video-n8n-${language}-16x9.mp4`} type="video/mp4" />
            <track kind="subtitles" src={`${MEDIA}/video-n8n-${language}-16x9.vtt`} srcLang={language} label={t.captions} default />
          </video>

          <p className={`mt-6 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.cta}</p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={link('/digital/ai-assistant-builder/')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('store_click', { item_id: 'video-ai-assistant-builder' })}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105"
            >
              AI Assistant Builder
              <HiExternalLink className="h-5 w-5" />
            </a>
            <a
              href={link('/digital/n8n-pack/')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('store_click', { item_id: 'video-n8n-pack' })}
              className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 font-semibold transition-transform hover:scale-105 ${
                isDarkMode ? 'border-gray-500 text-gray-100' : 'border-gray-400 text-gray-800'
              }`}
            >
              {t.pack}
              <HiExternalLink className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
