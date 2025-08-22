import React, { useEffect } from 'react';
import { FaMicrophone, FaVolumeUp } from 'react-icons/fa';

interface EmbeddedElevenLabsWidgetProps {
  agentId: string;
}

const EmbeddedElevenLabsWidget: React.FC<EmbeddedElevenLabsWidgetProps> = ({ agentId }) => {
  useEffect(() => {
    let script: HTMLScriptElement | null = null;
    
    // Dynamically load the ElevenLabs ConvAI script
    const loadScript = () => {
      const existingScript = document.querySelector('script[src="https://elevenlabs.io/convai-widget/index.js"]');
      if (!existingScript) {
        script = document.createElement('script');
        script.src = 'https://elevenlabs.io/convai-widget/index.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          console.log('ElevenLabs widget script loaded successfully');
        };
        
        script.onerror = (error) => {
          console.error('Failed to load ElevenLabs widget script:', error);
        };
        
        document.head.appendChild(script);
      }
    };

    // Add delay for production environments
    const timer = setTimeout(loadScript, 100);
    
    return () => {
      clearTimeout(timer);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 min-h-[300px] flex flex-col items-center justify-center">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaMicrophone className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">AI Voice Assistant</h3>
        <p className="text-gray-600 text-sm">
          Click the microphone to start a conversation with my AI-powered voice assistant
        </p>
      </div>

      {/* ElevenLabs Widget Container */}
      <div className="relative">
        <elevenlabs-convai 
          agent-id={agentId}
          style={{
            position: 'relative',
            display: 'block'
          }}
        ></elevenlabs-convai>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-white bg-opacity-70 rounded-lg p-4 text-center max-w-sm">
        <div className="flex items-center justify-center space-x-2 text-purple-600 mb-2">
          <FaVolumeUp className="w-4 h-4" />
          <span className="font-medium text-sm">How to use:</span>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">
          Click the microphone button to start speaking. Ask about my experience, projects, or anything related to AI development!
        </p>
      </div>
    </div>
  );
};

export default EmbeddedElevenLabsWidget;