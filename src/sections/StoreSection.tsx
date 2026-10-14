import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useReducedMotion } from 'framer-motion';
import { HiChevronLeft, HiChevronRight, HiExternalLink } from 'react-icons/hi';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';
import { trackEvent } from '@/lib/analytics';

const FEED_URL = 'https://store.mariomoreno.work/feed/showcase.json';
const SPEED = 28; // px por segundo: desplazamiento lento
const RESUME_MS = 3000; // pausa tras una interacción manual (flechas, dedo)

interface ShowcaseProduct {
  id: string;
  name: { en: string; es: string };
  price: string;
  from: boolean;
  image: string;
  url: string;
  url_es: string;
}

interface Showcase {
  url: string;
  url_es: string;
  live: boolean;
  products: ShowcaseProduct[];
}

const isHttps = (u: unknown): u is string => typeof u === 'string' && u.startsWith('https://');

/** Acepta solo lo que el carrusel necesita; cualquier forma inesperada del feed se descarta sin romper la página. */
function parseFeed(raw: unknown): Showcase | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!isHttps(r.url) || !isHttps(r.url_es)) return null;
  const list = Array.isArray(r.products) ? r.products : [];
  const products = list.filter((p): p is ShowcaseProduct => {
    const x = p as Partial<ShowcaseProduct> | null;
    return !!x && typeof x.id === 'string' && typeof x.price === 'string' && isHttps(x.image) && isHttps(x.url) && isHttps(x.url_es)
      && !!x.name && typeof x.name.en === 'string' && typeof x.name.es === 'string';
  });
  return { url: r.url, url_es: r.url_es, live: r.live === true, products };
}

const StoreSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const t = translations[language].store;
  const reduceMotion = useReducedMotion();

  const [feed, setFeed] = useState<Showcase | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pos = useRef(0); // posición real (con decimales) del desplazamiento automático
  const halfRef = useRef(0); // ancho de una copia de la lista, para el bucle sin saltos
  const hover = useRef(false);
  const resumeAt = useRef(0);
  const [loop, setLoop] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(FEED_URL, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setFeed(parseFeed(j)))
      .catch(() => setFeed(null)); // si falla, la sección muestra solo el texto y el botón
    return () => ctrl.abort();
  }, []);

  const products = feed?.products ?? [];

  // ¿La lista desborda el contenedor? Solo entonces se repite para el bucle y se mueve sola.
  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el || products.length === 0) return;
    const gap = parseFloat(getComputedStyle(el).columnGap || '16') || 16;
    const card = el.querySelector<HTMLElement>('[data-card]');
    if (!card) return;
    const one = (card.offsetWidth + gap) * products.length;
    halfRef.current = one;
    setLoop(one > el.clientWidth + 1);
  }, [products.length]);

  useEffect(() => {
    measure();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, feed]);

  const pause = (ms = RESUME_MS) => { resumeAt.current = performance.now() + ms; };

  useAnimationFrame((_, delta) => {
    const el = trackRef.current;
    if (!el || !loop || reduceMotion) return;
    const half = halfRef.current;
    if (half > 0) {
      // bucle manual: si el usuario llegó a un extremo, se salta a la copia equivalente
      if (el.scrollLeft >= half) { el.scrollLeft -= half; pos.current = el.scrollLeft; }
      else if (el.scrollLeft <= 0 && pos.current <= 0) { el.scrollLeft = half; pos.current = half; }
    }
    if (hover.current || performance.now() < resumeAt.current) { pos.current = el.scrollLeft; return; }
    pos.current += (SPEED * Math.min(delta, 100)) / 1000;
    el.scrollLeft = pos.current;
  });

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    pause();
    const card = el.querySelector<HTMLElement>('[data-card]');
    el.scrollBy({ left: dir * (card ? card.offsetWidth + 16 : 240) * 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const storeUrl = feed ? (language === 'es' ? feed.url_es : feed.url) : language === 'es' ? 'https://store.mariomoreno.work/es/' : 'https://store.mariomoreno.work/';
  const items = loop ? [...products, ...products] : products;

  const arrowCls = `hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full shadow-lg transition-colors ${
    isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
  }`;

  return (
    <section id="store" className={`py-20 transition-colors duration-300 ${
      isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'
    }`}>
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className={`flex items-center justify-center gap-3 sm:gap-4 text-4xl lg:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <img src="/images/store-logo.png" alt="" aria-hidden="true" width={64} height={64} className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 rounded-full shadow-md" />
            {t.title}
          </h2>
          <p className={`max-w-2xl mx-auto text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t.subtitle}</p>
        </motion.div>

        {products.length > 0 && (
          <div className="relative" role="region" aria-roledescription="carousel" aria-label={t.carouselLabel}>
            {loop && (
              <>
                <button type="button" aria-label={t.prev} onClick={() => scrollByCards(-1)} className={`${arrowCls} left-0 md:-left-5`}>
                  <HiChevronLeft className="h-6 w-6" />
                </button>
                <button type="button" aria-label={t.next} onClick={() => scrollByCards(1)} className={`${arrowCls} right-0 md:-right-5`}>
                  <HiChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <div
              ref={trackRef}
              onMouseEnter={() => { hover.current = true; }}
              onMouseLeave={() => { hover.current = false; }}
              onFocusCapture={() => { hover.current = true; }}
              onBlurCapture={() => { hover.current = false; }}
              onTouchStart={() => pause(RESUME_MS * 2)}
              onTouchMove={() => pause(RESUME_MS * 2)}
              onWheel={() => pause()}
              className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {items.map((p, i) => {
                const clone = i >= products.length; // copia para el bucle: oculta a lectores y al teclado
                const label = language === 'es' ? p.name.es : p.name.en;
                const price = p.from ? `${t.from} ${p.price}` : p.price;
                return (
                  <a
                    key={`${p.id}-${clone ? 'b' : 'a'}`}
                    data-card
                    href={language === 'es' ? p.url_es : p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-hidden={clone || undefined}
                    tabIndex={clone ? -1 : undefined}
                    onClick={() => trackEvent('store_click', { item_id: p.id })}
                    className={`group shrink-0 w-44 sm:w-52 lg:w-56 rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1 ${
                      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
                    }`}
                  >
                    <div className="aspect-square overflow-hidden bg-white">
                      <img
                        src={p.image}
                        alt={clone ? '' : label}
                        loading="lazy"
                        width={400}
                        height={400}
                        draggable={false}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className={`text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{label}</h3>
                      <p className={`mt-1 text-sm font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>{price}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('store_click', { item_id: 'cta' })}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105"
          >
            {t.visit}
            <HiExternalLink className="h-5 w-5" />
          </a>
          {feed && !feed.live && (
            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white shadow">{t.soon}</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default StoreSection;
