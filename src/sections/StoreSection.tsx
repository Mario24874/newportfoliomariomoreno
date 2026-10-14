import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HiChevronLeft, HiChevronRight, HiExternalLink } from 'react-icons/hi';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';
import { trackEvent } from '@/lib/analytics';

const FEED_URL = 'https://store.mariomoreno.work/feed/showcase.json';
const LOOP_SECONDS = 50; // duración de una vuelta completa de la lista
const GAP = 16; // px entre tarjetas (gap-4)
const IDLE_MS = 2500; // sin tocar ni desplazar durante este tiempo, el movimiento automático se reanuda

interface ShowcaseProduct {
  id: string;
  name: { en: string; es: string };
  section?: string;
  section_name?: { en: string; es: string };
  available: boolean;
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
const isBilingual = (n: unknown): n is { en: string; es: string } =>
  !!n && typeof (n as { en?: unknown }).en === 'string' && typeof (n as { es?: unknown }).es === 'string';

/** Acepta solo lo que el carrusel necesita; cualquier forma inesperada del feed se descarta sin romper la página. */
function parseFeed(raw: unknown): Showcase | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!isHttps(r.url) || !isHttps(r.url_es)) return null;
  const list = Array.isArray(r.products) ? r.products : [];
  const products: ShowcaseProduct[] = [];
  for (const p of list) {
    const x = p as Partial<ShowcaseProduct> | null;
    if (!x || typeof x.id !== 'string' || typeof x.price !== 'string' || !isHttps(x.image) || !isHttps(x.url) || !isHttps(x.url_es) || !isBilingual(x.name)) continue;
    products.push({
      id: x.id, name: x.name, price: x.price, from: x.from === true, image: x.image, url: x.url, url_es: x.url_es,
      section: typeof x.section === 'string' ? x.section : undefined,
      section_name: isBilingual(x.section_name) ? x.section_name : undefined,
      available: x.available !== false, // si el feed no trae el campo, se asume disponible
    });
  }
  return { url: r.url, url_es: r.url_es, live: r.live === true, products };
}

const StoreSection: React.FC = () => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const t = translations[language].store;
  const reduceMotion = !!useReducedMotion();

  const [feed, setFeed] = useState<Showcase | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [unit, setUnit] = useState({ reps: 1, width: 0 }); // reps: veces que se repite la lista dentro de una "unidad"; width: ancho de la unidad en px

  // Estado del movimiento (solo en refs: nada de esto debe re-renderizar)
  const manual = useRef(false); // true = el usuario controla el desplazamiento; false = animación CSS
  const touching = useRef(false);
  const hovering = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(FEED_URL, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setFeed(parseFeed(j)))
      .catch(() => setFeed(null)); // si falla, la sección muestra solo el texto y el botón
    return () => ctrl.abort();
  }, []);

  const products = feed?.products ?? [];
  const animated = !reduceMotion;

  // Mide una tarjeta para saber cuánto ocupa la lista y cuántas veces repetirla hasta cubrir el contenedor
  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const card = cardRef.current;
    if (!vp || !card || products.length === 0) return;
    const one = (card.offsetWidth + GAP) * products.length;
    const reps = Math.max(1, Math.ceil(vp.clientWidth / one));
    setUnit((u) => (u.reps === reps && u.width === one * reps ? u : { reps, width: one * reps }));
  }, [products.length]);

  useLayoutEffect(() => {
    measure();
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [measure, feed]);

  // Publica en CSS el ancho de una unidad (lo que recorre la animación) y la duración de la vuelta
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.setProperty('--store-w', `${unit.width}px`);
    track.style.setProperty('--store-dur', `${LOOP_SECONDS}s`);
  }, [unit.width]);

  /** Pasa de animación CSS a desplazamiento manual, conservando exactamente lo que se ve en pantalla. */
  const freeze = useCallback(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track || manual.current || !animated || unit.width === 0) return;
    const shift = -new DOMMatrixReadOnly(getComputedStyle(track).transform).m41; // px ya recorridos por la animación
    manual.current = true;
    track.dataset.auto = 'false';
    vp.scrollLeft = unit.width + vp.scrollLeft + shift; // se empieza en la unidad central para poder ir hacia atrás
  }, [animated, unit.width]);

  /** Vuelve a la animación CSS retomando desde la posición donde quedó el usuario. */
  const resume = useCallback(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track || !manual.current || unit.width === 0) return;
    const phase = ((vp.scrollLeft % unit.width) + unit.width) % unit.width;
    track.style.setProperty('--store-delay', `${-(phase / unit.width) * LOOP_SECONDS}s`);
    manual.current = false;
    vp.scrollLeft = 0;
    track.dataset.auto = 'true';
  }, [unit.width]);

  const scheduleResume = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (touching.current || hovering.current) scheduleResume();
      else resume();
    }, IDLE_MS);
  }, [resume]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Bucle del desplazamiento manual: la lista se repite 3 veces, así que se salta de una unidad a otra sin que se note
  const onScroll = () => {
    const vp = viewportRef.current;
    if (!vp || unit.width === 0) return;
    if (!manual.current) {
      if (vp.scrollLeft !== 0) freeze(); // desplazamiento por teclado o foco: se pasa a manual
      else return;
    }
    if (vp.scrollLeft >= unit.width * 2) vp.scrollLeft -= unit.width;
    else if (vp.scrollLeft < unit.width) vp.scrollLeft += unit.width;
    scheduleResume();
  };

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { freeze(); scheduleResume(); }
  };

  /** Flechas: adelantan o retroceden dos tarjetas sin esperar a la animación; luego el movimiento automático se reanuda solo. */
  const scrollByCards = (dir: 1 | -1) => {
    const vp = viewportRef.current;
    const card = cardRef.current;
    if (!vp || !card) return;
    const step = (card.offsetWidth + GAP) * 2 * dir;
    if (animated && unit.width > 0) {
      freeze();
      // si el destino sale de la unidad central, se salta antes a la copia equivalente para que el desplazamiento suave no se corte
      const target = vp.scrollLeft + step;
      if (target < unit.width) vp.scrollLeft += unit.width;
      else if (target >= unit.width * 2) vp.scrollLeft -= unit.width;
      scheduleResume();
    }
    vp.scrollBy({ left: step, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const arrowCls = `hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full shadow-lg transition-colors ${
    isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
  }`;

  const storeUrl = feed ? (language === 'es' ? feed.url_es : feed.url) : language === 'es' ? 'https://store.mariomoreno.work/es/' : 'https://store.mariomoreno.work/';

  const cards = (copy: number) =>
    Array.from({ length: unit.reps }, (_, rep) =>
      products.map((p, i) => {
        const clone = copy > 0 || rep > 0; // todo lo que no sea la primera copia: oculto a lectores y al teclado
        const first = copy === 0 && rep === 0 && i === 0;
        const label = language === 'es' ? p.name.es : p.name.en;
        const section = p.section_name ? (language === 'es' ? p.section_name.es : p.section_name.en) : '';
        const price = p.from ? `${t.from} ${p.price}` : p.price;
        return (
          <a
            key={`${copy}-${rep}-${p.id}`}
            ref={first ? cardRef : undefined}
            href={language === 'es' ? p.url_es : p.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-hidden={clone || undefined}
            tabIndex={clone ? -1 : undefined}
            onClick={() => trackEvent('store_click', { item_id: p.id })}
            className={`group shrink-0 w-44 sm:w-52 lg:w-56 rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1.5 focus-visible:-translate-y-1.5 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
            }`}
          >
            <div className="relative aspect-square overflow-hidden bg-white">
              <img
                src={p.image}
                alt={clone ? '' : label}
                loading="lazy"
                width={400}
                height={400}
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 group-focus-visible:scale-110"
              />
              {section && (
                <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/65 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {section}
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className={`text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{label}</h3>
              <p className={`mt-1 text-sm font-bold ${p.available ? (isDarkMode ? 'text-blue-300' : 'text-blue-600') : isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                {p.available ? price : t.comingSoon}
              </p>
            </div>
          </a>
        );
      }),
    );

  // 3 unidades para el movimiento animado (la animación recorre una y el modo manual necesita margen a ambos lados); 1 si hay reduced-motion
  const copies = animated ? [0, 1, 2] : [0];

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
          <div className="relative">
            <button type="button" aria-label={t.prev} onClick={() => scrollByCards(-1)} className={`${arrowCls} left-0 md:-left-5`}>
              <HiChevronLeft className="h-6 w-6" />
            </button>
            <button type="button" aria-label={t.next} onClick={() => scrollByCards(1)} className={`${arrowCls} right-0 md:-right-5`}>
              <HiChevronRight className="h-6 w-6" />
            </button>
          <div
            ref={viewportRef}
            role="region"
            aria-roledescription="carousel"
            aria-label={t.carouselLabel}
            className="store-viewport overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
            onScroll={onScroll}
            onWheel={onWheel}
            onTouchStart={() => { touching.current = true; freeze(); window.clearTimeout(timer.current); }}
            onTouchEnd={() => { touching.current = false; scheduleResume(); }}
            onTouchCancel={() => { touching.current = false; scheduleResume(); }}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') hovering.current = true; }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') { hovering.current = false; if (manual.current) scheduleResume(); } }}
          >
            <div ref={trackRef} data-auto={animated ? 'true' : 'false'} className="store-track flex w-max" style={{ gap: GAP, paddingRight: GAP }}>
              {copies.flatMap((c) => cards(c))}
            </div>
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
