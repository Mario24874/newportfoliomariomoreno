import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaVideoSlash, FaRobot, FaPhone, FaPhoneSlash, FaMicrophone } from 'react-icons/fa';
import { SiGoogle } from 'react-icons/si';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Ephemeral token endpoint (n8n webhook generates it server-side)
const TOKEN_URL =
  import.meta.env.VITE_GEMINI_LIVE_TOKEN_URL ||
  '/proxy/n8n/webhook/gemini-live-token';

// Gemini Live API — BidiGenerateContentConstrained requires ephemeral tokens
const WS_BASE =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';

const MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

interface Message {
  role: 'user' | 'gemini';
  text: string;
  imageDataUrl?: string;
  partial?: boolean;
}

const T = {
  es: {
    title: 'Asistente de Voz IA',
    subtitle: 'Llamada en tiempo real con Gemini. Activa la cámara para que también te vea.',
    startCall: 'Iniciar llamada',
    endCall: 'Colgar',
    camOn: 'Cámara activa',
    camOff: 'Activar cámara',
    statusConnecting: 'Conectando...',
    statusListening: 'Escuchando...',
    statusSpeaking: 'Gemini está hablando...',
    statusReady: 'En llamada',
    youSaid: 'Tú:',
    geminiSaid: 'Gemini:',
    camError: 'No se pudo acceder a la cámara.',
    tokenError: 'Error al conectar con el agente. Verifica la configuración.',
    placeholder: 'Presiona "Iniciar llamada" para comenzar.',
    powered: 'Powered by Gemini Live API',
    hint: 'Prueba: "¿Qué ves en mi cámara?" o "Explícame qué es la IA"',
  },
  en: {
    title: 'AI Voice Assistant',
    subtitle: 'Real-time call with Gemini. Enable camera so it can also see you.',
    startCall: 'Start call',
    endCall: 'Hang up',
    camOn: 'Camera on',
    camOff: 'Enable camera',
    statusConnecting: 'Connecting...',
    statusListening: 'Listening...',
    statusSpeaking: 'Gemini is speaking...',
    statusReady: 'In call',
    youSaid: 'You:',
    geminiSaid: 'Gemini:',
    camError: 'Could not access camera.',
    tokenError: 'Failed to connect to the agent. Check configuration.',
    placeholder: 'Press "Start call" to begin.',
    powered: 'Powered by Gemini Live API',
    hint: 'Try: "What do you see in my camera?" or "Explain what AI is"',
  },
} as const;

export function GeminiVoiceDemo() {
  const { isDarkMode } = useTheme();
  const { language: appLang } = useLanguage();
  const lang = appLang === 'en' ? 'en' : 'es';
  const t = T[lang];

  // ── Refs ─────────────────────────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const captureWorkletRef = useRef<AudioWorkletNode | null>(null);
  const playbackWorkletRef = useRef<AudioWorkletNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inCallRef = useRef(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [inCall, setInCall] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { doEndCall(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Audio helpers ─────────────────────────────────────────────────────────
  function float32ToBase64PCM16(float32: Float32Array): string {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32767));
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return window.btoa(binary);
  }

  function base64PCM16ToFloat32(b64: string): Float32Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    return float32;
  }

  // ── WebSocket message handler ─────────────────────────────────────────────
  function handleWsMessage(event: MessageEvent) {
    let data: Record<string, unknown>;
    try {
      const raw = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data as ArrayBuffer);
      data = JSON.parse(raw);
    } catch { return; }

    // Setup complete — connection ready
    if (data?.setupComplete) {
      setIsConnected(true);
      return;
    }

    const sc = data?.serverContent as Record<string, unknown> | undefined;
    if (!sc) return;

    // Audio output from Gemini
    const parts = (sc?.modelTurn as Record<string, unknown>)?.parts as Array<Record<string, unknown>> | undefined;
    if (parts?.length) {
      for (const part of parts) {
        const inline = part.inlineData as Record<string, string> | undefined;
        if (inline?.data && playbackWorkletRef.current) {
          const float32 = base64PCM16ToFloat32(inline.data);
          playbackWorkletRef.current.port.postMessage(float32);
          setIsSpeaking(true);
        }
      }
    }

    // Input transcription (user speech → text)
    const inTx = sc?.inputTranscription as Record<string, unknown> | undefined;
    if (inTx?.text) {
      const text = inTx.text as string;
      const finished = !!(inTx.finished);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'user' && last?.partial) {
          return [...prev.slice(0, -1), { role: 'user', text, partial: !finished }];
        }
        return [...prev, { role: 'user', text, partial: !finished }];
      });
    }

    // Output transcription (Gemini speech → text)
    const outTx = sc?.outputTranscription as Record<string, unknown> | undefined;
    if (outTx?.text) {
      const text = outTx.text as string;
      const finished = !!(outTx.finished);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'gemini' && last?.partial) {
          return [...prev.slice(0, -1), { role: 'gemini', text, partial: !finished }];
        }
        return [...prev, { role: 'gemini', text, partial: !finished }];
      });
    }

    // Turn complete
    if (sc?.turnComplete) setIsSpeaking(false);

    // Interrupted (user spoke over Gemini)
    if (sc?.interrupted) {
      setIsSpeaking(false);
      playbackWorkletRef.current?.port.postMessage('interrupt');
    }
  }

  // ── Audio capture setup ───────────────────────────────────────────────────
  async function startAudioCapture() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    micStreamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: 16000 });
    captureCtxRef.current = ctx;

    await ctx.audioWorklet.addModule('/audio-processors/capture.worklet.js');
    const worklet = new AudioWorkletNode(ctx, 'audio-capture-processor');
    captureWorkletRef.current = worklet;

    worklet.port.onmessage = (e: MessageEvent) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;
      const b64 = float32ToBase64PCM16(e.data.data as Float32Array);
      wsRef.current.send(JSON.stringify({
        realtimeInput: { audio: { mimeType: 'audio/pcm', data: b64 } },
      }));
    };

    const source = ctx.createMediaStreamSource(stream);
    source.connect(worklet);
  }

  // ── Audio playback setup ──────────────────────────────────────────────────
  async function startAudioPlayback() {
    const ctx = new AudioContext({ sampleRate: 24000 });
    playbackCtxRef.current = ctx;

    await ctx.audioWorklet.addModule('/audio-processors/playback.worklet.js');
    const worklet = new AudioWorkletNode(ctx, 'pcm-processor');
    playbackWorkletRef.current = worklet;

    const gain = ctx.createGain();
    gain.gain.value = 1.0;
    worklet.connect(gain);
    gain.connect(ctx.destination);
  }

  // ── Camera ───────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          const video = videoRef.current!;
          if (video.videoWidth > 0) { resolve(); return; }
          const handler = () => { video.removeEventListener('loadedmetadata', handler); resolve(); };
          video.addEventListener('loadedmetadata', handler);
          setTimeout(resolve, 2000);
        });
        await videoRef.current.play();
      }
      setCameraOn(true);
      setError(null);
      if (wsRef.current?.readyState === WebSocket.OPEN) startVideoFrames();
    } catch {
      setError(t.camError);
    }
  };

  const stopCamera = useCallback(() => {
    stopVideoFrames();
    videoStreamRef.current?.getTracks().forEach(tr => tr.stop());
    videoStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  function startVideoFrames() {
    if (captureIntervalRef.current) return;
    captureIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;
      const video = videoRef.current;
      if (video.videoWidth === 0) return;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const b64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      if (b64 && b64.length > 300) {
        wsRef.current!.send(JSON.stringify({
          realtimeInput: { video: { mimeType: 'image/jpeg', data: b64 } },
        }));
        setCaptureFlash(true);
        setTimeout(() => setCaptureFlash(false), 120);
      }
    }, 1000); // 1 FPS
  }

  function stopVideoFrames() {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  }

  // ── Call management ───────────────────────────────────────────────────────
  const startCall = async () => {
    inCallRef.current = true;
    setInCall(true);
    setIsConnected(false);
    setMessages([]);
    setCallDuration(0);
    setError(null);
    callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);

    try {
      // 1. Fetch ephemeral token from backend (n8n)
      const tokenRes = await fetch(TOKEN_URL, { method: 'POST' });
      if (!tokenRes.ok) throw new Error(`Token error: ${tokenRes.status}`);
      const { token } = await tokenRes.json() as { token: string };

      // 2. Open WebSocket to Gemini Live API
      const ws = new WebSocket(`${WS_BASE}?access_token=${token}`);
      wsRef.current = ws;

      ws.onopen = async () => {
        // System instruction in the configured language
        const sysEn = `You are a real-time voice assistant for Mario Moreno's portfolio demo. Be concise: max 1-2 short sentences per reply. For greetings: 5 words max. When asked to describe the camera image, give a detailed visual description. Never ask follow-up questions.`;
        const sysEs = `Eres un asistente de voz en tiempo real para el portfolio de Mario Moreno. Sé muy breve: máximo 1-2 oraciones cortas. Para saludos: máximo 5 palabras. Si te piden describir la imagen de la cámara, da una descripción visual detallada. No hagas preguntas de seguimiento.`;

        // 3. Send setup message with model, voice, transcriptions
        ws.send(JSON.stringify({
          setup: {
            model: `models/${MODEL}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Aoede' },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: lang === 'es' ? sysEs : sysEn }],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
                silenceDurationMs: 1500,
                prefixPaddingMs: 300,
              },
              turnCoverage: 'TURN_INCLUDES_ONLY_ACTIVITY',
            },
          },
        }));

        // 4. Start audio I/O
        await startAudioPlayback();
        await startAudioCapture();

        // 5. Start video frames if camera already on
        if (cameraOn) startVideoFrames();
      };

      ws.onmessage = handleWsMessage;
      ws.onerror = () => setError('WebSocket connection error.');
      ws.onclose = () => {
        setIsConnected(false);
        setIsSpeaking(false);
        if (inCallRef.current) setError('Connection closed by server.');
      };
    } catch (err) {
      setError(t.tokenError + ' ' + (err instanceof Error ? err.message : ''));
      doEndCall();
    }
  };

  function doEndCall() {
    inCallRef.current = false;
    setInCall(false);
    setIsConnected(false);
    setIsSpeaking(false);

    // WebSocket
    wsRef.current?.close();
    wsRef.current = null;

    // Audio capture
    captureWorkletRef.current?.disconnect();
    captureWorkletRef.current?.port.close();
    captureWorkletRef.current = null;
    captureCtxRef.current?.close();
    captureCtxRef.current = null;
    micStreamRef.current?.getTracks().forEach(tr => tr.stop());
    micStreamRef.current = null;

    // Audio playback
    playbackWorkletRef.current?.disconnect();
    playbackWorkletRef.current = null;
    playbackCtxRef.current?.close();
    playbackCtxRef.current = null;

    // Video
    stopVideoFrames();

    // Timer
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const callStatus = !isConnected && inCall
    ? t.statusConnecting
    : isSpeaking
    ? t.statusSpeaking
    : inCall
    ? t.statusListening
    : t.statusReady;

  const statusColor = !isConnected && inCall
    ? 'text-yellow-400'
    : isSpeaking
    ? 'text-violet-400'
    : inCall
    ? 'text-green-400'
    : isDarkMode ? 'text-gray-500' : 'text-gray-400';

  const barColor = !isConnected && inCall
    ? 'bg-yellow-400'
    : isSpeaking
    ? 'bg-violet-400'
    : inCall
    ? 'bg-green-400'
    : 'bg-gray-400';

  const card = isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-200';
  const msgUser = isDarkMode ? 'bg-blue-600/20 border-blue-500/30 text-gray-100' : 'bg-blue-50 border-blue-200 text-gray-800';
  const msgGemini = isDarkMode ? 'bg-gray-700/60 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800';

  // ── Render ────────────────────────────────────────────────────────────────
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
              className="overflow-hidden rounded-xl border border-gray-600 relative"
            >
              <video ref={videoRef} className="w-full max-h-48 object-cover rounded-xl bg-black" muted playsInline />
              <AnimatePresence>
                {captureFlash && (
                  <motion.div
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-white rounded-xl pointer-events-none"
                  />
                )}
              </AnimatePresence>
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-white text-[10px] font-semibold tracking-wide">LIVE</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <canvas ref={canvasRef} className="hidden" />

        {/* Status bar */}
        {inCall && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${isDarkMode ? 'bg-gray-900/60' : 'bg-gray-100'}`}>
            <div className="flex items-end gap-0.5 h-5">
              {[0, 0.12, 0.24].map((delay, i) => (
                <motion.div
                  key={i}
                  className={`w-1.5 rounded-full ${barColor}`}
                  animate={inCall ? { scaleY: [0.4, 1, 0.4] } : { scaleY: 0.4 }}
                  transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
                />
              ))}
            </div>
            <span className={`text-sm font-medium ${statusColor}`}>{callStatus}</span>
            {isConnected && (
              <FaMicrophone className="ml-auto w-3 h-3 text-green-400 animate-pulse" />
            )}
          </div>
        )}

        {/* Messages */}
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
              <div className={`max-w-[85%] rounded-xl px-3 py-2 border text-sm ${msg.role === 'user' ? msgUser : msgGemini} ${msg.partial ? 'opacity-70' : ''}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {msg.role === 'gemini' && <FaRobot className="w-3 h-3 text-violet-400" />}
                  <span className="text-xs font-semibold opacity-70">
                    {msg.role === 'user' ? t.youSaid : t.geminiSaid}
                  </span>
                  {msg.partial && (
                    <span className="ml-1 text-xs opacity-50">●</span>
                  )}
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center bg-red-500/10 rounded-lg py-2 px-3 border border-red-500/20">{error}</p>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {!inCall ? (
            <motion.button
              onClick={startCall}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 transition-all"
            >
              <FaPhone className="w-4 h-4" />
              {t.startCall}
            </motion.button>
          ) : (
            <motion.button
              onClick={doEndCall}
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
