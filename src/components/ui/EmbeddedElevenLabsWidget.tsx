import React, { useEffect, useRef, useState } from 'react';
import { FaMicrophone, FaVolumeUp, FaExternalLinkAlt, FaCircle } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'agent-id'?: string;
      };
    }
  }
}

interface EmbeddedElevenLabsWidgetProps {
  agentId: string;
}

const EmbeddedElevenLabsWidget: React.FC<EmbeddedElevenLabsWidgetProps> = ({ agentId }) => {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [widgetReady, setWidgetReady] = useState(false);
  const [activated, setActivated] = useState(false);
  const widgetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 12;

    const checkReady = () => {
      const registered = window.customElements?.get('elevenlabs-convai');
      if (registered) {
        setWidgetReady(true);
        return;
      }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkReady, 1000);
      }
    };

    setTimeout(checkReady, 800);
  }, []);

  const handleLaunch = () => {
    setActivated(true);
    // Give the widget element time to mount, then trigger click
    setTimeout(() => {
      if (widgetRef.current) {
        const btn = widgetRef.current.shadowRoot?.querySelector('button');
        btn?.click();
      }
    }, 300);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 flex flex-col items-center gap-5">
      {/* Icon + Title */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
          <FaMicrophone className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">
          {isEs ? 'Asistente de Voz IA' : 'AI Voice Assistant'}
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          {isEs ? 'Powered by ElevenLabs Conversational AI' : 'Powered by ElevenLabs Conversational AI'}
        </p>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-gray-100">
        <FaCircle className={`text-xs ${widgetReady ? 'text-green-400' : 'text-yellow-400 animate-pulse'}`} />
        <span className="text-xs text-gray-600 font-medium">
          {widgetReady
            ? (isEs ? 'Widget listo' : 'Widget ready')
            : (isEs ? 'Cargando widget...' : 'Loading widget...')}
        </span>
      </div>

      {/* Hidden ElevenLabs web component — renders as floating button */}
      {activated && (
        <elevenlabs-convai
          ref={(el: HTMLElement | null) => { widgetRef.current = el; }}
          agent-id={agentId}
          style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 9998 }}
        />
      )}

      {/* Launch button */}
      {!activated ? (
        <button
          onClick={handleLaunch}
          disabled={!widgetReady}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaMicrophone className="w-4 h-4" />
          {isEs ? 'Iniciar Chat de Voz' : 'Start Voice Chat'}
        </button>
      ) : (
        <div className="text-center">
          <p className="text-sm text-purple-700 font-medium">
            {isEs
              ? '¡El asistente está activo! Búscalo en la esquina inferior derecha de la pantalla.'
              : 'Assistant is active! Find it in the bottom-right corner of the screen.'}
          </p>
          <button
            onClick={() => setActivated(false)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            {isEs ? 'Cerrar' : 'Close'}
          </button>
        </div>
      )}

      {/* Fallback direct link */}
      <a
        href={`https://elevenlabs.io/app/conversational-ai/${agentId}/widget`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-700 transition-colors"
      >
        <FaExternalLinkAlt className="w-3 h-3" />
        {isEs ? 'Abrir en nueva pestaña' : 'Open in new tab'}
      </a>

      {/* How to use */}
      <div className="w-full bg-white/70 rounded-lg p-4">
        <div className="flex items-center gap-2 text-purple-600 mb-2">
          <FaVolumeUp className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">
            {isEs ? 'Cómo usar:' : 'How to use:'}
          </span>
        </div>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• {isEs ? 'Haz clic en "Iniciar Chat de Voz"' : 'Click "Start Voice Chat"'}</li>
          <li>• {isEs ? 'Busca el widget en la esquina inferior derecha' : 'Find the widget at the bottom-right corner'}</li>
          <li>• {isEs ? 'Pregunta sobre proyectos, experiencia o IA' : 'Ask about projects, experience, or AI'}</li>
        </ul>
      </div>
    </div>
  );
};

export default EmbeddedElevenLabsWidget;
