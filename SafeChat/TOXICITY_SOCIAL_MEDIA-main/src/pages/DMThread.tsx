import { ShieldAlert, ArrowLeft, Phone, Video, Info as InfoIcon, Mic, MicOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { ApiMessage } from '../types';
import { avatarPlaceholder } from '../lib/placeholders';

export default function DMThread() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, token } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [speechHint, setSpeechHint] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechBaseRef = useRef('');
  const speechFinalRef = useRef('');
  const [otherUser, setOtherUser] = useState<{ id: number; username: string; avatar_url?: string | null } | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as WindowWithSpeechRecognition).SpeechRecognition ||
      (window as WindowWithSpeechRecognition).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      setSpeechHint('Voice input is not supported in this browser. Use latest Chrome or Edge.');
      return;
    }

    setSpeechSupported(true);
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTextChunk = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTextChunk += transcript;
        } else {
          interimText += transcript;
        }
      }
      if (finalTextChunk) {
        speechFinalRef.current = `${speechFinalRef.current} ${finalTextChunk}`.trim();
      }
      const liveText = `${speechFinalRef.current} ${interimText}`.trim();
      const prefix = speechBaseRef.current.trim();
      setInput(prefix ? `${prefix} ${liveText}`.trim() : liveText);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else if (event.error === 'network') {
        setError('Speech service unavailable in this browser session.');
        setSpeechHint('No API key needed. If using Brave, disable Shields for this site or try Chrome/Edge.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Try speaking again.');
      } else {
        setError(`Voice input error: ${event.error}.`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token || !id) {
        return;
      }
      try {
        const other = (await api.getUser(Number(id))) as { id: number; username: string; avatar_url?: string | null };
        const inbox = (await api.inbox(token)) as ApiMessage[];
        const outbox = (await api.outbox(token)) as ApiMessage[];
        const combined = [...inbox, ...outbox].filter((msg) => {
          const otherId = msg.sender.id === user?.id ? msg.receiver.id : msg.sender.id;
          return otherId === Number(id);
        });
        combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        if (mounted) {
          setOtherUser(other);
          setMessages(combined.map((msg) => mapMessage(msg, user?.id || 0)));
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load messages');
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id, token, user?.id]);

  const handleSend = async () => {
    if (!token || !id || !input.trim()) {
      return;
    }
    try {
      setError(null);
      const created = (await api.sendMessage({ receiver_id: Number(id), content: input.trim() }, token)) as ApiMessage;
      setMessages((prev) => [...prev, mapMessage(created, user?.id || 0)]);
      setInput('');
      if (created.is_toxic) {
        setShowWarning(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const toggleVoiceInput = () => {
    if (!speechSupported || !recognitionRef.current) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setError('Voice input requires HTTPS (or localhost).');
      return;
    }
    setError(null);
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const startRecognition = async () => {
      try {
        setSpeechHint(null);
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        }
        speechBaseRef.current = input.trim();
        speechFinalRef.current = '';
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        setError('Unable to access microphone. Please allow permission in browser settings.');
        setSpeechHint('Check browser site permissions for microphone.');
        setIsListening(false);
      }
    };
    void startRecognition();
  };

  return (
    <section className="flex flex-col h-screen relative bg-surface-container-lowest">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-6 h-6" /></button>
          <button
            type="button"
            className="flex items-center gap-3"
            onClick={() => {
              if (otherUser?.username) navigate(`/profile/${otherUser.username}`);
            }}
          >
            <div className="relative">
              <img
                src={otherUser?.avatar_url || avatarPlaceholder(otherUser?.username || 'User')}
                className="w-8 h-8 rounded-full"
                alt={otherUser?.username || 'User'}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-surface-container-lowest rounded-full"></div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm">{otherUser?.username || 'User'}</span>
              <span className="text-[10px] text-outline uppercase tracking-wider font-bold">Active Now</span>
            </div>
          </button>
        </div>
        <div className="flex gap-4">
          <Phone className="w-5 h-5 text-outline cursor-pointer" />
          <Video className="w-5 h-5 text-outline cursor-pointer" />
          <InfoIcon className="w-5 h-5 text-outline cursor-pointer" />
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 hide-scrollbar">
        <div className="text-center py-4">
          <span className="text-[10px] text-outline font-bold uppercase tracking-widest">Wednesday 9:41 AM</span>
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex flex-col",
            msg.sender === 'me' ? "items-end" : "items-start"
          )}>
            <div className="group relative max-w-[85%]">
              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                msg.sender === 'me' 
                  ? "bg-primary-container text-white rounded-br-none" 
                  : "bg-surface-container text-on-surface rounded-bl-none",
                msg.toxicity === 'medium' && "border border-orange-200",
                msg.toxicity === 'high' && "border border-error/30"
              )}>
                {msg.text}
              </div>
              
              {/* Toxicity Icon */}
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2",
                msg.sender === 'me' ? "-left-6" : "-right-6"
              )}>
                <ShieldAlert className={cn(
                  "w-4 h-4",
                  msg.toxicity === 'none' && "text-green-500 opacity-0 group-hover:opacity-100",
                  msg.toxicity === 'low' && "text-green-500",
                  msg.toxicity === 'medium' && "text-orange-500",
                  msg.toxicity === 'high' && "text-error"
                )} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="p-4 bg-surface-container-lowest border-t border-outline-variant">
        <div className="w-full h-1 bg-surface-container-high rounded-full mb-3 overflow-hidden relative">
          <motion.div 
            initial={{ width: '0%' }}
            animate={{ width: '70%' }}
            className="absolute inset-0 bg-gradient-to-r from-green-400 via-orange-400 to-red-500 h-full"
          />
        </div>
        {error && (
          <div className="mb-3 text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {speechHint && (
          <div className="mb-3 text-xs text-on-surface-variant bg-surface-container border border-outline-variant rounded-lg px-3 py-2">
            {speechHint}
          </div>
        )}
        <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant rounded-full px-4 py-2">
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1"
            placeholder="Message..."
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          {speechSupported && (
            <button
              onClick={toggleVoiceInput}
              className={cn(
                "text-sm transition-colors",
                isListening ? "text-error" : "text-outline hover:text-on-surface"
              )}
              title={isListening ? 'Stop voice input' : 'Start voice input'}
              type="button"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <button onClick={handleSend} className="text-primary font-bold text-sm">Send</button>
        </div>
      </footer>

      {/* Warning Overlay */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-surface-container-lowest w-full max-w-[320px] rounded-[16px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-2">
                  <ShieldAlert className="w-8 h-8 text-error" />
                </div>
                <h2 className="text-lg font-bold leading-tight px-2">⚠ This message may contain harmful content. Send anyway?</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">Our safety system flagged your message as potentially toxic. This could violate community guidelines.</p>
              </div>
              <div className="flex flex-col border-t border-outline-variant">
                <button 
                  onClick={() => setShowWarning(false)}
                  className="py-3.5 text-error font-bold text-sm border-b border-outline-variant active:bg-surface-container transition-colors"
                >
                  Send Anyway
                </button>
                <button 
                  onClick={() => setShowWarning(false)}
                  className="py-3.5 text-on-surface font-bold text-sm active:bg-surface-container transition-colors"
                >
                  Edit Message
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

type ThreadMessage = {
  sender: 'me' | 'them';
  text: string;
  time: string;
  toxicity: 'none' | 'low' | 'medium' | 'high';
};

function mapMessage(message: ApiMessage, currentUserId: number): ThreadMessage {
  const toxicity = scoreToLevel(message.toxicity_score || 0);
  return {
    sender: message.sender.id === currentUserId ? 'me' : 'them',
    text: message.content,
    time: new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    toxicity,
  };
}

function scoreToLevel(score: number): ThreadMessage['toxicity'] {
  if (score >= 0.7) {
    return 'high';
  }
  if (score >= 0.4) {
    return 'medium';
  }
  if (score >= 0.2) {
    return 'low';
  }
  return 'none';
}

type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: {
    [index: number]: {
      isFinal: boolean;
      0: {
        transcript: string;
      };
    };
    length: number;
  };
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};
