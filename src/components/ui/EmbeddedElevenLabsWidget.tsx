import React, { useState, useRef, useCallback } from 'react';
import { FaMicrophone, FaStop, FaCircle } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmbeddedElevenLabsWidgetProps {
  agentId: string;
}

type ConvStatus = 'idle' | 'connecting' | 'connected' | 'error';

const EmbeddedElevenLabsWidget: React.FC<EmbeddedElevenLabsWidgetProps> = ({ agentId }) => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [status, setStatus] = useState<ConvStatus>('idle');
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const convRef = useRef<{ endSession: () => Promise<void> } | null>(null);

  const startConversation = useCallback(async () => {
    setErrorMsg('');
    setStatus('connecting');
    try {
      // Dynamic import to keep bundle clean
      const { Conversation } = await import('@11labs/client');
      const conv = await Conversation.startSession({
        agentId,
        onConnect: () => setStatus('connected'),
        onDisconnect: () => { setStatus('idle'); setAgentSpeaking(false); },
        onError: (err: Error) => {
          setErrorMsg(err?.message ?? 'Connection error');
          setStatus('error');
          setAgentSpeaking(false);
        },
        onModeChange: ({ mode }: { mode: string }) => setAgentSpeaking(mode === 'speaking'),
      });
      convRef.current = conv;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [agentId]);

  const stopConversation = useCallback(async () => {
    await convRef.current?.endSession();
    convRef.current = null;
    setStatus('idle');
    setAgentSpeaking(false);
  }, []);

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 flex flex-col items-center gap-5">
      {/* Orb / mic button */}
      <div className="relative flex items-center justify-center">
        {/* Pulse ring when connected */}
        {isConnected && (
          <span className="absolute inline-flex h-24 w-24 rounded-full bg-purple-400 opacity-30 animate-ping" />
        )}
        <button
          onClick={isConnected ? stopConversation : startConversation}
          disabled={isConnecting}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg
            transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300
            ${isConnected
              ? 'bg-gradient-to-br from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
              : isConnecting
                ? 'bg-gradient-to-br from-purple-400 to-pink-400 cursor-wait'
                : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            }
          `}
          aria-label={isConnected ? (isEs ? 'Detener' : 'Stop') : (isEs ? 'Iniciar' : 'Start')}
        >
          {isConnected ? (
            <FaStop className="w-7 h-7 text-white" />
          ) : (
            <FaMicrophone className={`w-7 h-7 text-white ${isConnecting ? 'animate-pulse' : ''}`} />
          )}
        </button>
      </div>

      {/* Status label */}
      <div className="flex items-center gap-2">
        <FaCircle className={`text-[8px] ${
          isConnected ? (agentSpeaking ? 'text-blue-400 animate-pulse' : 'text-green-400')
          : isConnecting ? 'text-yellow-400 animate-pulse'
          : status === 'error' ? 'text-red-400'
          : 'text-gray-300'
        }`} />
        <span className="text-sm font-medium text-gray-600">
          {isConnected
            ? agentSpeaking
              ? (isEs ? 'Asistente hablando…' : 'Assistant speaking…')
              : (isEs ? 'Escuchando — habla ahora' : 'Listening — speak now')
            : isConnecting
              ? (isEs ? 'Conectando…' : 'Connecting…')
              : status === 'error'
                ? (isEs ? 'Error de conexión' : 'Connection error')
                : (isEs ? 'Listo para hablar' : 'Ready to talk')}
        </span>
      </div>

      {/* Error message */}
      {status === 'error' && errorMsg && (
        <p className="text-xs text-red-500 text-center max-w-xs">{errorMsg}</p>
      )}

      {/* Instructions */}
      <div className="w-full bg-white/70 rounded-lg p-4 text-center">
        <p className="text-xs text-gray-500 leading-relaxed">
          {isEs
            ? isConnected
              ? 'Habla con el micrófono abierto. Haz clic en el botón rojo para finalizar.'
              : 'Haz clic en el micrófono y permite el acceso. Pregunta sobre proyectos, experiencia o IA.'
            : isConnected
              ? 'Speak into your mic. Click the red button to end the session.'
              : 'Click the mic and allow access. Ask about projects, experience, or AI.'}
        </p>
      </div>
    </div>
  );
};

export default EmbeddedElevenLabsWidget;
