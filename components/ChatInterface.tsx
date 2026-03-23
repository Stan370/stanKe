import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Terminal as TerminalIcon, ChevronRight, Database } from 'lucide-react';
import { streamChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  /** True when the user has uploaded docs to R2; vectors live server-side */
  docsUploaded?: boolean;
}

// ── Error metadata map ───────────────────────────────────────────────────────
type ErrorEntry = {
  label: string;
  color: 'red' | 'orange' | 'yellow' | 'zinc';
  fix: string;
};

const GEMINI_ERRORS: Record<string, ErrorEntry> = {
  NOT_FOUND: {
    label: '404 Not Found',
    color: 'yellow',
    fix: 'The requested resource (model, file, or endpoint) does not exist. Check the resource URL or model name.',
  },
  RESOURCE_EXHAUSTED: {
    label: '429 Quota Exceeded',
    color: 'orange',
    fix: 'API rate limit reached. Wait a minute before sending another message, or check your quota in Google AI Studio.',
  },
  CANCELLED: {
    label: '499 Request Cancelled',
    color: 'zinc',
    fix: 'The request was cancelled before it completed. This may be a network timeout. Please try again.',
  },
  UNKNOWN: {
    label: '500 Internal / Unknown',
    color: 'red',
    fix: 'The service is temporarily overloaded or encountered an unknown error. Retry after a short wait.',
  },
  INTERNAL: {
    label: '500 Internal Server Error',
    color: 'red',
    fix: 'The backend encountered an unexpected condition. Check your API key configuration and server logs.',
  },
};

const colorMap = {
  red: { bg: 'bg-red-950/30', border: 'border-red-900/50', icon: 'text-red-500', msg: 'text-red-300', fix: 'text-red-400/80', divider: 'border-red-900/30' },
  orange: { bg: 'bg-orange-950/30', border: 'border-orange-900/50', icon: 'text-orange-500', msg: 'text-orange-300', fix: 'text-orange-400/80', divider: 'border-orange-900/30' },
  yellow: { bg: 'bg-yellow-950/30', border: 'border-yellow-900/50', icon: 'text-yellow-400', msg: 'text-yellow-300', fix: 'text-yellow-400/80', divider: 'border-yellow-900/30' },
  zinc: { bg: 'bg-zinc-900/50', border: 'border-zinc-700/60', icon: 'text-zinc-400', msg: 'text-zinc-400', fix: 'text-zinc-500', divider: 'border-zinc-700/30' },
};

function renderErrorCard(entry: ErrorEntry, message: string) {
  const c = colorMap[entry.color];
  return (
    <div className={`${c.bg} ${c.border} border rounded p-3 my-2`}>
      <div className={`font-bold mb-1 flex items-center gap-2 text-zinc-200`}>
        <span className={c.icon}>⚠</span> {entry.label}
      </div>
      <div className={`${c.msg} font-mono text-[10px] mb-2`}>{message}</div>
      <div className={`${c.fix} text-xs border-t ${c.divider} pt-2 mt-2`}>
        <strong>Suggested Fix:</strong> {entry.fix}
      </div>
    </div>
  );
}

const MessageFormatter: React.FC<{ text: string }> = ({ text }) => {
  // 1. Try to extract and parse a JSON error object
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
      if (parsed.error) {
        const status: string = parsed.error.status ?? '';
        const code: number = parsed.error.code ?? 0;
        const msg: string = parsed.error.message ?? JSON.stringify(parsed.error);

        // Lookup by status string first, fall back to numeric code
        const entry =
          GEMINI_ERRORS[status] ??
          (code === 404 ? GEMINI_ERRORS.NOT_FOUND :
            code === 429 ? GEMINI_ERRORS.RESOURCE_EXHAUSTED :
              code === 499 ? GEMINI_ERRORS.CANCELLED :
                code === 500 ? GEMINI_ERRORS.INTERNAL : null);

        if (entry) return renderErrorCard(entry, msg);

        // Unknown JSON error fallback
        return renderErrorCard(
          { label: `Error ${code || ''}`, color: 'red', fix: 'Please check your request parameters or system configuration.' },
          msg
        );
      }
    }
  } catch (_) {/* not valid JSON */ }

  // 2. Plain-text error string detection (e.g. "Error: Internal Server Error: Network connection lost")
  if (/network connection lost/i.test(text) || /internal server error/i.test(text)) {
    return renderErrorCard(GEMINI_ERRORS.INTERNAL, text.replace(/^Error:\s*/i, ''));
  }
  if (/not found/i.test(text) && /404/.test(text)) {
    return renderErrorCard(GEMINI_ERRORS.NOT_FOUND, text.replace(/^Error:\s*/i, ''));
  }
  if (/quota|rate.?limit|resource.?exhausted|429/i.test(text)) {
    return renderErrorCard(GEMINI_ERRORS.RESOURCE_EXHAUSTED, text.replace(/^Error:\s*/i, ''));
  }
  if (/cancelled|canceled|499/i.test(text)) {
    return renderErrorCard(GEMINI_ERRORS.CANCELLED, text.replace(/^Error:\s*/i, ''));
  }



  // ── Block-aware renderer ───────────────────────────────────────────────────
  const blocks: React.ReactNode[] = [];
  // Regex: split on fenced code blocks (```lang\n...```)
  const fenceRe = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const renderInline = (content: string, key: string) => {
    if (!content.trim()) return null;
    return (
      <div key={key} className="leading-relaxed">
        {content.split('\n').map((line, i, arr) => (
          <React.Fragment key={i}>
            {line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-zinc-200 font-semibold">{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
            {i < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  while ((match = fenceRe.exec(text)) !== null) {
    // Render any plain text before this block
    const before = text.slice(lastIndex, match.index);
    if (before) blocks.push(renderInline(before, `pre-${match.index}`));

    const lang = match[1] || 'text';
    let code = match[2].trimEnd();

    // Pretty-print JSON
    if (lang === 'json') {
      try { code = JSON.stringify(JSON.parse(code), null, 2); } catch (_) { }
    }

    const langLabel = lang || 'code';
    blocks.push(
      <div key={`code-${match.index}`} className="my-3 rounded border border-zinc-800 overflow-hidden text-[10px]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-zinc-900 border-b border-zinc-800">
          <span className="font-mono text-zinc-500 uppercase tracking-widest">{langLabel}</span>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors text-[9px] uppercase tracking-widest"
          >
            copy
          </button>
        </div>
        {/* Code body */}
        <pre className="p-3 overflow-x-auto text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-words bg-zinc-950">
          {code}
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text after last code block
  const tail = text.slice(lastIndex);
  if (tail) blocks.push(renderInline(tail, `tail-${lastIndex}`));

  return <div>{blocks.length ? blocks : renderInline(text, 'full')}</div>;
};


export const ChatInterface: React.FC<ChatInterfaceProps> = ({ docsUploaded = false }) => {
  const [isOpen, setIsOpen] = useState(true);
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
      // Context retrieval now happens server-side via CF AI Search.
      // The /api/chat Worker calls env.AI.autorag().search() internally.
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
        <MessageSquare size={24} />
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
          {docsUploaded && (
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded font-mono ml-1">
              <Database size={9} />
              R2 indexed
            </span>
          )}
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
              {msg.role === 'user' ? (
                msg.text
              ) : (
                <MessageFormatter text={msg.text} />
              )}
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
            placeholder={docsUploaded ? "Query with uploaded doc context..." : "Ask anything you want to know about me..."}
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
          {docsUploaded ? 'RAG: CF AI Search active' : 'Press Enter to execute'}
        </div>
      </form>
    </div>
  );
};
