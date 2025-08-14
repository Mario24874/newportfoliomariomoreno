import React, { useEffect } from 'react';

interface ElevenLabsWidgetProps {
  agentId: string;
}

const ElevenLabsWidget: React.FC<ElevenLabsWidgetProps> = ({ agentId }) => {
  useEffect(() => {
    // Dynamically load the ElevenLabs ConvAI script
    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;
    
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://elevenlabs.io/convai-widget/index.js"]');
    if (!existingScript) {
      document.head.appendChild(script);
    }
    
    return () => {
      // Cleanup if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Only render if agentId is provided
  if (!agentId) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] pointer-events-auto">
      <elevenlabs-convai agent-id={agentId}></elevenlabs-convai>
    </div>
  );
};

export default ElevenLabsWidget;