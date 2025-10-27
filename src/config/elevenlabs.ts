// ElevenLabs configuration
const getElevenLabsAgentId = (): string => {
  const rawId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  
  if (!rawId) {
    console.warn('VITE_ELEVENLABS_AGENT_ID is not set');
    return '';
  }
  
  // Clean any quotes that might be present
  const cleanId = rawId.replace(/^["']|["']$/g, '').trim();
  
  console.log('ElevenLabs Config: Raw ID:', rawId);
  console.log('ElevenLabs Config: Clean ID:', cleanId);
  
  return cleanId;
};

export const ELEVENLABS_AGENT_ID = getElevenLabsAgentId();