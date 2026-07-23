// src/components/AICopilotModal.jsx
import React, { useState } from 'react';
import { Bot, X, Sparkles, Send, Mic, AlertTriangle, Clock, Fuel, ShieldCheck } from 'lucide-react';
import { askAiCopilot } from '../services/openaiService';

export default function AICopilotModal({ isOpen, onClose, hosContext = {}, tripContext = {} }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello John! I am LogRoute AI Copilot. I analyze your HOS 49 CFR Part 395 limits, route weather, fuel intervals, and traffic in real-time. How can I optimize your trip today?',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Best departure time for Dallas → Houston?',
    'Will I hit a 11-hour driving violation?',
    'Find recommended overnight truck parking.',
    'Explain the 34-hour restart rule.',
  ];

  const handleSend = async (query) => {
    const q = query || inputVal;
    if (!q.trim() || isLoading) return;

    const userMsg = { sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const aiResponse = await askAiCopilot(q, hosContext, tripContext);
      setMessages((prev) => [...prev, { sender: 'ai', text: aiResponse }]);
    } catch (_) {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Unable to reach AI service at the moment.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[560px]">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-950 via-slate-900 to-indigo-950 p-4 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center">
              <Bot size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-slate-100 font-extrabold text-base flex items-center gap-2">
                LogRoute AI Copilot
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded-md font-mono">GPT-4o ELD</span>
              </h3>
              <p className="text-purple-300/70 text-xs">FMCSA Hours of Service & Route Optimization Assistant</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap border border-slate-700 transition-colors"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <button className="p-2.5 bg-slate-900 border border-slate-800 text-purple-400 rounded-xl hover:bg-slate-800 transition-colors">
            <Mic size={18} />
          </button>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask LogRoute AI about HOS rules, parking, departure..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 outline-none focus:border-purple-500 transition-colors"
          />

          <button
            onClick={() => handleSend()}
            className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-lg shadow-purple-600/30 active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
