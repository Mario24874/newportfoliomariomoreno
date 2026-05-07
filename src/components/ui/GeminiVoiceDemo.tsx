import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaVideoSlash, FaRobot, FaVolumeUp, FaPhone, FaPhoneSlash } from 'react-icons/fa';
import { SiGoogle } from 'react-icons/si';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const WEBHOOK_URL =
  import.meta.env.VITE_GEMINI_VOICE_WEBHOOK_URL ||
  '/proxy/n8n/webhook/gemini-voice-demo';

interface Message {
  role: 'user' | 'gemini';
  text: string;
  hasImage?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionError extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionError) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const T = {
  es: {
    title: 'Asistente de Voz IA',
    subtitle: 'Llamada en tiempo real con Gemini. Activa la cámara para que también te vea.',
    startCall: 'Iniciar llamada',
    endCall: 'Colgar',
    camOn: 'Cámara activa',
    camOff: 'Activar cámara',
    statusListening: 'Escuchando...',
    statusThinking: 'Gemini está pensando...',
    statusSpeaking: 'Gemini está hablando...',
    statusReady: 'Listo para escuchar',
    youSaid: 'Tú:',
    geminiSaid: 'Gemini:',
    noSupport: 'Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.',
    camError: 'No se pudo acceder a la cámara.',
    networkError: 'Error al conectar con el agente. Reintentando...',
    placeholder: 'Presiona "Iniciar llamada" para comenzar.',
    powered: 'Powered by Gemini + n8n',
    hint: 'Prueba: "¿Qué ves en mi cámara?" o "Explícame qué es la IA"',
    imageNote: '📷 con imagen',
    inCall: 'En llamada',
  },
  en: {
    title: 'AI Voice Assistant',
    subtitle: 'Real-time call with Gemini. Enable camera so it can also see you.',
    startCall: 'Start call',
    endCall: 'Hang up',
    camOn: 'Camera on',
    camOff: 'Enable camera',
    statusListening: 'Listening...',
    statusThinking: 'Gemini is thinking...',
    statusSpeaking: 'Gemini is speaking...',
    statusReady: 'Ready to listen',
    youSaid: 'You:',
    geminiSaid: 'Gemini:',
    noSupport: 'Your browser does not support speech recognition. Use Chrome or Edge.',
    camError: 'Could not access camera.',
    networkError: 'Error connecting to agent. Retrying...',
    placeholder: 'Press "Start call" to begin.',
    powered: 'Powered by Gemini + n8n',
    hint: 'Try: "What do you see in my camera?" or "Explain what AI is"',
    imageNote: '📷 with image',
    inCall: 'In call',
  },
} as const;

export function GeminiVoiceDemo() {
  const { isDarkMode } = useTheme();
  const { language: appLang } = useLanguage();
  const lang = appLang === 'en' ? 'en' : 'es';
  const t = T[lang];

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  // Refs mirror state so async callbacks always see current values
  const inCallRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isLoadingRef = useRef(false);
  // Ref to latest startListening so speak() onend can call it without stale closure
  const startListeningCallbackRef = useRef<() => void>(() => {});
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setHasSpeechSupport(false);
    synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      stopCamera();
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  // Keep refs in sync with state
  useEffect(() => { isLoadingRef.current = loading; }, [loading]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setError(null);
    } catch {
      setError(t.camError);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const captureFrame = (): string | null => {
    // Use streamRef (always current) not cameraOn state (stale in useCallback closures)
    if (!streamRef.current || !videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  };

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang === 'en' ? 'en-US' : 'es-ES';
    utt.rate = 1.0;
    utt.pitch = 1.0;
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    utt.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      // Auto-resume listening after Gemini finishes speaking
      if (inCallRef.current && !isLoadingRef.current) {
        setTimeout(() => startListeningCallbackRef.current(), 400);
      }
    };
    synthRef.current.speak(utt);
  }, [lang]);

  const sendToGemini = useCallback(async (text: string) => {
    setLoading(true);
    isLoadingRef.current = true;
    const imageBase64 = captureFrame();
    const hasImage = !!imageBase64;

    setMessages((prev) => [...prev, { role: 'user', text, hasImage }]);

    try {
      const body: Record<string, unknown> = { text, lang };
      if (imageBase64) body.image = imageBase64;

      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const reply: string = data.response || data.text || data.reply || JSON.stringify(data);

      setMessages((prev) => [...prev, { role: 'gemini', text: reply }]);
      speak(reply);
      setError(null);
    } catch {
      setError(t.networkError);
      // Resume listening even on error
      if (inCallRef.current) {
        setTimeout(() => startListeningCallbackRef.current(), 1500);
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [lang, speak, t.networkError]);

  const startListening = useCallback(() => {
    if (!hasSpeechSupport || !inCallRef.current || isSpeakingRef.current || isLoadingRef.current) return;
    // Cancel any lingering TTS to avoid 'network' errors from mic picking up audio
    synthRef.current?.cancel();

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = lang === 'en' ? 'en-US' : 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript ?? '';
      if (transcript.trim()) sendToGemini(transcript.trim());
    };
    recognition.onerror = (e: SpeechRecognitionError) => {
      const silent = ['aborted', 'no-speech', 'network'];
      if (!silent.includes(e.error)) setError(`Speech error: ${e.error}`);
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      // Restart if still in call and not currently processing/speaking
      // isLoadingRef is true if sendToGemini started → speak() will handle restart via onend
      if (inCallRef.current && !isLoadingRef.current && !isSpeakingRef.current) {
        setTimeout(() => startListeningCallbackRef.current(), 300);
      }
    };

    recognition.start();
    setListening(true);
    setError(null);
  }, [hasSpeechSupport, lang, sendToGemini]);

  // Keep ref current so speak()/sendToGemini() callbacks always use latest version
  startListeningCallbackRef.current = startListening;

  const startCall = () => {
    if (!hasSpeechSupport) return;
    inCallRef.current = true;
    setInCall(true);
    setMessages([]);
    setCallDuration(0);
    callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    setTimeout(() => startListening(), 150);
  };

  const endCall = () => {
    inCallRef.current = false;
    setInCall(false);
    recognitionRef.current?.stop();
    synthRef.current?.cancel();
    setListening(false);
    setIsSpeaking(false);
    setLoading(false);
    isLoadingRef.current = false;
    isSpeakingRef.current = false;
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const callStatus = loading
    ? t.statusThinking
    : isSpeaking
    ? t.statusSpeaking
    : listening
    ? t.statusListening
    : t.statusReady;

  const statusColor = loading
    ? 'text-yellow-400'
    : isSpeaking
    ? 'text-violet-400'
    : listening
    ? 'text-green-400'
    : isDarkMode
    ? 'text-gray-500'
    : 'text-gray-400';

  const barColor = loading
    ? 'bg-yellow-400'
    : isSpeaking
    ? 'bg-violet-400'
    : listening
    ? 'bg-green-400'
    : 'bg-gray-400';

  const card = isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-200';
  const msgBubbleUser = isDarkMode ? 'bg-blue-600/20 border-blue-500/30 text-gray-100' : 'bg-blue-50 border-blue-200 text-gray-800';
  const msgBubbleGemini = isDarkMode ? 'bg-gray-700/60 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800';

  return (
    <div className={`rounded-2xl border overflow-hidden ${card}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2.5 rounded-xl">
            <SiGoogle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{t.title}</h3>
            <p className="text-xs text-blue-100">{t.subtitle}</p>
          </div>
          {inCall && (
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-xs font-mono font-semibold">{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Camera preview */}
        <AnimatePresence>
          {cameraOn && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden rounded-xl border border-gray-600"
            >
              <video
                ref={videoRef}
                className="w-full max-h-48 object-cover rounded-xl bg-black"
                muted
                playsInline
              />
            </motion.div>
          )}
        </AnimatePresence>
        <canvas ref={canvasRef} className="hidden" />

        {/* Status bar — only during call */}
        {inCall && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${isDarkMode ? 'bg-gray-900/60' : 'bg-gray-100'}`}>
            <div className="flex items-end gap-0.5 h-5">
              {[0, 0.12, 0.24].map((delay, i) => (
                <motion.div
                  key={i}
                  className={`w-1.5 rounded-full ${barColor}`}
                  style={{ height: listening || isSpeaking || loading ? '100%' : '40%' }}
                  animate={listening || isSpeaking || loading ? { scaleY: [0.4, 1, 0.4] } : { scaleY: 0.4 }}
                  transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
                />
              ))}
            </div>
            <span className={`text-sm font-medium ${statusColor}`}>{callStatus}</span>
          </div>
        )}

        {/* Chat messages */}
        <div className={`min-h-32 max-h-64 overflow-y-auto space-y-3 rounded-xl p-3 ${isDarkMode ? 'bg-gray-900/40' : 'bg-gray-50'}`}>
          {messages.length === 0 && (
            <p className={`text-center text-sm py-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {t.placeholder}
              <br />
              <span className="text-xs mt-1 block opacity-70">{t.hint}</span>
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 border text-sm ${msg.role === 'user' ? msgBubbleUser : msgBubbleGemini}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {msg.role === 'gemini' && <FaRobot className="w-3 h-3 text-violet-400" />}
                  <span className="text-xs font-semibold opacity-70">
                    {msg.role === 'user' ? t.youSaid : t.geminiSaid}
                  </span>
                  {msg.hasImage && <span className="text-xs opacity-50">{t.imageNote}</span>}
                  {msg.role === 'gemini' && (
                    <button
                      onClick={() => speak(msg.text)}
                      className="ml-auto text-violet-400 hover:text-violet-300 transition-colors"
                      title="Re-read"
                    >
                      <FaVolumeUp className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className={`rounded-xl px-4 py-3 border ${msgBubbleGemini}`}>
                <div className="flex items-center gap-2">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-violet-400"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay }}
                    />
                  ))}
                  <span className="text-xs ml-1 opacity-70">{t.statusThinking}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center bg-red-500/10 rounded-lg py-2 px-3 border border-red-500/20">
            {error}
          </p>
        )}
        {!hasSpeechSupport && (
          <p className="text-yellow-400 text-xs text-center bg-yellow-500/10 rounded-lg py-2 px-3 border border-yellow-500/20">
            {t.noSupport}
          </p>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {!inCall ? (
            <motion.button
              onClick={startCall}
              disabled={!hasSpeechSupport}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <FaPhone className="w-4 h-4" />
              {t.startCall}
            </motion.button>
          ) : (
            <motion.button
              onClick={endCall}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all"
            >
              <FaPhoneSlash className="w-4 h-4" />
              {t.endCall}
            </motion.button>
          )}

          <motion.button
            onClick={() => { if (cameraOn) stopCamera(); else startCamera(); }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all border ${
              cameraOn
                ? isDarkMode
                  ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30'
                  : 'bg-green-50 border-green-400 text-green-700 hover:bg-green-100'
                : isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'
                : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cameraOn ? <FaVideo className="w-4 h-4" /> : <FaVideoSlash className="w-4 h-4" />}
            {cameraOn ? t.camOn : t.camOff}
          </motion.button>
        </div>

        <p className="text-xs text-gray-400 text-center">{t.powered}</p>
      </div>
    </div>
  );
}

export default GeminiVoiceDemo;
