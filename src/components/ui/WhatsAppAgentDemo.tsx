import React, { useState, useRef, useEffect } from 'react';
import { FaWhatsapp, FaPaperPlane, FaCheckDouble } from 'react-icons/fa';
import { trackDemo } from '@/lib/analytics';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

// ---------------------------------------------------------------------------
// Local daily usage limit (same pattern as N8nAgentDemos)
// ---------------------------------------------------------------------------
const DAILY_MESSAGE_LIMIT = 15;

function incrementLocalCount() {
  const key = 'demo_uses_whatsapp-agent';
  const stored = JSON.parse(localStorage.getItem(key) || '{}');
  const now = Date.now();
  const reset_at =
    stored.reset_at && now < stored.reset_at
      ? stored.reset_at
      : now + 24 * 60 * 60 * 1000;
  localStorage.setItem(key, JSON.stringify({ count: (stored.count || 0) + 1, reset_at }));
}

function checkLimitReached(): boolean {
  const stored = JSON.parse(localStorage.getItem('demo_uses_whatsapp-agent') || '{}');
  return stored.count >= DAILY_MESSAGE_LIMIT && Date.now() < stored.reset_at;
}

function getSessionId(): string {
  let id = sessionStorage.getItem('wa_agent_demo_session');
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    sessionStorage.setItem('wa_agent_demo_session', id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
const T = {
  es: {
    placeholder: 'Escribe un mensaje...',
    intro: 'Este es el mismo agente que atiende WhatsApp. Pregúntale por los servicios o proyectos de Mario.',
    typing: 'escribiendo...',
    online: 'en línea',
    errorGeneric: 'No pude conectar con el agente. Inténtalo de nuevo.',
    errorQuota: 'Alcanzaste el límite de mensajes de la demo por hoy. ¡Vuelve mañana!',
    limitReached: 'Alcanzaste el límite diario de esta demo. Vuelve mañana o agenda una consulta para verlo sin límites.',
  },
  en: {
    placeholder: 'Type a message...',
    intro: 'This is the same agent that answers on WhatsApp. Ask it about Mario\'s services or projects.',
    typing: 'typing...',
    online: 'online',
    errorGeneric: 'Could not reach the agent. Please try again.',
    errorQuota: 'You reached the demo message limit for today. Come back tomorrow!',
    limitReached: 'You reached this demo\'s daily limit. Come back tomorrow or schedule a consultation to see it without limits.',
  },
};

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  time: string;
}

const WhatsAppAgentDemo: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const t = T[language] || T.es;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (checkLimitReached()) setLimitReached(true);
  }, []);

  // Scroll only the internal message list — never the page.
  useEffect(() => {
    if (messages.length === 0 && !sending) return;
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  const now = () =>
    new Date().toLocaleTimeString(language === 'es' ? 'es-VE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text, time: now() }]);
    setSending(true);
    trackDemo('whatsapp-agent', text.slice(0, 60));
    try {
      const res = await fetch('/api/wa-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: getSessionId(), message: text }),
      });
      if (res.status === 429) {
        setError(t.errorQuota);
        setLimitReached(true);
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: { reply: string } = await res.json();
      setMessages((prev) => [...prev, { role: 'agent', text: data.reply, time: now() }]);
      incrementLocalCount();
      if (checkLimitReached()) setLimitReached(true);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSending(false);
    }
  };

  if (limitReached && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
        <FaWhatsapp className="w-8 h-8 text-green-500" />
        <p className="text-gray-400 text-sm max-w-xs">{t.limitReached}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* WhatsApp-style chat header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#075E54] text-white">
        <div className="bg-white/20 rounded-full p-2">
          <FaWhatsapp className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Mario Moreno · AI Agent</p>
          <p className="text-[11px] opacity-80">{sending ? t.typing : t.online}</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className={`h-64 overflow-y-auto px-3 py-3 space-y-2 ${
          isDarkMode ? 'bg-[#0b141a]' : 'bg-[#efeae2]'
        }`}
      >
        {messages.length === 0 && (
          <p className={`text-center text-xs py-8 px-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {t.intro}
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm shadow-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? isDarkMode
                    ? 'bg-[#005c4b] text-gray-100'
                    : 'bg-[#d9fdd3] text-gray-900'
                  : isDarkMode
                    ? 'bg-[#202c33] text-gray-100'
                    : 'bg-white text-gray-900'
              }`}
            >
              <p className="leading-relaxed">{msg.text}</p>
              <span className={`flex items-center justify-end gap-1 text-[10px] mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {msg.time}
                {msg.role === 'user' && <FaCheckDouble className="w-2.5 h-2.5 text-sky-400" />}
              </span>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className={`rounded-lg px-3 py-2 shadow-sm ${isDarkMode ? 'bg-[#202c33]' : 'bg-white'}`}>
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-xs text-center bg-red-500/10 py-2 px-3">{error}</p>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className={`flex items-center gap-2 px-3 py-2 ${isDarkMode ? 'bg-[#202c33]' : 'bg-gray-100'}`}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          maxLength={1000}
          disabled={limitReached}
          className={`flex-1 px-3 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 ${
            isDarkMode
              ? 'bg-[#2a3942] text-gray-100 placeholder-gray-500'
              : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-200'
          }`}
        />
        <button
          type="submit"
          disabled={sending || !input.trim() || limitReached}
          aria-label="Send"
          className="bg-[#00a884] hover:bg-[#029e7d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full p-2.5 transition-colors"
        >
          <FaPaperPlane className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default WhatsAppAgentDemo;
