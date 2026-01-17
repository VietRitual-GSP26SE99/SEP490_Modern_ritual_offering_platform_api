
import React, { useState } from 'react';
import { askRitualAssistant } from '../services/gemini';

const Assistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const botResponse = await askRitualAssistant(userMsg);
    setMessages(prev => [...prev, { role: 'bot', text: botResponse || '...' }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen ? (
        <div className="bg-white rounded-3xl shadow-2xl border border-gold/20 w-80 md:w-96 overflow-hidden flex flex-col h-[500px]">
          <div className="bg-primary p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">auto_awesome</span>
              <div>
                <p className="font-bold text-sm">Trợ lý Ritual</p>
                <p className="text-[10px] opacity-80 uppercase tracking-widest">Tư vấn tâm linh AI</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-ritual-bg">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400 mb-2">Chào bạn, tôi có thể giúp gì cho nghi lễ của gia đình mình?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button onClick={() => setInput("Cần chuẩn bị gì cho cúng đầy tháng?")} className="text-[10px] bg-white border border-gold/30 px-3 py-1.5 rounded-full hover:bg-gold/10 transition-colors">Cúng đầy tháng</button>
                  <button onClick={() => setInput("Hướng đặt mâm cúng tân gia?")} className="text-[10px] bg-white border border-gold/30 px-3 py-1.5 rounded-full hover:bg-gold/10 transition-colors">Cúng tân gia</button>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-gold/20 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white border border-gold/20 p-3 rounded-2xl rounded-tl-none animate-pulse">
                        <span className="text-gold">...</span>
                    </div>
                </div>
            )}
          </div>
          <div className="p-4 bg-white border-t border-gold/10 flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              type="text" 
              placeholder="Hỏi về nghi lễ..." 
              className="flex-1 border-gold/20 rounded-xl px-4 py-2 text-sm focus:ring-primary focus:border-primary" 
            />
            <button 
              onClick={handleSend}
              className="bg-primary text-white p-2 rounded-xl hover:bg-[#600018] transition-colors"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-primary text-white size-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-4 border-white"
        >
          <span className="material-symbols-outlined text-3xl">chat</span>
        </button>
      )}
    </div>
  );
};

export default Assistant;
