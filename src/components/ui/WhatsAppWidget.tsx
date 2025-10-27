import React, { useState, useRef, useEffect } from 'react';
import { FaWhatsapp, FaTimes, FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, isN8nConfigured } from '@/api/n8n';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translations } from '@/data/translations';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface WhatsAppWidgetProps {
  phoneNumber: string;
  message?: string;
}

const MAX_MESSAGES = 50;
const STORAGE_KEY = 'portfolio_chat_history';
const CONVERSATION_ID_KEY = 'portfolio_conversation_id';

// Generate or retrieve a persistent conversation ID
const getConversationId = (): string => {
  let conversationId = localStorage.getItem(CONVERSATION_ID_KEY);
  if (!conversationId) {
    conversationId = `portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(CONVERSATION_ID_KEY, conversationId);
  }
  return conversationId;
};

const WhatsAppWidget: React.FC<WhatsAppWidgetProps> = ({
  phoneNumber,
  message = "Hello! I'm interested in learning more about your AI development services."
}) => {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const t = translations[language];

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('online');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [conversationId] = useState(getConversationId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    } else {
      // Set welcome message
      setMessages([{
        id: '1',
        text: t.chatbot.welcomeMessage,
        sender: 'ai',
        timestamp: new Date()
      }]);
    }
  }, [language, t.chatbot.welcomeMessage]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      const toSave = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [messages]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Check connection status
  useEffect(() => {
    setConnectionStatus(isN8nConfigured() ? 'online' : 'offline');
  }, []);

  const handleQuickReply = (reply: string) => {
    setCurrentMessage(reply);
    setShowQuickReplies(false);
    // Auto send after setting message
    setTimeout(() => sendMessage(reply), 100);
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || currentMessage;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);
    setIsLoading(true);
    setConnectionStatus('connecting');
    setShowQuickReplies(false);

    if (isN8nConfigured()) {
      try {
        const result = await sendChatMessage(textToSend, conversationId);

        if (result.success && result.response) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: result.response,
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          setConnectionStatus('online');
        } else {
          throw new Error(result.error || 'Failed to get response');
        }
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: t.chatbot.errorMessage,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setConnectionStatus('offline');
      }
    } else {
      const offlineMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t.chatbot.offline,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, offlineMessage]);
      setConnectionStatus('offline');
    }

    setIsTyping(false);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const clearHistory = () => {
    if (confirm(language === 'en' ? 'Clear chat history and start a new conversation?' : '¿Limpiar historial e iniciar una nueva conversación?')) {
      setMessages([{
        id: '1',
        text: t.chatbot.welcomeMessage,
        sender: 'ai',
        timestamp: new Date()
      }]);
      localStorage.removeItem(STORAGE_KEY);
      // Generate new conversation ID for fresh start
      const newConversationId = `portfolio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(CONVERSATION_ID_KEY, newConversationId);
      setShowQuickReplies(true);
      window.location.reload(); // Reload to apply new conversationId
    }
  };

  return (
    <>
      {/* AI Chat Floating Button */}
      <motion.div
        id="whatsapp-widget"
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300"
          aria-label={isOpen ? "Close AI Chat" : "Open AI Chat"}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaTimes className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="robot"
                initial={{ rotate: 180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -180, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaRobot className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        {!isOpen && connectionStatus === 'online' && (
          <motion.div
            className="absolute -top-2 -left-2 w-3 h-3 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.div>

      {/* AI Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25 }}
            className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] rounded-2xl shadow-2xl overflow-hidden ${
              isDarkMode
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <FaRobot className="w-6 h-6 text-white" />
                  </div>
                  {connectionStatus === 'online' && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{t.chatbot.title}</h3>
                  <p className="text-xs opacity-90">
                    {t.chatbot.status[connectionStatus]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={clearHistory}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors text-xs"
                  title={language === 'en' ? 'Clear history' : 'Limpiar historial'}
                >
                  🗑️
                </motion.button>
                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Messages Container */}
            <div className={`flex-1 p-4 h-[340px] overflow-y-auto ${
              isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-start space-x-2 ${
                      msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender === 'ai'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : isDarkMode
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-400 text-white'
                    }`}>
                      {msg.sender === 'ai' ? <FaRobot className="w-4 h-4" /> : <FaUser className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white ml-auto'
                        : isDarkMode
                          ? 'bg-gray-700 text-white border border-gray-600'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <span className={`text-xs mt-1 block opacity-70 ${
                        msg.sender === 'user'
                          ? 'text-blue-100'
                          : isDarkMode
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-start space-x-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center">
                        <FaRobot className="w-4 h-4" />
                      </div>
                      <div className={`px-3 py-2 rounded-lg ${
                        isDarkMode
                          ? 'bg-gray-700 border border-gray-600'
                          : 'bg-white shadow-sm border border-gray-200'
                      }`}>
                        <div className="flex space-x-1">
                          <motion.div
                            className="w-2 h-2 bg-blue-500 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-blue-500 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-blue-500 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Replies */}
            <AnimatePresence>
              {showQuickReplies && messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`px-4 py-2 border-t ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex flex-wrap gap-2">
                    {Object.values(t.chatbot.quickReplies).map((reply, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {reply}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input */}
            <div className={`p-4 border-t ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.chatbot.placeholder}
                  disabled={isLoading || connectionStatus === 'offline'}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label={t.chatbot.placeholder}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!currentMessage.trim() || isLoading || connectionStatus === 'offline'}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label={t.chatbot.send}
                >
                  <FaPaperPlane className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default WhatsAppWidget;
