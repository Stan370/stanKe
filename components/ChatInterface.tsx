import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Terminal as TerminalIcon, ChevronRight } from 'lucide-react';
import { streamChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

export const ChatInterface: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true); // Default open for AI-native feel
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "SYSTEM_READY: I am Stan's portfolio agent. I am optimized for technical queries. How can I assist your traversal?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      const stream = streamChatResponse([], userMsg);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newHistory = [...prev];
          const lastMsg = newHistory[newHistory.length - 1];
          if (lastMsg.role === 'model') {
            lastMsg.text = fullResponse;
          }
          return newHistory;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-white text-black p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 border border-zinc-200"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full md:w-96 bg-black border-l border-zinc-900 z-50 flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className="text-zinc-500" />
          <span className="text-zinc-300 font-bold uppercase tracking-widest">Agent_Terminal v1.0</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center gap-2 opacity-50">
              {msg.role === 'model' ? <Bot size={12} /> : <User size={12} />}
              <span className="uppercase tracking-tighter">{msg.role === 'model' ? 'Agent' : 'User'}</span>
            </div>
            <div className={`leading-relaxed ${msg.role === 'model' ? 'text-zinc-300' : 'text-zinc-500'}`}>
              {msg.role === 'user' && <span className="mr-2 text-accent">❯</span>}
              {msg.text}
              {idx === messages.length - 1 && isTyping && <span className="inline-block w-2 h-4 bg-white animate-pulse ml-1 align-middle" />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-zinc-950 border-t border-zinc-900">
        <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded px-3 py-2 focus-within:border-zinc-600 transition-colors">
          <ChevronRight size={14} className="text-zinc-600" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command or query..."
            className="flex-1 bg-transparent text-zinc-300 focus:outline-none"
            autoFocus
          />
          <button 
            type="submit" 
            disabled={isTyping || !input.trim()}
            className="text-zinc-600 hover:text-white disabled:opacity-30 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="mt-2 text-[8px] text-zinc-700 uppercase tracking-widest text-center">
          Press Enter to execute
        </div>
      </form>
    </div>
  );
};
