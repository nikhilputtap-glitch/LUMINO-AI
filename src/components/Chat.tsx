import React, { useState, useEffect, useRef } from 'react';
import MainLayout from './layout/MainLayout';
import { sendMessage } from '../lib/ai';
import { VoiceService } from '../lib/voice';
import { VoiceState, ChatSession } from '../types';
import { personalDataStore } from '../lib/store/PersonalDataStore';
import { MemoryService } from '../lib/memory';
import { authFetch } from '../lib/apiClient';
import { 
  Mic, 
  Square, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Calendar, 
  Sparkles, 
  Check, 
  Clock, 
  Bot, 
  Play, 
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  History,
  Plus,
  Brain,
  Trash2,
  X,
  Copy,
  Code,
  Terminal,
  FileCode,
  Film
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  programDetails?: {
    language?: string;
    code?: string;
    output?: string;
  };
  action?: any;
  suggestedFollowUps?: string[];
  timestamp: string;
}

// 1-Click Copy Code & Output Component
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || 'code').trim().toLowerCase();
  const isOutput = cleanLang === 'output' || cleanLang === 'terminal' || cleanLang === 'console' || cleanLang === 'text' || cleanLang === 'result';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code/output', e);
    }
  };

  return (
    <div className={`my-3.5 rounded-xl overflow-hidden border shadow-lg ${
      isOutput 
        ? 'border-emerald-500/30 bg-neutral-950/95 shadow-emerald-950/20' 
        : 'border-neutral-800 bg-[#0d1117] shadow-black/40'
    }`}>
      {/* Code Header Bar */}
      <div className={`flex items-center justify-between px-3.5 py-2 text-xs border-b ${
        isOutput 
          ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' 
          : 'bg-neutral-900/90 border-neutral-800 text-neutral-300'
      }`}>
        <div className="flex items-center gap-2 font-mono font-semibold tracking-wide">
          {isOutput ? (
            <>
              <Terminal size={14} className="text-emerald-400" />
              <span>EXPECTED OUTPUT</span>
            </>
          ) : (
            <>
              <Code size={14} className="text-indigo-400" />
              <span className="uppercase">{cleanLang}</span>
            </>
          )}
        </div>

        {/* 1-Click Copy Button */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : isOutput
                ? 'bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 border border-emerald-500/30'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 hover:text-white'
          }`}
          title={isOutput ? "Copy expected output to clipboard" : "Copy full program code to clipboard"}
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>{isOutput ? 'Copy Output' : 'Copy Code'}</span>
            </>
          )}
        </button>
      </div>

      {/* Code/Output Body */}
      <div className="p-3.5 overflow-x-auto text-[13px] sm:text-sm font-mono leading-relaxed text-neutral-200">
        <pre className="whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function renderFormattedInline(str: string): React.ReactNode {
  // Parses inline code `...`, bold **...**, italics *...*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code 
          key={index} 
          className="px-1.5 py-0.5 mx-0.5 rounded bg-neutral-800 text-indigo-300 font-mono text-[12px] border border-neutral-700/50"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-neutral-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function TextMarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={i} className="h-1.5" />;
        }

        // Heading 3: ### 
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={i} className="text-base font-bold text-white mt-3 mb-1 flex items-center gap-1.5">
              {renderFormattedInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        // Heading 2: ## 
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className="text-lg font-bold text-white mt-3.5 mb-1.5 border-b border-neutral-800 pb-1">
              {renderFormattedInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }

        // Heading 1: # 
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={i} className="text-xl font-extrabold text-white mt-4 mb-2">
              {renderFormattedInline(trimmed.replace(/^#\s+/, ''))}
            </h2>
          );
        }

        // Bullet point: - or * or •
        if (/^[-*•]\s+/.test(trimmed)) {
          const bulletContent = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={i} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="text-neutral-200">{renderFormattedInline(bulletContent)}</span>
            </div>
          );
        }

        // Numbered list: 1. 2.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-indigo-400 font-semibold shrink-0 text-xs mt-0.5 px-1 rounded bg-indigo-500/10">
                {numMatch[1]}.
              </span>
              <span className="text-neutral-200">{renderFormattedInline(numMatch[2])}</span>
            </div>
          );
        }

        // Normal paragraph line
        return (
          <p key={i} className="text-neutral-200">
            {renderFormattedInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function FormattedMessageContent({ content }: { content: string }) {
  // Extract all code blocks: ```lang\ncode\n```
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  const codeBlockRegex = /```([a-zA-Z0-9_+#.-]*)\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'code',
      content: match[2].trimEnd()
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return (
    <div className="space-y-2 text-sm md:text-[15px] leading-relaxed">
      {parts.map((part, idx) => (
        <div key={idx}>
          {part.type === 'code' ? (
            <CodeBlock code={part.content} language={part.language || 'code'} />
          ) : (
            <TextMarkdownBlock text={part.content} />
          )}
        </div>
      ))}
    </div>
  );
}

function QuickCopyBtn({ text, label, isOutput }: { text: string; label: string; isOutput?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
        copied
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : isOutput
            ? 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30'
            : 'bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30'
      }`}
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-400" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

function CopyMessageButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
      }`}
      title="Copy full response"
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-400" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

interface ActiveCallData {
  status: 'ringing' | 'connected';
  title: string;
  time: string;
  prepSummary?: string;
  duration: number;
}

export default function Chat({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [selectedModel, setSelectedModel] = useState('lumino-6.7omg');
  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ picsRemaining: number; videosRemaining: number } | null>(null);
  
  // Session & Long-Term Memory state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(`session-${Date.now()}`);
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>('New Conversation');
  const [sessionCreatedAt, setSessionCreatedAt] = useState<string>(new Date().toISOString());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedAlert, setSavedAlert] = useState<string | null>(null);

  // Load existing sessions and quota from API on mount
  useEffect(() => {
    authFetch('/api/conversations')
      .then(res => res.json())
      .then(data => {
        if (data.conversations && Array.isArray(data.conversations)) {
          setSessions(data.conversations);
        }
      })
      .catch(() => {});

    authFetch('/api/quota')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.picsRemaining === 'number') {
          setQuota(data);
        }
      })
      .catch(() => {});
  }, []);

  // Call simulation state
  const [activeCall, setActiveCall] = useState<ActiveCallData | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const callTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Clean up call timer on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      VoiceService.stopRingtone();
      VoiceService.stopSpeaking();
    };
  }, []);

  const handleNewChat = () => {
    if (messages.length > 0) {
      const firstUser = messages.find(m => m.role === 'user')?.content || 'Conversation';
      const cleanTitle = currentSessionTitle !== 'New Conversation' 
        ? currentSessionTitle 
        : (firstUser.length > 35 ? firstUser.slice(0, 35) + '...' : firstUser);

      const sessionToArchive: ChatSession = {
        id: currentSessionId,
        title: cleanTitle,
        createdAt: sessionCreatedAt,
        updatedAt: new Date().toISOString(),
        messages: messages
      };

      // Save to memory service and personal context
      MemoryService.saveConversationSession(sessionToArchive);

      // Persist to server
      authFetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionToArchive })
      }).catch(() => {});

      setSessions(prev => {
        const filtered = prev.filter(s => s.id !== sessionToArchive.id);
        return [sessionToArchive, ...filtered];
      });

      setSavedAlert(`Previous chat "${cleanTitle}" saved & indexed into Long-Term Memory! 🧠`);
      setTimeout(() => setSavedAlert(null), 5000);
    }

    setMessages([]);
    const newId = `session-${Date.now()}`;
    setCurrentSessionId(newId);
    setCurrentSessionTitle('New Conversation');
    setSessionCreatedAt(new Date().toISOString());
  };

  const loadSession = (session: ChatSession) => {
    if (messages.length > 0 && currentSessionId !== session.id) {
      const firstUser = messages.find(m => m.role === 'user')?.content || 'Conversation';
      const cleanTitle = currentSessionTitle !== 'New Conversation' 
        ? currentSessionTitle 
        : (firstUser.length > 35 ? firstUser.slice(0, 35) + '...' : firstUser);

      const sessionToArchive: ChatSession = {
        id: currentSessionId,
        title: cleanTitle,
        createdAt: sessionCreatedAt,
        updatedAt: new Date().toISOString(),
        messages: messages
      };
      MemoryService.saveConversationSession(sessionToArchive);
      authFetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionToArchive })
      }).catch(() => {});
    }

    setMessages(session.messages || []);
    setCurrentSessionId(session.id);
    setCurrentSessionTitle(session.title);
    setSessionCreatedAt(session.createdAt);
    setIsHistoryOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    authFetch(`/api/conversations/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    if (currentSessionId === sessionId) {
      setMessages([]);
      setCurrentSessionId(`session-${Date.now()}`);
      setCurrentSessionTitle('New Conversation');
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsgId = `usr-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const data = await sendMessage(
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        selectedModel
      );

      const assistantMsgId = `asst-${Date.now()}`;
      const responseContent = data.message || "I'm here to help!";

      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: responseContent,
        programDetails: data.programDetails || undefined,
        action: data.action || (data.type === 'action' ? data.action : null),
        suggestedFollowUps: data.suggestedFollowUps || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Auto-sync session to memory service so active chat is always saved
      const firstUser = finalMessages.find(m => m.role === 'user')?.content || 'Conversation';
      const cleanTitle = currentSessionTitle !== 'New Conversation' 
        ? currentSessionTitle 
        : (firstUser.length > 35 ? firstUser.slice(0, 35) + '...' : firstUser);

      if (currentSessionTitle === 'New Conversation') {
        setCurrentSessionTitle(cleanTitle);
      }

      const activeSessionObj: ChatSession = {
        id: currentSessionId,
        title: cleanTitle,
        createdAt: sessionCreatedAt,
        updatedAt: new Date().toISOString(),
        messages: finalMessages
      };
      MemoryService.saveConversationSession(activeSessionObj);
      authFetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: activeSessionObj })
      }).catch(() => {});

      // Only speak via voice if user specifically requested voice OR autoVoiceEnabled is ON
      if (data.speakVoice || autoVoiceEnabled) {
        setSpeakingMessageId(assistantMsgId);
        setVoiceState('SPEAKING');
        VoiceService.speak(responseContent, () => {
          setVoiceState('IDLE');
          setSpeakingMessageId(null);
        });
      }

    } catch (error: any) {
      const errorMsgId = `err-${Date.now()}`;
      setMessages([
        ...updatedMessages,
        {
          id: errorMsgId,
          role: 'assistant',
          content: error?.message || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
    setLoading(false);
  };

  const toggleListenMessage = (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      VoiceService.stopSpeaking();
      setSpeakingMessageId(null);
      setVoiceState('IDLE');
      return;
    }

    VoiceService.stopSpeaking();
    setSpeakingMessageId(msgId);
    setVoiceState('SPEAKING');
    VoiceService.speak(text, () => {
      setSpeakingMessageId(null);
      setVoiceState('IDLE');
    });
  };

  const toggleMic = () => {
    if (voiceState === 'SPEAKING') {
      VoiceService.stopSpeaking();
      setSpeakingMessageId(null);
      setVoiceState('IDLE');
      return;
    }
    
    if (voiceState === 'IDLE') {
      setVoiceState('LISTENING');
      VoiceService.startListening((text) => {
        setVoiceState('PROCESSING');
        handleSend(text);
        setVoiceState('IDLE');
      }, () => setVoiceState('ERROR'));
    }
  };

  // Start simulated phone call (e.g. 30-minute reminder call)
  const triggerMeetingCall = (meetingTitle: string, meetingTime: string, prepSummary?: string) => {
    // Stop any active TTS
    VoiceService.stopSpeaking();
    setSpeakingMessageId(null);

    // Play phone ringtone
    VoiceService.playRingtone();

    setActiveCall({
      status: 'ringing',
      title: meetingTitle,
      time: meetingTime,
      prepSummary: prepSummary || 'Review key discussion points and keep your notes ready.',
      duration: 0
    });
  };

  const acceptCall = () => {
    VoiceService.stopRingtone();
    if (!activeCall) return;

    setActiveCall(prev => prev ? { ...prev, status: 'connected', duration: 0 } : null);

    // Start duration ticker
    callTimerRef.current = setInterval(() => {
      setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
    }, 1000);

    // Speak meeting reminder briefing naturally
    const briefingText = `Hey! This is Lumino with your 30-minute reminder call for your meeting: ${activeCall.title}, scheduled at ${activeCall.time}. Here is your quick prep summary: ${activeCall.prepSummary}. Everything is organized. Good luck with your meeting!`;
    
    VoiceService.speak(briefingText, () => {
      // Completed speaking briefing
    });
  };

  const endCall = () => {
    VoiceService.stopRingtone();
    VoiceService.stopSpeaking();
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (activeCall) {
      const callSummaryNote: ChatMessage = {
        id: `call-${Date.now()}`,
        role: 'assistant',
        content: `📞 **30-Minute Briefing Call Completed** for *${activeCall.title}* (${activeCall.time}). All key points were reviewed. You are all set!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: ["Open meeting checklist", "Set post-meeting follow-up task", "Add notes"]
      };
      setMessages(prev => [...prev, callSummaryNote]);
    }

    setActiveCall(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MainLayout onNavigate={onNavigate} currentPage="chat" onNewChat={handleNewChat}>
      <div className="flex flex-col h-full max-w-3xl mx-auto relative">
        {/* Top Session Toolbar */}
        <div className="flex items-center justify-between py-2 px-1 mb-2 border-b border-neutral-800/80 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-neutral-300 truncate max-w-[180px] sm:max-w-xs">
              {currentSessionTitle}
            </span>
            {messages.length > 0 && (
              <span className="text-[11px] text-neutral-500">({messages.length} msgs)</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Daily 4K/8K/16K Quota Pill */}
            <button
              onClick={() => onNavigate('animate-video')}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition cursor-pointer group shadow-sm"
              title="Daily Quota: 10 Pics & 5 Videos in 4K/8K/16K on lumino-6.7omg. Click to open Video Studio"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="font-medium">📸 {quota ? quota.picsRemaining : 10}/10 Pics</span>
              <span className="text-neutral-600">|</span>
              <span className="font-medium">🎬 {quota ? quota.videosRemaining : 5}/5 Videos</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                4K•8K•16K
              </span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition shadow-sm"
              title="Save current chat to Long-Term Memory and start a new conversation"
            >
              <Plus size={14} />
              <span>New Chat</span>
            </button>

            {/* Past Chats / History Drawer Toggle */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl transition"
              title="View past conversations and memories"
            >
              <History size={14} className="text-indigo-400" />
              <span className="hidden sm:inline">Past Chats</span>
              {sessions.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                  {sessions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Saved to Memory Alert Notification */}
        {savedAlert && (
          <div className="mb-3 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs text-indigo-300 flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <span className="flex items-center gap-2 font-medium">
              <Brain size={15} className="text-indigo-400 shrink-0" /> {savedAlert}
            </span>
            <button onClick={() => setSavedAlert(null)} className="p-1 hover:text-white rounded-lg">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Welcome Screen */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center px-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl ring-4 ring-neutral-800">
              <Bot size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">LUMINO</h1>
              <p className="text-lg text-neutral-400 max-w-md mx-auto">
                Your friendly AI Chief of Staff. Chat naturally, manage meetings, and get 30-minute reminder briefing calls.
              </p>
            </div>

            {/* Quick Starter Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-4 text-left">
              <button 
                onClick={() => onNavigate('animate-video')}
                className="p-3.5 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 hover:border-indigo-400 rounded-xl text-sm text-neutral-200 hover:text-white transition flex flex-col gap-1 group shadow-sm"
              >
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Film size={15} className="text-pink-400" /> Animate Images into Video 🎬
                </span>
                <span className="text-xs text-neutral-400">Upload any photo & generate Veo video (16:9 / 9:16)</span>
              </button>

              <button 
                onClick={() => handleSend("Write a Python program to find duplicates in an array, and show the output")}
                className="p-3.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-sm text-neutral-300 hover:text-white transition flex flex-col gap-1 group"
              >
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Code size={15} className="text-indigo-400" /> Program with Output & Copy
                </span>
                <span className="text-xs text-neutral-400">"Write a Python program to find duplicates with output"</span>
              </button>

              <button 
                onClick={() => handleSend("I have a client meeting at 3:00 PM, please save it and call me 30 mins before")}
                className="p-3.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-sm text-neutral-300 hover:text-white transition flex flex-col gap-1 group"
              >
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <PhoneCall size={15} className="text-emerald-400" /> Meeting with 30-min Call
                </span>
                <span className="text-xs text-neutral-400">"I have a meeting at 3:00 PM, call me 30 mins before"</span>
              </button>

              <button 
                onClick={() => handleSend("Explain how transformer attention mechanism works in deep detail")}
                className="p-3.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-sm text-neutral-300 hover:text-white transition flex flex-col gap-1 group"
              >
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles size={15} className="text-amber-400" /> Deep & Comprehensive Answer
                </span>
                <span className="text-xs text-neutral-400">Master-level answers for any massive question</span>
              </button>

              <button 
                onClick={() => handleSend("What did we discuss in our previous chats? Recall from memory")}
                className="p-3.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-sm text-neutral-300 hover:text-white transition flex flex-col gap-1 group"
              >
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Brain size={15} className="text-purple-400" /> Long-Term Memory Recall
                </span>
                <span className="text-xs text-neutral-400">"What did we discuss in previous chats?"</span>
              </button>
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="flex-1 overflow-y-auto mb-4 space-y-5 px-1 py-2">
            {messages.map((m, index) => {
              const isAssistant = m.role === 'assistant';
              const isLastMessage = index === messages.length - 1;

              return (
                <div key={m.id} className="space-y-3">
                  <div className={`flex gap-3 ${isAssistant ? 'items-start' : 'justify-end'}`}>
                    {isAssistant && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                        <Bot size={18} />
                      </div>
                    )}

                    <div className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[78%] leading-relaxed ${
                      isAssistant 
                        ? 'bg-neutral-900 border border-neutral-800/90 text-neutral-100 shadow-sm' 
                        : 'bg-neutral-800 text-white ml-auto border border-neutral-700/60'
                    }`}>
                      {/* Formatted Message Content with Markdown & 1-Click Copy Code / Output Blocks */}
                      <div className="text-sm md:text-[15px]">
                        <FormattedMessageContent content={m.content} />
                      </div>

                      {/* Dedicated Quick-Copy Bar if structured programDetails are provided */}
                      {m.programDetails && (m.programDetails.code || m.programDetails.output) && (
                        <div className="mt-3 p-3 bg-neutral-950/80 rounded-xl border border-indigo-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                            <Code size={13} className="text-indigo-400" />
                            Program & Output Quick Actions ({m.programDetails.language || 'Code'})
                          </span>
                          <div className="flex items-center gap-2">
                            {m.programDetails.code && (
                              <QuickCopyBtn text={m.programDetails.code} label="Copy Program" />
                            )}
                            {m.programDetails.output && (
                              <QuickCopyBtn text={m.programDetails.output} label="Copy Output" isOutput />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Assistant Actions Bar: Listen/Speak Button, Copy Full Response, & Timestamp */}
                      {isAssistant && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800 text-xs text-neutral-400">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleListenMessage(m.id, m.content)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition font-medium ${
                                speakingMessageId === m.id
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300'
                              }`}
                            >
                              {speakingMessageId === m.id ? (
                                <>
                                  <Square size={12} className="fill-current" />
                                  <span>Stop Reading</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 size={13} />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>

                            <CopyMessageButton content={m.content} />
                          </div>
                          <span>{m.timestamp}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive Action Card (Meeting with 30-min Reminder Call / Reminder) */}
                  {m.action && (
                    <div className="ml-11 p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 shadow-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Calendar size={16} className="text-indigo-400" />
                          <span>{m.action.title || 'Scheduled Event'}</span>
                        </div>
                        <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Clock size={11} /> {m.action.scheduledAt || 'Upcoming'}
                        </span>
                      </div>

                      {m.action.description && (
                        <p className="text-xs text-neutral-400">{m.action.description}</p>
                      )}

                      {/* Prep Summary */}
                      {m.action.prepSummary && (
                        <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80 text-xs space-y-1">
                          <span className="font-semibold text-neutral-300 block">📋 Lumino Pre-Meeting Prep:</span>
                          <p className="text-neutral-400 whitespace-pre-wrap">{m.action.prepSummary}</p>
                        </div>
                      )}

                      {/* 30-Minute Reminder Call Section */}
                      <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <PhoneCall size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-emerald-400 block">
                              30-Minute Reminder Call Armed
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              Lumino will call your phone with a voice briefing 30 mins before.
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => triggerMeetingCall(
                            m.action.title || 'Upcoming Meeting', 
                            m.action.scheduledAt || 'In 30 mins',
                            m.action.prepSummary
                          )}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition whitespace-nowrap"
                        >
                          <Phone size={13} />
                          <span>Simulate Call Now</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-Up Chips (Guessing what the user might ask next) */}
                  {isLastMessage && m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && !loading && (
                    <div className="ml-11 pt-1 flex flex-wrap gap-2">
                      {m.suggestedFollowUps.map((chip, chipIdx) => (
                        <button
                          key={chipIdx}
                          onClick={() => handleSend(chip)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition shadow-sm group"
                        >
                          <Sparkles size={12} className="text-indigo-400 group-hover:text-indigo-300" />
                          <span>{chip}</span>
                          <ChevronRight size={12} className="text-neutral-500 group-hover:text-neutral-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 items-center text-neutral-400 text-sm">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot size={18} className="animate-pulse" />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs text-neutral-400 ml-1">Lumino is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Bottom Input & Control Bar */}
        <div className="p-2 bg-neutral-900/95 backdrop-blur border border-neutral-800 rounded-2xl flex flex-col gap-2 shadow-2xl">
          <div className="flex items-center gap-2">
            {/* Mic Button */}
            <button 
              onClick={toggleMic} 
              className={`p-2.5 rounded-xl transition ${
                voiceState === 'LISTENING' 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : voiceState === 'SPEAKING'
                  ? 'bg-emerald-500 text-white'
                  : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title={voiceState === 'SPEAKING' ? 'Stop Speaking' : 'Hold to Speak (STT)'}
            >
              {voiceState === 'SPEAKING' ? <Square size={18} /> : <Mic size={18} />}
            </button>

            {/* Auto-Voice Output Toggle */}
            <button
              onClick={() => {
                const nextState = !autoVoiceEnabled;
                setAutoVoiceEnabled(nextState);
                if (!nextState) {
                  VoiceService.stopSpeaking();
                  setSpeakingMessageId(null);
                }
              }}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                autoVoiceEnabled
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title={autoVoiceEnabled ? "Auto-Voice Output: ON (Plays reply audio automatically)" : "Auto-Voice Output: OFF (Silent text, click Listen anytime)"}
            >
              {autoVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="hidden sm:inline text-[11px]">{autoVoiceEnabled ? 'Voice: On' : 'Voice: Off'}</span>
            </button>

            {/* Model Selector */}
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-neutral-800 p-2 rounded-xl text-xs text-neutral-300 outline-none border border-neutral-700/60 cursor-pointer"
            >
              <option value="lumino-6.7omg">lumino-6.7omg (Flagship 4K/8K/16K)</option>
              <option value="lumino-pro">lumino-pro (Deep Reasoning)</option>
              <option value="lumino-6.4">lumino-6.4 (Fast & Agile)</option>
            </select>

            {/* Chat Input */}
            <input 
              className="flex-1 bg-transparent p-2 outline-none text-sm text-white placeholder-neutral-500" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)} 
              placeholder="Ask Lumino anything... (e.g., 'I have a meeting at 3 PM, remind me with a call 30 mins before')" 
            />

            {/* Send Button */}
            <button 
              onClick={() => handleSend(input)} 
              disabled={loading || !input.trim()} 
              className="bg-white text-neutral-950 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 shadow-md"
            >
              Send
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE PHONE CALL OVERLAY (SIMULATED REAL CALL FROM LUMINO) */}
        {/* ========================================================================= */}
        {activeCall && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

              {/* Status Header */}
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  {activeCall.status === 'ringing' ? 'Incoming Lumino Call' : 'Call Connected'}
                </span>
                <p className="text-xs text-neutral-400">
                  {activeCall.status === 'ringing' ? '30-Minute Pre-Meeting Briefing' : `In Call • ${formatDuration(activeCall.duration)}`}
                </p>
              </div>

              {/* Calling Avatar with Animated Soundwave Rings */}
              <div className="relative flex items-center justify-center py-4">
                {activeCall.status === 'ringing' && (
                  <>
                    <div className="absolute w-32 h-32 rounded-full bg-emerald-500/20 animate-ping pointer-events-none"></div>
                    <div className="absolute w-28 h-28 rounded-full bg-emerald-500/10 pointer-events-none"></div>
                  </>
                )}
                {activeCall.status === 'connected' && (
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                )}
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl ring-4 ring-neutral-800 z-10">
                  <Bot size={44} />
                </div>
              </div>

              {/* Meeting Info */}
              <div>
                <h3 className="text-xl font-bold text-white">{activeCall.title}</h3>
                <p className="text-sm text-neutral-400 mt-1 flex items-center justify-center gap-1">
                  <Clock size={14} className="text-neutral-500" /> {activeCall.time}
                </p>
              </div>

              {/* In-Call Briefing Text or Visualizer */}
              {activeCall.status === 'connected' ? (
                <div className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <Volume2 size={14} /> Lumino Briefing Voice
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-3 bg-emerald-500 animate-pulse rounded-full"></span>
                      <span className="w-1 h-5 bg-emerald-400 animate-pulse [animation-delay:0.15s] rounded-full"></span>
                      <span className="w-1 h-4 bg-emerald-500 animate-pulse [animation-delay:0.3s] rounded-full"></span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed max-h-24 overflow-y-auto">
                    "{activeCall.prepSummary}"
                  </p>
                </div>
              ) : (
                <div className="text-xs text-neutral-400 bg-neutral-900/60 px-4 py-2 rounded-xl border border-neutral-800">
                  Ring... Ring... 30-min briefing ready for your meeting.
                </div>
              )}

              {/* Call Control Buttons */}
              <div className="w-full pt-4 flex items-center justify-around">
                {activeCall.status === 'ringing' ? (
                  <>
                    {/* Decline Call */}
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={endCall}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition transform hover:scale-105"
                      >
                        <PhoneOff size={26} />
                      </button>
                      <span className="text-xs text-neutral-400">Decline</span>
                    </div>

                    {/* Accept Call */}
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={acceptCall}
                        className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 transition transform hover:scale-110 animate-bounce"
                      >
                        <Phone size={28} />
                      </button>
                      <span className="text-xs text-emerald-400 font-semibold">Answer</span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* In-Call Controls */}
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-3.5 rounded-full transition ${isMuted ? 'bg-neutral-800 text-red-400' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <Mic size={20} className="line-through" /> : <Mic size={20} />}
                    </button>

                    {/* End Call Button */}
                    <button
                      onClick={endCall}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition transform hover:scale-105"
                      title="End Call"
                    >
                      <PhoneOff size={26} />
                    </button>

                    <button
                      onClick={() => {
                        VoiceService.speak(`Here is a quick recap: ${activeCall.prepSummary}`);
                      }}
                      className="p-3.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                      title="Replay Briefing"
                    >
                      <Volume2 size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAST CHATS & LONG-TERM MEMORY DRAWER */}
        {/* ========================================================================= */}
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200" onClick={() => setIsHistoryOpen(false)}>
            <div 
              className="w-full max-w-md bg-neutral-950 border-l border-neutral-800 h-full p-6 shadow-2xl flex flex-col space-y-5 overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <History size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Past Conversations</h3>
                    <p className="text-[11px] text-neutral-400">
                      Indexed into Lumino's Long-Term Memory
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Memory Info Pill */}
              <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
                <Brain size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Lumino remembers facts, meetings, and key discussions across all chats. In any new chat, ask <span className="font-semibold text-white">"What did we talk about earlier?"</span> and Lumino will recall it! 🧠
                </p>
              </div>

              {/* Start New Chat Action inside Drawer */}
              <button
                onClick={() => {
                  handleNewChat();
                  setIsHistoryOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
              >
                <Plus size={15} />
                <span>Start New Conversation</span>
              </button>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {sessions.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-xs space-y-2">
                    <MessageSquare size={32} className="mx-auto text-neutral-700" />
                    <p>No archived conversations yet.</p>
                    <p className="text-neutral-600">Start chatting and click "New Chat" to archive your sessions to memory.</p>
                  </div>
                ) : (
                  sessions.map((s) => {
                    const isCurrent = s.id === currentSessionId;
                    const previewText = s.messages && s.messages.length > 0
                      ? s.messages[0].content
                      : 'No messages';

                    return (
                      <div
                        key={s.id}
                        onClick={() => loadSession(s)}
                        className={`p-4 rounded-2xl border transition text-left cursor-pointer space-y-2 group ${
                          isCurrent
                            ? 'bg-neutral-900 border-indigo-500/40 shadow-sm ring-1 ring-indigo-500/20'
                            : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-white text-xs truncate max-w-[240px]">
                            {s.title}
                          </h4>
                          <button
                            onClick={(e) => deleteSession(e, s.id)}
                            className="text-neutral-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition rounded"
                            title="Delete Chat"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                          "{previewText}"
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                          <span>{new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="flex items-center gap-1 font-medium text-neutral-400">
                            {s.messages?.length || 0} messages {isCurrent && '• Active'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
