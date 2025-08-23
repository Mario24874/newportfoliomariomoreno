import React, { useEffect, useState } from 'react';
import { FaMicrophone, FaVolumeUp, FaExternalLinkAlt } from 'react-icons/fa';

interface EmbeddedElevenLabsWidgetProps {
  agentId: string;
}

const EmbeddedElevenLabsWidget: React.FC<EmbeddedElevenLabsWidgetProps> = ({ agentId }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let checkCount = 0;
    const maxChecks = 8;
    
    console.log('EmbeddedElevenLabsWidget: Starting with agentId:', agentId);
    
    // Check if the script is already loaded (from index.html)
    const checkScript = () => {
      const script = document.querySelector('script[src="https://elevenlabs.io/convai-widget/index.js"]');
      const widgetExists = window.customElements && window.customElements.get('elevenlabs-convai');
      
      console.log(`Check ${checkCount + 1}: Script found: ${!!script}, Widget registered: ${!!widgetExists}`);
      
      if (script && widgetExists) {
        console.log('ElevenLabs widget script is loaded and registered');
        setScriptLoaded(true);
      } else if (script && !widgetExists) {
        // Script loaded but widget not registered yet, wait more
        console.log('Script loaded, waiting for widget registration...');
        checkCount++;
        if (checkCount < maxChecks) {
          setTimeout(checkScript, 1500);
        } else {
          console.warn('ElevenLabs widget failed to register after multiple attempts');
          setShowFallback(true);
        }
      } else {
        checkCount++;
        if (checkCount < maxChecks) {
          console.log('Script not loaded yet, retrying...');
          setTimeout(checkScript, 1000);
        } else {
          console.warn('ElevenLabs widget script failed to load');
          setShowFallback(true);
        }
      }
    };

    // Check immediately and retry if needed
    const initialTimer = setTimeout(checkScript, 500);
    
    return () => {
      clearTimeout(initialTimer);
    };
  }, [agentId]);

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
      <div className="relative min-h-[100px]">
        {!showFallback ? (
          <>
            <elevenlabs-convai 
              agent-id={agentId}
              style={{
                position: 'relative',
                display: 'block'
              }}
            ></elevenlabs-convai>
            {!scriptLoaded && (
              <div className="text-center text-sm text-gray-500 mt-2">
                Loading voice assistant...
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="bg-purple-100 rounded-lg p-4 mb-4">
              <FaMicrophone className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-gray-700 mb-2">
                Voice Assistant Demo Available
              </p>
              <a 
                href={`https://elevenlabs.io/app/conversational-ai/${agentId}/widget`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                Open Voice Demo <FaExternalLinkAlt className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-gray-500">
              The embedded widget requires HTTPS. Click above to try the demo.
            </p>
          </div>
        )}
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