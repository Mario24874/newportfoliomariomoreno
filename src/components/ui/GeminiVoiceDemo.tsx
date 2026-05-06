import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaRobot, FaVolumeUp } from 'react-icons/fa';
import { SiGoogle } from 'react-icons/si';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

// ---------------------------------------------------------------------------
// Config — replace with your n8n webhook once created
// ---------------------------------------------------------------------------
const WEBHOOK_URL =
  import.meta.env.VITE_GEMINI_VOICE_WEBHOOK_URL ||
  'https://n8n-n8n.qr7yo1.easypanel.host/webhook/gemini-voice-demo';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
const T = {
  es: {
    title: 'Asistente de Voz IA',
    subtitle: 'Habla y Gemini te responde. Activa la cámara para que también te vea.',
    micStart: 'Hablar',
    micStop: 'Escuchando...',
    camOn: 'Cámara activa',
    camOff: 'Activar cámara',
    thinking: 'Gemini está pensando...',
    youSaid: 'Tú:',
    geminiSaid: 'Gemini:',
    noSupport: 'Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.',
    camError: 'No se pudo acceder a la cámara.',
    networkError: 'Error al conectar con el agente.',
    placeholder: 'Presiona el micrófono y habla...',
    powered: 'Powered by Gemini + n8n',
    hint: 'Prueba: "¿Qué ves en mi cámara?" o "Explícame qué es la IA"',
    imageNote: '📷 con imagen',
  },
  en: {
    title: 'AI Voice Assistant',
    subtitle: 'Speak and Gemini responds. Enable camera so it can also see you.',
    micStart: 'Speak',
    micStop: 'Listening...',
    camOn: 'Camera on',
    camOff: 'Enable camera',
    thinking: 'Gemini is thinking...',
    youSaid: 'You:',
    geminiSaid: 'Gemini:',
    noSupport: 'Your browser does not support speech recognition. Use Chrome or Edge.',
    camError: 'Could not access camera.',
    networkError: 'Error connecting to agent.',
    placeholder: 'Press the microphone and speak...',
    powered: 'Powered by Gemini + n8n',
    hint: 'Try: "What do you see in my camera?" or "Explain what AI is"',
    imageNote: '📷 with image',
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
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

  const [cameraOn, setCameraOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check speech API support
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setHasSpeechSupport(false);
    synthRef.current = window.speechSynthesis;
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

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

  const toggleCamera = () => {
    if (cameraOn) stopCamera();
    else startCamera();
  };

  const captureFrame = (): string | null => {
    if (!cameraOn || !videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1]; // base64 only
  };

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang === 'en' ? 'en-US' : 'es-ES';
    utt.rate = 1.0;
    utt.pitch = 1.0;
    synthRef.current.speak(utt);
  }, [lang]);

  const sendToGemini = useCallback(async (text: string) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [lang, speak, t.networkError]);

  const startListening = () => {
    if (!hasSpeechSupport) return;
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
      if (e.error !== 'aborted') setError(`Speech error: ${e.error}`);
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognition.start();
    setListening(true);
    setError(null);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const toggleMic = () => {
    if (listening) stopListening();
    else startListening();
  };

  // ---- styles ----
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
          <div>
            <h3 className="font-bold text-lg">{t.title}</h3>
            <p className="text-xs text-blue-100">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Camera + chat area */}
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
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

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
                  {msg.hasImage && (
                    <span className="text-xs opacity-50">{t.imageNote}</span>
                  )}
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
                  <motion.div
                    className="w-2 h-2 rounded-full bg-violet-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-violet-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-violet-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                  />
                  <span className="text-xs ml-1 opacity-70">{t.thinking}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
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
          {/* Mic button */}
          <motion.button
            onClick={toggleMic}
            disabled={loading || !hasSpeechSupport}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              listening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white'
            }`}
          >
            {listening ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <FaMicrophone className="w-4 h-4" />
                </motion.div>
                {t.micStop}
              </>
            ) : (
              <>
                <FaMicrophoneSlash className="w-4 h-4" />
                {t.micStart}
              </>
            )}
          </motion.button>

          {/* Camera button */}
          <motion.button
            onClick={toggleCamera}
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

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center">{t.powered}</p>
      </div>
    </div>
  );
}

export default GeminiVoiceDemo;
