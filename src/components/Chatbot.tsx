import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Zap, Brain, Loader2 } from 'lucide-react';
import { chatWithPro, chatWithFlashLite } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Hello! I am the Token Forbes AI Assistant. Ask me about the leaderboard, our methodology, or the AI industry compute landscape.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFastMode, setIsFastMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      let responseText = '';
      if (isFastMode) {
        responseText = await chatWithFlashLite(userMsg);
      } else {
        responseText = await chatWithPro(
          userMsg,
          messages.map((message) => ({
            role: message.role,
            parts: [{ text: message.text }],
          })),
        );
      }
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message || 'Failed to get response.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-[#D4AF37] text-black rounded-full shadow-2xl hover:bg-[#b8952b] transition-colors z-50 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[32rem] bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-black border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Token Forbes AI</h3>
                  <p className="text-xs text-gray-500">Ask about our data</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="px-4 py-2 bg-[#1a1a1a] border-b border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400">Response Mode:</span>
              <button
                onClick={() => setIsFastMode(!isFastMode)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                  isFastMode ? 'bg-blue-500/20 text-blue-400' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                }`}
              >
                {isFastMode ? (
                  <><Zap className="w-3 h-3" /> Fast (Flash-Lite)</>
                ) : (
                  <><Brain className="w-3 h-3" /> Deep (Pro + Search)</>
                )}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#D4AF37] text-black rounded-br-sm'
                        : 'bg-[#1a1a1a] text-gray-200 border border-white/5 rounded-bl-sm markdown-body'
                    }`}
                  >
                    {msg.role === 'model' ? (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a1a] p-3 rounded-2xl border border-white/5 rounded-bl-sm flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-black border-t border-white/10">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#D4AF37] hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
