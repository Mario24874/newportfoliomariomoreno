import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaPen,
  FaHeadset,
  FaCheckCircle,
  FaCopy,
  FaChevronDown,
  FaChevronUp,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaTwitter,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

// ---------------------------------------------------------------------------
// Turnstile helpers
// ---------------------------------------------------------------------------

const TURNSTILE_SITE_KEY =
  (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY || 'TU_SITE_KEY_AQUI';

function incrementLocalCount(agentName: string) {
  const key = 'demo_uses_' + agentName;
  const stored = JSON.parse(localStorage.getItem(key) || '{}');
  const now = Date.now();
  const reset_at =
    stored.reset_at && now < stored.reset_at
      ? stored.reset_at
      : now + 24 * 60 * 60 * 1000;
  localStorage.setItem(key, JSON.stringify({ count: (stored.count || 0) + 1, reset_at }));
}

function checkLimitReached(agentName: string): boolean {
  const stored = JSON.parse(localStorage.getItem('demo_uses_' + agentName) || '{}');
  return stored.count >= 2 && Date.now() < stored.reset_at;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResearchResult {
  report: {
    executive_summary: string;
    key_findings: string[];
    detailed_analysis: string;
    recommendations: string[];
    current_trends: string[];
  };
  processing_time_ms: number;
}

interface PlatformsContent {
  instagram?: { caption: string };
  youtube?: { title: string };
  linkedin?: { post: string };
  twitter?: { tweet: string };
}

interface ContentResult {
  platforms_content: PlatformsContent;
}

interface SupportResult {
  ticket: { id: string; priority: 'critical' | 'high' | 'medium' | 'low' };
  classification: { sentiment: string; urgency: string; category: string };
  response: { draft: string; suggested_actions: string[] };
}

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const T = {
  es: {
    // shared
    copied: 'Copiado!',
    copy: 'Copiar',
    processedIn: (s: string) => `Procesado en ${s}s`,
    errorUnknown: 'Error desconocido al conectar con el agente.',
    // research
    researchTopic: 'Tema a investigar',
    researchPlaceholder: 'Ej: Automatización con IA en PYMES',
    researchLanguageLabel: 'Idioma',
    researchDepthLabel: 'Profundidad',
    researchDeep: 'Profundo',
    researchBasic: 'Básico',
    researchBtn: 'Investigar',
    researchSummary: 'Resumen ejecutivo',
    researchFindings: 'Hallazgos clave',
    researchAnalysis: 'Análisis detallado',
    researchRecommendations: 'Recomendaciones',
    // content
    contentTopic: 'Marca / Tema',
    contentPlaceholder: 'Ej: Software de automatización para restaurantes',
    contentTone: 'Tono',
    contentLanguage: 'Idioma',
    contentPlatforms: 'Plataformas',
    contentBtn: 'Generar contenido',
    toneProfessional: 'Profesional',
    toneCasual: 'Casual',
    toneEducational: 'Educativo',
    toneHumorous: 'Humorístico',
    toneInspirational: 'Inspiracional',
    toneTechnical: 'Técnico',
    // support
    supportMessage: 'Mensaje del cliente *',
    supportPlaceholder: 'Pega aquí el mensaje del cliente...',
    supportOptional: 'Datos opcionales',
    supportName: 'Nombre del cliente',
    supportProduct: 'Producto / servicio',
    supportCompany: 'Empresa del cliente',
    supportBtn: 'Analizar mensaje',
    supportPriority: 'Prioridad',
    supportSentiment: 'Sentimiento',
    supportUrgency: 'Urgencia',
    supportCategory: 'Categoría',
    supportDraft: 'Respuesta sugerida',
    supportActions: 'Acciones sugeridas',
    priorityCritical: 'Crítica',
    priorityHigh: 'Alta',
    priorityMedium: 'Media',
    priorityLow: 'Baja',
    limitReached: 'Has usado tu prueba gratuita para este agente. Contáctame en info@mariomoreno.work para una demo personalizada.',
  },
  en: {
    copied: 'Copied!',
    copy: 'Copy',
    processedIn: (s: string) => `Processed in ${s}s`,
    errorUnknown: 'Unknown error connecting to agent.',
    researchTopic: 'Topic to research',
    researchPlaceholder: 'e.g. AI automation for small businesses',
    researchLanguageLabel: 'Language',
    researchDepthLabel: 'Depth',
    researchDeep: 'Deep',
    researchBasic: 'Basic',
    researchBtn: 'Research',
    researchSummary: 'Executive summary',
    researchFindings: 'Key findings',
    researchAnalysis: 'Detailed analysis',
    researchRecommendations: 'Recommendations',
    contentTopic: 'Brand / Topic',
    contentPlaceholder: 'e.g. Automation software for restaurants',
    contentTone: 'Tone',
    contentLanguage: 'Language',
    contentPlatforms: 'Platforms',
    contentBtn: 'Generate content',
    toneProfessional: 'Professional',
    toneCasual: 'Casual',
    toneEducational: 'Educational',
    toneHumorous: 'Humorous',
    toneInspirational: 'Inspirational',
    toneTechnical: 'Technical',
    supportMessage: 'Customer message *',
    supportPlaceholder: 'Paste the customer message here...',
    supportOptional: 'Optional data',
    supportName: 'Customer name',
    supportProduct: 'Product / service',
    supportCompany: 'Customer company',
    supportBtn: 'Analyze message',
    supportPriority: 'Priority',
    supportSentiment: 'Sentiment',
    supportUrgency: 'Urgency',
    supportCategory: 'Category',
    supportDraft: 'Suggested response',
    supportActions: 'Suggested actions',
    priorityCritical: 'Critical',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    limitReached: 'You have used your free trial for this agent. Contact me at info@mariomoreno.work for a personalized demo.',
  },
} as const;

type Lang = keyof typeof T;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function CopyButton({ text, lang }: { text: string; lang: Lang }) {
  const t = T[lang];
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
    >
      <FaCopy className="w-3 h-3" />
      {copied ? t.copied : t.copy}
    </button>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <motion.div
        className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
      <FaExclamationTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

const POWERED_BY = (
  <p className="text-xs text-gray-400 text-center mt-4">
    Powered by Claude Code + Gemini + n8n
  </p>
);

// ---------------------------------------------------------------------------
// Demo 1 — Research Agent
// ---------------------------------------------------------------------------

export function ResearchAgentDemo() {
  const { isDarkMode } = useTheme();
  const { language: appLang } = useLanguage();
  const lang: Lang = appLang === 'en' ? 'en' : 'es';
  const t = T[lang];

  const inputBase = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const labelClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';

  const [topic, setTopic] = useState('');
  const [researchLang, setResearchLang] = useState<'es' | 'en' | 'pt' | 'fr'>(lang === 'en' ? 'en' : 'es');
  const [depth, setDepth] = useState<'basic' | 'deep'>('deep');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [cfToken, setCfToken] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const tsRef = useRef<HTMLDivElement>(null);
  const tsWidgetId = useRef<string | null>(null);

  useEffect(() => {
    if (checkLimitReached('research-agent')) setLimitReached(true);
  }, []);

  useEffect(() => {
    if (limitReached || !tsRef.current) return;
    let interval: ReturnType<typeof setInterval>;
    const tryRender = () => {
      const w = window as any;
      if (!w.turnstile || !tsRef.current) return;
      tsWidgetId.current = w.turnstile.render(tsRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setCfToken(token),
        'refresh-expired': 'auto',
        appearance: 'interaction-only',
        theme: 'dark',
      });
    };
    if ((window as any).turnstile) {
      tryRender();
    } else {
      interval = setInterval(() => {
        if ((window as any).turnstile) { tryRender(); clearInterval(interval); }
      }, 500);
    }
    return () => {
      clearInterval(interval);
      (window as any).turnstile?.remove(tsWidgetId.current);
      tsWidgetId.current = null;
    };
  }, [limitReached]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(
        '/proxy/n8n/webhook/research-agent-demo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, language: researchLang, depth, cf_token: cfToken }),
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data: ResearchResult = await res.json();
      setResult(data);
      incrementLocalCount('research-agent');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorUnknown);
    } finally {
      setLoading(false);
    }
  };

  if (limitReached) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
        <p className="text-gray-400 text-sm max-w-xs">{t.limitReached}</p>
      </div>
    );
  }

  return (
    <div>
      <div ref={tsRef} />
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={`block text-sm font-medium mb-1 ${labelClass}`}>{t.researchTopic}</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t.researchPlaceholder}
            rows={3}
            className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBase}`}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="researchLang" className={`block text-sm font-medium mb-1 ${labelClass}`}>{t.researchLanguageLabel}</label>
            <select
              id="researchLang"
              value={researchLang}
              onChange={(e) => setResearchLang(e.target.value as typeof researchLang)}
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBase}`}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="fr">Français</option>
            </select>
          </div>
          <div>
            <label htmlFor="researchDepth" className={`block text-sm font-medium mb-1 ${labelClass}`}>{t.researchDepthLabel}</label>
            <select
              id="researchDepth"
              value={depth}
              onChange={(e) => setDepth(e.target.value as typeof depth)}
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBase}`}
            >
              <option value="deep">{t.researchDeep}</option>
              <option value="basic">{t.researchBasic}</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <FaSearch className="w-4 h-4" />
          {t.researchBtn}
        </button>
      </form>

      <AnimatePresence>
        {loading && (
          <motion.div key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Spinner />
          </motion.div>
        )}
        {error && (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
            <ErrorBox message={error} />
          </motion.div>
        )}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 space-y-4"
          >
            <div className="flex justify-end">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                {t.processedIn((result.processing_time_ms / 1000).toFixed(1))}
              </span>
            </div>

            <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                {t.researchSummary}
              </p>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {result.report.executive_summary}
              </p>
            </div>

            {result.report.key_findings?.length > 0 && (
              <div>
                <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.researchFindings}
                </p>
                <ul className="space-y-1">
                  {result.report.key_findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <FaCheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.report.detailed_analysis && (
              <div>
                <button
                  onClick={() => setAnalysisOpen(!analysisOpen)}
                  className={`flex items-center gap-2 text-sm font-semibold w-full text-left ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
                >
                  {analysisOpen ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                  {t.researchAnalysis}
                </button>
                <AnimatePresence>
                  {analysisOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className={`mt-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {result.report.detailed_analysis}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {result.report.recommendations?.length > 0 && (
              <div>
                <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.researchRecommendations}
                </p>
                <ol className="space-y-1 list-none">
                  {result.report.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{r}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {POWERED_BY}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo 2 — Content Agent
// ---------------------------------------------------------------------------

const PLATFORM_META = [
  { key: 'instagram', label: 'Instagram', icon: FaInstagram, color: 'text-pink-400' },
  { key: 'youtube', label: 'YouTube', icon: FaYoutube, color: 'text-red-400' },
  { key: 'linkedin', label: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-400' },
  { key: 'twitter', label: 'Twitter', icon: FaTwitter, color: 'text-sky-400' },
] as const;

type PlatformKey = (typeof PLATFORM_META)[number]['key'];

function getPlatformText(content: PlatformsContent, key: PlatformKey): string {
  if (key === 'instagram') return content.instagram?.caption ?? '';
  if (key === 'youtube') return content.youtube?.title ?? '';
  if (key === 'linkedin') return content.linkedin?.post ?? '';
  if (key === 'twitter') return content.twitter?.tweet ?? '';
  return '';
}

export function ContentAgentDemo() {
  const { isDarkMode } = useTheme();
  const { language: appLang } = useLanguage();
  const lang: Lang = appLang === 'en' ? 'en' : 'es';
  const t = T[lang];

  const inputBase = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const labelClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const cardBase = isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200';

  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'educational' | 'humorous' | 'inspirational' | 'technical'>('professional');
  const [contentLanguage, setContentLanguage] = useState<'es' | 'en'>(lang === 'en' ? 'en' : 'es');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>(['instagram', 'youtube', 'linkedin', 'twitter']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cfToken, setCfToken] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const tsRef = useRef<HTMLDivElement>(null);
  const tsWidgetId = useRef<string | null>(null);

  useEffect(() => {
    if (checkLimitReached('content-agent')) setLimitReached(true);
  }, []);

  useEffect(() => {
    if (limitReached || !tsRef.current) return;
    let interval: ReturnType<typeof setInterval>;
    const tryRender = () => {
      const w = window as any;
      if (!w.turnstile || !tsRef.current) return;
      tsWidgetId.current = w.turnstile.render(tsRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setCfToken(token),
        'refresh-expired': 'auto',
        appearance: 'interaction-only',
        theme: 'dark',
      });
    };
    if ((window as any).turnstile) {
      tryRender();
    } else {
      interval = setInterval(() => {
        if ((window as any).turnstile) { tryRender(); clearInterval(interval); }
      }, 500);
    }
    return () => {
      clearInterval(interval);
      (window as any).turnstile?.remove(tsWidgetId.current);
      tsWidgetId.current = null;
    };
  }, [limitReached]);

  const togglePlatform = (key: PlatformKey) => {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || selectedPlatforms.length === 0) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(
        '/proxy/n8n/webhook/content-agent-demo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, tone, language: contentLanguage, platforms: selectedPlatforms, cf_token: cfToken }),
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data: ContentResult = await res.json();
      setResult(data);
      incrementLocalCount('content-agent');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorUnknown);
    } finally {
      setLoading(false);
    }
  };

  if (limitReached) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
        <p className="text-gray-400 text-sm max-w-xs">{t.limitReached}</p>
      </div>
    );
  }

  return (
    <div>
      <div ref={tsRef} />
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={`block text-sm font-medium mb-1 ${labelClass}`}>{t.contentTopic}</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t.contentPlaceholder}
            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${inputBase}`}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="contentTone" className={`block text-sm font-medium mb-1 ${labelClass}`}>{t.contentTone}</label>
            <select
              id="contentTone"
              value={tone}
              onChange={(e) => setTone(e.target.value as typeof tone)}
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${inputBase}`}
            >
              <option value="professional">{t.toneProfessional}</option>
              <option value="casual">{t.toneCasual}</option>
              <option value="educational">{t.toneEducational}</option>
              <option value="humorous">{t.toneHumorous}</option>
              <option value="inspirational">{t.toneInspirational}</option>
              <option value="technical">{t.toneTechnical}</option>
            </select>
          </div>
          <div>
            <label htmlFor="contentLanguage" className={`block text-sm font-medium mb-1 ${labelClass}`}>{t.contentLanguage}</label>
            <select
              id="contentLanguage"
              value={contentLanguage}
              onChange={(e) => setContentLanguage(e.target.value as 'es' | 'en')}
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${inputBase}`}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${labelClass}`}>{t.contentPlatforms}</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_META.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => togglePlatform(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedPlatforms.includes(key)
                    ? `${isDarkMode ? 'bg-purple-500/20 border-purple-500/50' : 'bg-purple-100 border-purple-400'} text-purple-400`
                    : `${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`
                }`}
              >
                <Icon className={`w-3 h-3 ${selectedPlatforms.includes(key) ? color : ''}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !topic.trim() || selectedPlatforms.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <FaPen className="w-4 h-4" />
          {t.contentBtn}
        </button>
      </form>

      <AnimatePresence>
        {loading && (
          <motion.div key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Spinner />
          </motion.div>
        )}
        {error && (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
            <ErrorBox message={error} />
          </motion.div>
        )}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 space-y-3"
          >
            {PLATFORM_META.filter(({ key }) => selectedPlatforms.includes(key)).map(({ key, label, icon: Icon, color }) => {
              const text = getPlatformText(result.platforms_content, key);
              if (!text) return null;
              return (
                <div key={key} className={`p-3 rounded-lg border ${cardBase}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{label}</span>
                    </div>
                    <CopyButton text={text} lang={lang} />
                  </div>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{text}</p>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      {POWERED_BY}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo 3 — Support / CRM Agent
// ---------------------------------------------------------------------------

export function SupportAgentDemo() {
  const { isDarkMode } = useTheme();
  const { language: appLang } = useLanguage();
  const lang: Lang = appLang === 'en' ? 'en' : 'es';
  const t = T[lang];

  const inputBase = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const labelClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';

  const [message, setMessage] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [product, setProduct] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SupportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cfToken, setCfToken] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const tsRef = useRef<HTMLDivElement>(null);
  const tsWidgetId = useRef<string | null>(null);

  useEffect(() => {
    if (checkLimitReached('support-agent')) setLimitReached(true);
  }, []);

  useEffect(() => {
    if (limitReached || !tsRef.current) return;
    let interval: ReturnType<typeof setInterval>;
    const tryRender = () => {
      const w = window as any;
      if (!w.turnstile || !tsRef.current) return;
      tsWidgetId.current = w.turnstile.render(tsRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setCfToken(token),
        'refresh-expired': 'auto',
        appearance: 'interaction-only',
        theme: 'dark',
      });
    };
    if ((window as any).turnstile) {
      tryRender();
    } else {
      interval = setInterval(() => {
        if ((window as any).turnstile) { tryRender(); clearInterval(interval); }
      }, 500);
    }
    return () => {
      clearInterval(interval);
      (window as any).turnstile?.remove(tsWidgetId.current);
      tsWidgetId.current = null;
    };
  }, [limitReached]);

  const priorityConfig = {
    critical: { label: t.priorityCritical, classes: 'bg-red-500/20 text-red-400 border-red-500/30' },
    high:     { label: t.priorityHigh,     classes: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    medium:   { label: t.priorityMedium,   classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    low:      { label: t.priorityLow,      classes: 'bg-green-500/20 text-green-400 border-green-500/30' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const body: Record<string, string> = { message, cf_token: cfToken };
      if (customerName.trim()) body.customer_name = customerName;
      if (product.trim()) body.product = product;
      if (customerCompany.trim()) body.customer_company = customerCompany;

      const res = await fetch(
        '/proxy/n8n/webhook/support-agent-demo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data: SupportResult = await res.json();
      setResult(data);
      incrementLocalCount('support-agent');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorUnknown);
    } finally {
      setLoading(false);
    }
  };

  const pConfig = result ? (priorityConfig[result.ticket.priority] ?? priorityConfig.medium) : null;

  if (limitReached) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
        <p className="text-gray-400 text-sm max-w-xs">{t.limitReached}</p>
      </div>
    );
  }

  return (
    <div>
      <div ref={tsRef} />
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={`block text-sm font-medium mb-1 ${labelClass}`}>{t.supportMessage}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.supportPlaceholder}
            rows={4}
            className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 ${inputBase}`}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setOptionalOpen(!optionalOpen)}
            className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            {optionalOpen ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
            {t.supportOptional}
          </button>
          <AnimatePresence>
            {optionalOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-2 mt-3">
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.supportName}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${inputBase}`}
                  />
                  <input type="text" value={product} onChange={(e) => setProduct(e.target.value)}
                    placeholder={t.supportProduct}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${inputBase}`}
                  />
                  <input type="text" value={customerCompany} onChange={(e) => setCustomerCompany(e.target.value)}
                    placeholder={t.supportCompany}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${inputBase}`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <FaHeadset className="w-4 h-4" />
          {t.supportBtn}
        </button>
      </form>

      <AnimatePresence>
        {loading && (
          <motion.div key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Spinner />
          </motion.div>
        )}
        {error && (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
            <ErrorBox message={error} />
          </motion.div>
        )}
        {result && pConfig && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 space-y-4"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${pConfig.classes}`}>
                {t.supportPriority}: {pConfig.label}
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                #{result.ticket.id}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: t.supportSentiment, value: result.classification.sentiment },
                { label: t.supportUrgency, value: result.classification.urgency },
                { label: t.supportCategory, value: result.classification.category },
              ].map(({ label, value }) => (
                <span
                  key={label}
                  className={`text-xs px-2.5 py-1 rounded-full border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}
                >
                  <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{label}:</span> {value}
                </span>
              ))}
            </div>

            <div className={`p-4 rounded-lg border-l-4 border-teal-500 ${isDarkMode ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                  {t.supportDraft}
                </p>
                <CopyButton text={result.response.draft} lang={lang} />
              </div>
              <p className={`text-sm leading-relaxed whitespace-pre-line ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {result.response.draft}
              </p>
            </div>

            {result.response.suggested_actions?.length > 0 && (
              <div>
                <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.supportActions}
                </p>
                <ul className="space-y-1">
                  {result.response.suggested_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <FaCheckCircle className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {POWERED_BY}
    </div>
  );
}
