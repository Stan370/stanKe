import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Terminal as TerminalIcon, ChevronRight, Database } from 'lucide-react';
import { streamChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

type LogEvent = { type: string; msg: string; model: number };

const WATERFALL_MODELS = [
  { name: "gemini-3-flash-preview", short: "gemini-3-flash" },
  { name: "gemini-2.5-flash", short: "gemini-2.5-flash" },
  { name: "gemini-3.1-flash-lite-preview", short: "gemini-3.1-lite" },
  { name: "gemini-2.5-flash-lite", short: "gemini-2.5-lite" },
  { name: "gemini-2.0-flash", short: "gemini-2.0-flash" }
];

interface ChatInterfaceProps {
  /** True when the user has uploaded docs to R2; vectors live server-side */
  docsUploaded?: boolean;
}

// ── Routing Animation UI ─────────────────────────────────────────────────────
const RoutingUI: React.FC = () => {
  const [currentModel, setCurrentModel] = useState(0);
  // Auto-animate the model cycling
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentModel(prev => (prev + 1) % WATERFALL_MODELS.length);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const attemptText = `attempt ${Math.max(1, currentModel + 1)} / ${WATERFALL_MODELS.length}`;
  const toolName = '';
  const isDone = false;

  return (
    <div className="py-2 font-mono text-[12px] border-zinc-800 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-5 h-5 shrink-0">
          {!isDone ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="rgb(63 63 70)" strokeWidth="2" />
              <path d="M10 2 A8 8 0 0 1 18 10" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" fill="rgb(22 197 94 / 0.15)" stroke="#22c55e" strokeWidth="0.5" />
              <path d="M6 10 L9 13 L14 7" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <div className="font-medium text-[13px] text-zinc-200 font-sans tracking-tight">
            {isDone ? 'Done' : currentModel >= 0 ? `Using: ${WATERFALL_MODELS[currentModel]?.short || 'model'}` : 'Routing request…'}
          </div>
          <div className="text-[11px] text-zinc-500 font-sans mt-0.5">POST /api/chat</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {toolName && <span className="text-[11px] text-blue-400 font-sans animate-pulse">{toolName}</span>}
          <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-[10px] text-zinc-400 font-sans uppercase tracking-widest">
            {attemptText}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-[2px] bg-zinc-800 rounded-sm overflow-hidden mb-4">
        <div
          className="h-full bg-blue-500 rounded-sm transition-all duration-500 ease-out"
          style={{ width: isDone ? '100%' : `${((currentModel + 1) / WATERFALL_MODELS.length) * 100}%` }}
        />
      </div>

      {/* Model track */}
      <div className="flex gap-1.5 mb-4 overflow-hidden">
        {WATERFALL_MODELS.map((m, i) => {
          // If a model is before currentModel, treat it as "failed" (error)
          // If it is currentModel, treat it as "active"
          // If it is after, treat it as "idle"
          let state = 'idle';
          if (i < currentModel) state = 'error';
          else if (i === currentModel) state = 'active';

          let bg = 'opacity-30 border-zinc-800 bg-transparent';
          let statusText = 'idle';
          let statusColor = 'text-zinc-600';

          if (state === 'active') {
            bg = 'opacity-100 bg-blue-950/20 border-blue-900/50';
            statusText = '● active';
            statusColor = 'text-blue-400';
          } else if (state === 'error') {
            bg = 'opacity-100 bg-red-950/20 border-red-900/50';
            statusText = '✕ 429 rate limit';
            statusColor = 'text-red-400';
          }

          return (
            <div key={i} className={`flex-1 min-w-0 border rounded px-1.5 py-1.5 transition-all duration-300 ${bg}`}>
              <div className="text-[9px] text-zinc-500 mb-0.5 font-sans">model {i + 1}</div>
              <div className="text-[10px] font-medium text-zinc-200 whitespace-nowrap overflow-hidden text-ellipsis leading-tight tracking-tight">{m.short}</div>
              <div className={`text-[9px] mt-0.5 font-sans ${statusColor}`}>{statusText}</div>
            </div>
          );
        })}
      </div>
      {/* Removed Log Console as requested by user */}

    </div>
  );
};

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
    fix: 'API rate limit reached. Wait a minute before sending another message, or SET your own API key.',
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
      <div className={`${c.fix} text-xs border-t ${c.divider} pt-2 mt-2`}>
        <strong>Suggested Fix:</strong> {entry.fix}
      </div>
    </div>
  );
}

// ── CodeCard ─────────────────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  json: 'text-yellow-400',
  typescript: 'text-blue-400',
  javascript: 'text-yellow-300',
  ts: 'text-blue-400',
  js: 'text-yellow-300',
  bash: 'text-green-400',
  sh: 'text-green-400',
  python: 'text-sky-400',
  py: 'text-sky-400',
  go: 'text-cyan-400',
  rust: 'text-orange-400',
  sql: 'text-purple-400',
  html: 'text-red-400',
  css: 'text-pink-400',
};

const CodeCard: React.FC<{ lang: string; code: string; blockKey: string }> = ({ lang, code, blockKey }) => {
  const [copied, setCopied] = React.useState(false);
  const lines = code.split('\n');
  const dotColor = LANG_COLORS[lang.toLowerCase()] ?? 'text-zinc-500';
  const label = lang || 'text';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div key={blockKey} className="my-3 rounded-md border border-zinc-800 overflow-hidden text-[10px] shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className={`${dotColor} text-[8px]`}>●</span>
          <span className="font-mono text-zinc-400 uppercase tracking-widest text-[9px]">{label}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`font-mono text-[9px] uppercase tracking-widest transition-colors ${copied ? 'text-green-400' : 'text-zinc-600 hover:text-zinc-300'
            }`}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      {/* Body: line numbers + code */}
      <div className="flex bg-zinc-950 overflow-x-auto">
        {/* Line numbers */}
        <div className="select-none py-3 px-2 text-right text-zinc-700 border-r border-zinc-800 min-w-[2rem] leading-relaxed">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Code */}
        <pre className="flex-1 p-3 text-zinc-300 font-mono leading-relaxed whitespace-pre break-words overflow-x-auto">
          {code}
        </pre>
      </div>
    </div>
  );
};

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
  if (/cancelled|canceled|499/i.test(text)) {
    return renderErrorCard(GEMINI_ERRORS.CANCELLED, text.replace(/^Error:\s*/i, ''));
  }
  const blocks: React.ReactNode[] = [];
  // Regex: split on fenced code blocks (```lang\n...```)
  const fenceRe = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const renderInline = (content: string, key: string) => {
    if (!content.trim()) return null;

    const lines = content.split('\n');
    const nodes: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        nodes.push(
          <ul key={`ul-${nodes.length}`} className="my-2 space-y-1 ml-4 list-disc marker:text-zinc-600">
            {listItems}
          </ul>
        );
        listItems = [];
      }
    };

    const parseSegments = (text: string) => {
      // Split by **bold** AND [link](url)
      const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
      return parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="text-zinc-200 font-semibold">{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          return (
            <a key={j} href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
              {linkMatch[1]}
            </a>
          );
        }
        return <span key={j}>{part}</span>;
      });
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      // Headers (e.g. "### Title")
      const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        flushList();
        const level = headerMatch[1].length;
        const sizeClass = level === 1 ? 'text-lg' : level === 2 ? 'text-base' : 'text-sm';
        nodes.push(
          <div key={i} className={`font-bold text-zinc-100 mt-4 mb-2 ${sizeClass}`}>
            {parseSegments(headerMatch[2])}
          </div>
        );
        return;
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        listItems.push(
          <li key={i} className="text-zinc-300">
            {parseSegments(trimmed.slice(2))}
          </li>
        );
        return;
      }
      // Normal text lines
      flushList();
      if (trimmed) {
        nodes.push(
          <div key={i} className="mb-1">
            {parseSegments(line)}
          </div>
        );
      } else {
        nodes.push(<div key={i} className="h-2" />);
      }
    });

    flushList();

    return (
      <div key={key} className="leading-relaxed">
        {nodes}
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

    blocks.push(
      <CodeCard key={`code-${match.index}`} lang={lang} code={code} blockKey={`code-${match.index}`} />
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
  const [agentLogs, setAgentLogs] = useState<LogEvent[]>([]);
  // toolStatus: names of tools currently being executed (empty = no tool call in flight)
  const [toolStatus, setToolStatus] = useState<string[]>([]);
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
    setToolStatus([]);

    try {
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      const stream = streamChatResponse([], userMsg);
      let fullResponse = '';
      // Local mirror of toolStatus so we can read current value inside the loop
      // without stale-closure issues (setState is async).
      let activeTools: string[] = [];

      for await (const raw of stream) {
        // Intercept \x00TOOL: control packets — never append to response text
        if (raw.trimEnd().startsWith('\x00TOOL:')) {
          try {
            const payload = JSON.parse(raw.trimEnd().slice('\x00TOOL:'.length));
            activeTools = payload.tools ?? [];
            setToolStatus(activeTools);
          } catch { /* malformed packet — ignore */ }
          continue;
        }

        // Any real text arriving means tools have finished — clear the status chip
        if (activeTools.length > 0) {
          activeTools = [];
          setToolStatus([]);
        }

        fullResponse += raw;
        setMessages(prev => {
          const newHistory = [...prev];
          const lastMsg = newHistory[newHistory.length - 1];
          if (lastMsg.role === 'model') lastMsg.text = fullResponse;
          return newHistory;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
      setToolStatus([]);
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
              {(() => {
                if (msg.role === 'user') return msg.text;
                // 429 Error logic -> Show Routing UI instead of text
                if (msg.text.includes('"error"') && msg.text.includes('429')) {
                  try {
                    const parsed = JSON.parse(msg.text);
                    if (parsed.error && parsed.error.code === 429) {
                      return <RoutingUI />;
                    }
                  } catch { }
                }
                // Show tool-call status chip while the last message is empty
                // and tools are actively running
                const isLastMsg = idx === messages.length - 1;
                if (isLastMsg && isTyping && toolStatus.length > 0 && !msg.text) {
                  return (
                    <div className="flex flex-col gap-2">
                      {toolStatus.map((tool, ti) => (
                        <div key={ti} className="inline-flex items-center gap-2 px-2 py-1 rounded border border-blue-900/60 bg-blue-950/20 text-[10px] text-blue-300 font-mono w-fit">
                          <svg className="w-3 h-3 animate-spin shrink-0" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="4.5" stroke="rgb(59 130 246 / 0.3)" strokeWidth="1.5" />
                            <path d="M6 1.5 A4.5 4.5 0 0 1 10.5 6" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span className="text-zinc-500">calling</span>
                          <span className="text-blue-300">{tool}()</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return <MessageFormatter text={msg.text} />;
              })()}
              {idx === messages.length - 1 && isTyping && agentLogs.length === 0 && <span className="inline-block w-2 h-4 bg-white animate-pulse ml-1 align-middle" />}
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
