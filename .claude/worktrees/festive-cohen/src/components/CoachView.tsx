import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Send, Bot, Mic, Sparkles, ChevronLeft, Clock, Search, X, MessageCircle,
    Zap, Flame, Mountain, Wind, Home, TrendingUp, Compass
} from 'lucide-react';
import { chatWithCoach, chatWithCoachPillar } from '../utils/aiService';
import type { CoachPillarKey } from '../utils/aiService';
import type { UserProfile, ChatMessage, CoachSession, CoachPillar } from '../types';
import { canUseAI } from '../types';
import { haptics } from '../utils/haptics';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useTheme } from '../contexts/ThemeContext';
import { analyzeBehaviorPatterns } from '../utils/practiceUtils';

// ── Speech recognition type ──────────────────────────────────────────────────
interface SpeechRecognitionInstance {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
}

interface CoachViewProps {
    user: UserProfile;
    onBack?: () => void;
    onNavigate?: (tab: string) => void;
}

// ── Pillar config ─────────────────────────────────────────────────────────────
type PillarConfig = {
    key: CoachPillar;
    label: string;
    hint: string;
    icon: React.ReactNode;
    bg: (isDark: boolean) => string;
    border: (isDark: boolean) => string;
    iconBg: (isDark: boolean) => string;
    glowColor: string;
    greeting: string;
};

const PILLAR_CONFIGS: PillarConfig[] = [
    {
        key: 'anxiety',
        label: 'Anxiety',
        hint: 'Ground yourself & find calm',
        icon: <Wind size={22} />,
        bg: (d) => d ? 'rgba(121,134,203,0.12)' : '#E8EAF3',
        border: (d) => d ? 'rgba(121,134,203,0.25)' : '#9FA8DA',
        iconBg: (d) => d ? 'rgba(121,134,203,0.2)' : 'rgba(121,134,203,0.18)',
        glowColor: '#7986CB',
        greeting: "I'm here with you. Take a breath — let's slow down together. What's weighing on you right now?",
    },
    {
        key: 'focus',
        label: 'Focus',
        hint: 'Lock in & cut the noise',
        icon: <Zap size={22} />,
        bg: (d) => d ? 'rgba(212,168,83,0.1)' : '#FFF8E7',
        border: (d) => d ? 'rgba(212,168,83,0.25)' : '#FFD580',
        iconBg: (d) => d ? 'rgba(212,168,83,0.2)' : 'rgba(212,168,83,0.18)',
        glowColor: '#D4A853',
        greeting: "Let's sharpen that focus. What's the one thing you need to nail right now — and what's getting in the way?",
    },
    {
        key: 'motivation',
        label: 'Motivation',
        hint: 'Reignite your drive',
        icon: <Flame size={22} />,
        bg: (d) => d ? 'rgba(201,106,58,0.1)' : '#FBF0EA',
        border: (d) => d ? 'rgba(201,106,58,0.25)' : '#E08A5A',
        iconBg: (d) => d ? 'rgba(201,106,58,0.2)' : 'rgba(201,106,58,0.18)',
        glowColor: '#C96A3A',
        greeting: "The drive will come back — I promise. But first, tell me: when did you last feel truly fired up? What was different then?",
    },
    {
        key: 'setbacks',
        label: 'Setbacks',
        hint: 'Rise through the friction',
        icon: <Mountain size={22} />,
        bg: (d) => d ? 'rgba(78,92,76,0.12)' : '#EBF0EB',
        border: (d) => d ? 'rgba(78,92,76,0.3)' : '#7A9178',
        iconBg: (d) => d ? 'rgba(78,92,76,0.2)' : 'rgba(78,92,76,0.15)',
        glowColor: '#4E5C4C',
        greeting: "I'm glad you came here. Whatever happened — it doesn't define you. Tell me what's going on. I'm listening.",
    },
];

// ── Session helpers ───────────────────────────────────────────────────────────

const loadSessions = (): CoachSession[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.COACH_SESSIONS);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveSessions = (sessions: CoachSession[]) => {
    // Keep latest 100 sessions
    const trimmed = sessions.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.COACH_SESSIONS, JSON.stringify(trimmed));
};

const autoTitle = (firstUserMessage: string): string => {
    const clean = firstUserMessage.trim();
    if (clean.length <= 40) return clean;
    return clean.substring(0, 38) + '…';
};

const pillarLabel = (pillar: CoachPillar): string =>
    pillar === 'open' ? 'Open' : PILLAR_CONFIGS.find(p => p.key === pillar)?.label ?? 'Chat';

const pillarIcon = (pillar: CoachPillar, size = 16): React.ReactNode => {
    switch (pillar) {
        case 'anxiety':    return <Wind size={size} />;
        case 'focus':      return <Zap size={size} />;
        case 'motivation': return <Flame size={size} />;
        case 'setbacks':   return <Mountain size={size} />;
        default:           return <MessageCircle size={size} />;
    }
};

const formatDate = (ms: number): string => {
    const d = new Date(ms);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - ms) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── Component ─────────────────────────────────────────────────────────────────

export const CoachView: React.FC<Omit<CoachViewProps, 'isDarkMode'>> = ({ user, onBack, onNavigate }) => {
    const { isDarkMode } = useTheme();
    // View state
    type ViewMode = 'home' | 'chat' | 'history';
    const [view, setView] = useState<ViewMode>('home');

    // Session state
    const [sessions, setSessions] = useState<CoachSession[]>(() => loadSessions());
    const [activeSession, setActiveSession] = useState<CoachSession | null>(null);
    const [historySearch, setHistorySearch] = useState('');

    // Chat state
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Viewport
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [viewportTop, setViewportTop] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<{ stop: () => void } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Viewport handling ──────────────────────────────────────────────────────
    useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                setViewportHeight(window.visualViewport.height);
                setViewportTop(window.visualViewport.offsetTop);
            } else {
                setViewportHeight(window.innerHeight);
                setViewportTop(0);
            }
        };
        window.visualViewport?.addEventListener('resize', handleResize);
        window.visualViewport?.addEventListener('scroll', handleResize);
        window.addEventListener('resize', handleResize);
        handleResize();
        document.body.style.overflow = 'hidden';
        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('scroll', handleResize);
            window.removeEventListener('resize', handleResize);
            document.body.style.overflow = '';
        };
    }, []);

    // ── Auto-scroll ────────────────────────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, []);

    useEffect(() => {
        if (view === 'chat') {
            const t = setTimeout(scrollToBottom, 100);
            return () => clearTimeout(t);
        }
    }, [activeSession?.messages, isTyping, viewportHeight, view, scrollToBottom]);

    // ── Session persistence ────────────────────────────────────────────────────
    const persistSessions = useCallback((updated: CoachSession[]) => {
        setSessions(updated);
        saveSessions(updated);
    }, []);

    const upsertSession = useCallback((session: CoachSession) => {
        setSessions(prev => {
            const idx = prev.findIndex(s => s.id === session.id);
            let next: CoachSession[];
            if (idx >= 0) {
                next = [...prev];
                next[idx] = session;
            } else {
                next = [session, ...prev];
            }
            saveSessions(next);
            return next;
        });
    }, []);

    const deleteSession = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.light();
        setSessions(prev => {
            const next = prev.filter(s => s.id !== id);
            saveSessions(next);
            return next;
        });
        // If we're deleting the active session, go home
        if (activeSession?.id === id) {
            setActiveSession(null);
            setView('home');
        }
    }, [activeSession]);

    // ── Start a new pillar session ─────────────────────────────────────────────
    const startPillarSession = useCallback((pillar: CoachPillar) => {
        haptics.medium();
        const config = PILLAR_CONFIGS.find(p => p.key === pillar);
        const greeting = config?.greeting ?? "What's on your mind?";
        const firstName = user.name ? user.name.split(' ')[0] : 'Friend';

        const greetingMsg: ChatMessage = {
            id: 'init-' + Date.now(),
            role: 'assistant',
            text: `Hey ${firstName}. ${greeting}`,
            timestamp: Date.now(),
        };

        const newSession: CoachSession = {
            id: Date.now().toString(),
            pillar,
            title: pillarLabel(pillar),
            messages: [greetingMsg],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 0,
        };

        upsertSession(newSession);
        setActiveSession(newSession);
        setView('chat');
    }, [user.name, upsertSession]);

    // ── Resume an existing session ─────────────────────────────────────────────
    const resumeSession = useCallback((session: CoachSession) => {
        haptics.light();
        setActiveSession(session);
        setView('chat');
    }, []);

    // ── Handle send ────────────────────────────────────────────────────────────
    const buildContext = () => ({
        name: user.name,
        quoteIntensity: user.quoteIntensity,
        energyLevel: user.currentEnergy,
        currentStreak: user.streak || 0,
        completedGoals: user.dailyFocuses?.filter(f => f.isCompleted).length || 0,
        totalGoals: user.dailyFocuses?.length || 0,
        profession: user.profession,
        detectedPatterns: analyzeBehaviorPatterns(user),
        recentJournalEntries: user.journalEntries?.slice(-3).map(e => ({
            date: e.date,
            highlight: e.highlight,
            lowlight: e.lowlight,
        })),
        recentReflections: user.meditationReflections?.slice(-3).map(r => ({
            date: r.date,
            intention: r.intention,
            reflection: r.reflection,
        })),
        energyTrends: user.energyHistory?.slice(-10),
    });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeSession) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: inputText,
            timestamp: Date.now(),
            role: 'user',
        };

        // Auto-title: use first real user message text
        const isFirstUserMsg = activeSession.messages.filter(m => m.role === 'user').length === 0;
        const updatedTitle = isFirstUserMsg ? autoTitle(inputText) : activeSession.title;

        const updatedSession: CoachSession = {
            ...activeSession,
            title: updatedTitle,
            messages: [...activeSession.messages, userMsg],
            updatedAt: Date.now(),
            messageCount: activeSession.messageCount + 1,
        };

        setActiveSession(updatedSession);
        upsertSession(updatedSession);
        setInputText('');
        setIsTyping(true);
        haptics.light();

        const context = buildContext();
        const pillar = activeSession.pillar as CoachPillarKey;

        try {
            // Use pillar-specific function for non-open sessions
            const responseText = pillar === 'open'
                ? await chatWithCoach(userMsg.text, updatedSession.messages, context)
                : await chatWithCoachPillar(userMsg.text, updatedSession.messages, context, pillar);

            const coachMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                timestamp: Date.now(),
                role: 'assistant',
            };

            const finalSession: CoachSession = {
                ...updatedSession,
                messages: [...updatedSession.messages, coachMsg],
                updatedAt: Date.now(),
            };

            setActiveSession(finalSession);
            upsertSession(finalSession);
            haptics.medium();
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    // ── Dictation ──────────────────────────────────────────────────────────────
    const startDictation = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }
        const SpeechRecognitionCtor =
            (window as Record<string, unknown>).SpeechRecognition ||
            (window as Record<string, unknown>).webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }
        const recognition = new (SpeechRecognitionCtor as new () => SpeechRecognitionInstance)();
        recognitionRef.current = recognition as { stop: () => void };
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onstart = () => { setIsListening(true); haptics.light(); };
        recognition.onresult = (event: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => {
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
            }
            if (final) setInputText(prev => prev + final);
        };
        recognition.onerror = (event: { error: string }) => { console.error(event.error); setIsListening(false); };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    // ── History filter ─────────────────────────────────────────────────────────
    const filteredSessions = sessions.filter(s => {
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        return (
            s.title.toLowerCase().includes(q) ||
            s.pillar.toLowerCase().includes(q)
        );
    });

    // ── Styles ─────────────────────────────────────────────────────────────────
    const bg = isDarkMode ? '#3D4A3A' : 'white';
    const text = isDarkMode ? 'text-white' : 'text-[#4A5D4E]';
    const subText = isDarkMode ? 'text-white/40' : 'text-[#4A5D4E]/40';
    const cardBg = isDarkMode ? 'rgba(255,255,255,0.04)' : 'white';
    const borderColor = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(78,92,76,0.1)';

    // ── Gate ───────────────────────────────────────────────────────────────────
    if (!canUseAI(user)) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6 ${text}`}>
                <div className={`p-8 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-[#4A5D4E]/10'}`}>
                    <Bot size={48} className="opacity-20" />
                </div>
                <h2 className="text-2xl font-display font-medium">Coming Soon</h2>
                <p className="text-sm opacity-60 max-w-xs">Your AI Coach is currently calibrating for your journey.</p>
            </div>
        );
    }

    // ── Common outer shell ─────────────────────────────────────────────────────
    return (
        <div
            className={`fixed inset-0 z-[200] flex flex-col font-sans overflow-hidden`}
            style={{
                background: bg,
                color: isDarkMode ? 'white' : '#4A5D4E',
                height: `${viewportHeight}px`,
                top: `${viewportTop}px`,
                left: 0,
                right: 0,
                position: 'fixed',
            }}
        >
            {/* Ambient aura */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-[#E2CF9F]' : 'bg-[#4A5D4E]'}`} />
                <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-10 ${isDarkMode ? 'bg-[#4A5D4E]' : 'bg-[#E2CF9F]'}`} />
            </div>

            {/* ── HOME VIEW ──────────────────────────────────────────────── */}
            {view === 'home' && (
                <>
                    {/* Header */}
                    <header className="relative z-20 px-8 pt-16 pb-4">
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={onBack}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-[#4A5D4E]/5 hover:bg-[#4A5D4E]/10'}`}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                {/* History button */}
                                <button
                                    onClick={() => { haptics.light(); setView('history'); }}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-[#4A5D4E]/5 hover:bg-[#4A5D4E]/10'}`}
                                    aria-label="Session history"
                                >
                                    <Clock size={17} />
                                </button>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'bg-white/5 text-[#E2CF9F] border border-white/5' : 'bg-[#4A5D4E]/5 text-[#4A5D4E] border border-[#4A5D4E]/5'}`}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Live
                                </div>
                            </div>
                        </div>
                        <h2 className="text-4xl font-display font-bold tracking-tight">
                            {user.coachName ? (user.coachName.includes('Coach') ? user.coachName : `Coach ${user.coachName}`) : 'Palante Coach'}
                        </h2>
                        <p className={`text-base font-display italic mt-1 ${subText}`}>
                            Guidance for your journey.
                        </p>
                    </header>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto px-5 py-2 relative z-10 space-y-3" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '7rem' }}>

                        {/* Section label */}
                        <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] px-1 pt-2 ${subText}`}>
                            Choose your focus
                        </p>

                        {/* Pillar grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {PILLAR_CONFIGS.map((pillar) => (
                                <button
                                    key={pillar.key}
                                    onClick={() => startPillarSession(pillar.key)}
                                    className="relative overflow-hidden rounded-[22px] p-5 text-left transition-all duration-200 active:scale-95 hover:scale-[1.02]"
                                    style={{
                                        background: pillar.bg(isDarkMode),
                                        border: `1.5px solid ${pillar.border(isDarkMode)}`,
                                    }}
                                >
                                    {/* Glow orb */}
                                    <div
                                        className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-25 blur-xl pointer-events-none"
                                        style={{ background: pillar.glowColor }}
                                    />
                                    {/* Icon */}
                                    <div
                                        className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-3 relative z-10"
                                        style={{ background: pillar.iconBg(isDarkMode), color: pillar.glowColor }}
                                    >
                                        {pillar.icon}
                                    </div>
                                    <div className="relative z-10">
                                        <p className="font-display font-bold text-[15px] tracking-tight leading-tight">
                                            {pillar.label}
                                        </p>
                                        <p className={`text-[11px] mt-0.5 leading-snug ${subText}`}>
                                            {pillar.hint}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px" style={{ background: borderColor }} />
                            <span className={`text-[10px] font-medium uppercase tracking-[0.14em] ${subText}`}>
                                or talk freely
                            </span>
                            <div className="flex-1 h-px" style={{ background: borderColor }} />
                        </div>

                        {/* Open Conversation button */}
                        <button
                            onClick={() => startPillarSession('open')}
                            className="w-full flex items-center gap-4 px-5 py-4 rounded-[22px] transition-all duration-200 active:scale-[0.98] hover:opacity-90"
                            style={{
                                background: 'linear-gradient(135deg, #E3A33F, #A06421)',
                                boxShadow: '0 4px 20px rgba(227,163,63,0.3)',
                            }}
                        >
                            <div className="w-10 h-10 rounded-[13px] bg-white/20 flex items-center justify-center flex-shrink-0">
                                <MessageCircle size={18} className="text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-display font-semibold text-[14px] text-white leading-tight">
                                    Open Conversation
                                </p>
                                <p className="text-[11px] text-white/50 mt-0.5">
                                    Anything on your mind — let's talk
                                </p>
                            </div>
                            <span className="text-white/30 text-lg">›</span>
                        </button>

                        {/* Recent sessions preview (if any) */}
                        {sessions.length > 0 && (
                            <>
                                <div className="flex items-center justify-between pt-2 px-1">
                                    <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${subText}`}>
                                        Recent sessions
                                    </p>
                                    <button
                                        onClick={() => setView('history')}
                                        className={`text-[11px] font-medium ${isDarkMode ? 'text-[#E2CF9F]/70' : 'text-[#C96A3A]/80'}`}
                                    >
                                        See all →
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {sessions.slice(0, 3).map(s => {
                                        const conf = PILLAR_CONFIGS.find(p => p.key === s.pillar);
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => resumeSession(s)}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all active:scale-[0.98]"
                                                style={{
                                                    background: cardBg,
                                                    border: `1px solid ${borderColor}`,
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                                }}
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                                    style={{ background: conf ? conf.bg(isDarkMode) : 'rgba(160,160,160,0.1)', color: conf?.glowColor ?? '#888' }}
                                                >
                                                    {pillarIcon(s.pillar, 15)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-display font-semibold text-[13px] truncate">{s.title}</p>
                                                    <p className={`text-[11px] ${subText}`}>
                                                        {pillarLabel(s.pillar)} · {formatDate(s.updatedAt)} · {s.messages.filter(m => m.role === 'user').length} msgs
                                                    </p>
                                                </div>
                                                <ChevronLeft size={14} className={`rotate-180 flex-shrink-0 ${subText}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        <div className="h-8" />
                    </div>
                </>
            )}

            {/* ── CHAT VIEW ──────────────────────────────────────────────── */}
            {view === 'chat' && activeSession && (
                <>
                    {/* Chat Header */}
                    <header className="relative z-20 px-6 pt-14 pb-4">
                        <div className="flex items-center justify-between mb-5">
                            <button
                                onClick={() => { setView('home'); }}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-[#4A5D4E]/5 hover:bg-[#4A5D4E]/10'}`}
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="flex items-center gap-2">
                                {/* Pillar badge */}
                                {activeSession.pillar !== 'open' && (
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'bg-white/5 text-white/60' : 'bg-[#4A5D4E]/5 text-[#4A5D4E]/60'}`}>
                                        {pillarIcon(activeSession.pillar, 11)}
                                        {pillarLabel(activeSession.pillar)}
                                    </div>
                                )}
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'bg-white/5 text-[#E2CF9F] border border-white/5' : 'bg-[#4A5D4E]/5 text-[#4A5D4E] border border-[#4A5D4E]/5'}`}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Live
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl font-display font-bold tracking-tight">
                                {user.coachName ? (user.coachName.includes('Coach') ? user.coachName : `Coach ${user.coachName}`) : 'Palante Coach'}
                            </h2>
                            <p className={`text-sm font-display italic mt-0.5 ${subText}`}>
                                {activeSession.pillar === 'open' ? 'Here for whatever you need.' : `${pillarLabel(activeSession.pillar)} session`}
                            </p>
                        </div>
                    </header>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-2 space-y-8 relative z-10 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '8rem' }}>
                        {activeSession.messages.map((msg: ChatMessage) => (
                            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mb-2 opacity-30 text-[10px] uppercase tracking-widest font-bold ml-1">
                                        <Sparkles size={10} />
                                        {user.coachName || 'Coach'}
                                    </div>
                                )}
                                <div className={`
                                    max-w-[90%] text-lg leading-relaxed font-body
                                    ${msg.role === 'user'
                                        ? `px-5 py-4 rounded-[2rem] shadow-lg ${isDarkMode ? 'bg-[#E2CF9F] text-[#3A453C] font-medium' : 'bg-[#4A5D4E] text-white font-medium'}`
                                        : `${isDarkMode ? 'text-white/90' : 'text-[#4A5D4E]'}`
                                    }
                                `}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex flex-col items-start">
                                <div className="flex items-center gap-2 mb-2 opacity-30 text-[10px] uppercase tracking-widest font-bold ml-1">
                                    Thinking...
                                </div>
                                <div className="flex gap-2 p-2">
                                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#E2CF9F]' : 'bg-[#4A5D4E]'} animate-ping opacity-40`} />
                                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#E2CF9F]' : 'bg-[#4A5D4E]'} animate-ping opacity-20`} style={{ animationDelay: '0.15s' }} />
                                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#E2CF9F]' : 'bg-[#4A5D4E]'} animate-ping opacity-10`} style={{ animationDelay: '0.3s' }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-16" />
                    </div>

                    {/* Input */}
                    <div className="relative z-30 px-4 pb-28 pt-3">
                        <form onSubmit={handleSend} className="relative max-w-2xl mx-auto">
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-[3rem] border transition-all duration-300
                                ${isDarkMode
                                    ? 'bg-[#1a1c1a]/60 border-white/5 focus-within:border-[#E2CF9F]/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)]'
                                    : 'bg-white/90 border-[#4A5D4E]/10 focus-within:border-[#4A5D4E]/25 shadow-xl backdrop-blur-xl'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={startDictation}
                                    className={`p-2 rounded-full transition-all ${isListening ? 'text-red-400 scale-125' : 'opacity-30 hover:opacity-80 hover:scale-110'}`}
                                >
                                    <Mic size={14} />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onFocus={scrollToBottom}
                                    placeholder="Speak your truth..."
                                    className="flex-1 bg-transparent py-2 outline-none text-[16px] md:text-lg font-body placeholder:opacity-20"
                                    style={{ fontSize: '16px' /* prevent iOS zoom */ }}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isTyping}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300
                                        ${!inputText.trim() || isTyping
                                            ? 'opacity-0 scale-50 rotate-90 pointer-events-none'
                                            : `${isDarkMode ? 'bg-[#E2CF9F] text-[#3A453C]' : 'bg-[#4A5D4E] text-white'} scale-100 rotate-0 hover:scale-105 active:scale-95 shadow-lg`
                                        }`}
                                >
                                    <Send size={17} strokeWidth={2.5} className="ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* ── HISTORY VIEW ───────────────────────────────────────────── */}
            {view === 'history' && (
                <>
                    {/* History Header */}
                    <header className="relative z-20 px-6 pt-14 pb-2">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-4xl font-display font-extrabold tracking-tight">Sessions</h2>
                            <button
                                onClick={() => { setHistorySearch(''); setView('home'); }}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-[#4A5D4E]/5 hover:bg-[#4A5D4E]/10'}`}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1`}
                            style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(78,92,76,0.06)', border: `1.5px solid ${borderColor}` }}
                        >
                            <Search size={14} className={`flex-shrink-0 ${subText}`} />
                            <input
                                type="text"
                                value={historySearch}
                                onChange={e => setHistorySearch(e.target.value)}
                                placeholder="Search your sessions..."
                                className={`flex-1 bg-transparent outline-none text-[14px] font-body ${subText} placeholder:opacity-70`}
                                style={{ fontSize: '16px' }}
                            />
                            {historySearch && (
                                <button onClick={() => setHistorySearch('')} className={`${subText}`}>
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Section label */}
                    <div className="px-7 mb-3 relative z-10">
                        <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${subText}`}>
                            {filteredSessions.length === 0
                                ? 'No sessions found'
                                : `${filteredSessions.length} session${filteredSessions.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto px-5 relative z-10 space-y-2" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '7rem' }}>
                        {filteredSessions.length === 0 && (
                            <div className={`flex flex-col items-center justify-center py-20 ${subText}`}>
                                <MessageCircle size={40} className="mb-4 opacity-20" />
                                <p className="text-sm opacity-60">No sessions yet. Start one above.</p>
                            </div>
                        )}

                        {filteredSessions.map(s => {
                            const pillarConf = PILLAR_CONFIGS.find(p => p.key === s.pillar);
                            const accentColor = pillarConf?.glowColor ?? '#B0B0B0';
                            return (
                                <div
                                    key={s.id}
                                    className="flex items-center gap-2"
                                >
                                    {/* Tappable card row — fills all space except the X */}
                                    <button
                                        onClick={() => resumeSession(s)}
                                        className="flex-1 flex items-center gap-4 px-4 py-4 rounded-[18px] text-left transition-all active:scale-[0.98] hover:opacity-90 relative overflow-hidden min-w-0"
                                        style={{
                                            background: cardBg,
                                            border: `1px solid ${borderColor}`,
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                                        }}
                                    >
                                        {/* Left accent bar */}
                                        <div
                                            className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                                            style={{ background: accentColor }}
                                        />
                                        <div
                                            className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 ml-2"
                                            style={{ background: pillarConf ? pillarConf.bg(isDarkMode) : 'rgba(160,160,160,0.1)', color: pillarConf?.glowColor ?? '#888' }}
                                        >
                                            {pillarIcon(s.pillar, 18)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-display font-semibold text-[13.5px] truncate tracking-tight">{s.title}</p>
                                            <p className={`text-[11px] mt-0.5 ${subText}`}>
                                                {pillarLabel(s.pillar)} · {formatDate(s.updatedAt)} · {s.messages.filter(m => m.role === 'user').length} messages
                                            </p>
                                        </div>
                                        <ChevronLeft size={14} className={`rotate-180 flex-shrink-0 ${subText}`} />
                                    </button>

                                    {/* Delete X — dedicated column, never overlaps */}
                                    <button
                                        onClick={(e) => deleteSession(s.id, e)}
                                        aria-label="Delete session"
                                        className={`
                                            flex-shrink-0 w-9 h-9 rounded-full
                                            flex items-center justify-center
                                            transition-all duration-150 active:scale-90
                                            ${isDarkMode
                                                ? 'bg-white/6 hover:bg-red-500/25 text-white/30 hover:text-red-300'
                                                : 'bg-[#3A1700]/4 hover:bg-red-50 text-black/25 hover:text-red-400'
                                            }
                                        `}
                                    >
                                        <X size={13} strokeWidth={2.5} />
                                    </button>
                                </div>
                            );
                        })}

                        <div className="h-6" />
                    </div>

                    {/* New Session Footer */}
                    <div className="relative z-20 px-5 pb-28 pt-3">
                        <button
                            onClick={() => setView('home')}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-[18px] transition-all active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(135deg, #C96A3A, #A8521F)',
                                boxShadow: '0 4px 20px rgba(201,106,58,0.3)',
                            }}
                        >
                            <Sparkles size={16} className="text-white" />
                            <span className="font-display font-semibold text-[14px] text-white tracking-tight">
                                Start a New Session
                            </span>
                        </button>
                    </div>
                </>
            )}
            {/* ── BOTTOM NAV BAR ─────────────────────────────────────── */}
            {onNavigate && (
                <nav className="absolute bottom-0 left-0 right-0 z-40 flex justify-center pb-6 pt-2 pointer-events-none">
                    <div
                        className="flex items-center gap-1 px-3 py-3 rounded-full pointer-events-auto"
                        style={{
                            background: isDarkMode ? 'rgba(58,69,60,0.85)' : 'rgba(255,255,255,0.5)',
                            border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(78,92,76,0.08)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        }}
                    >
                        {[
                            { id: 'home',     Icon: Home,        label: 'Home'    },
                            { id: 'momentum', Icon: TrendingUp,  label: 'Progress' },
                            { id: 'explore',  Icon: Compass,     label: 'Explore' },
                        ].map(({ id, Icon, label }) => (
                            <button
                                key={id}
                                onClick={() => {
                                    if (id === 'coach') return; // already here
                                    onNavigate(id);
                                }}
                                className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-all duration-300"
                                style={{
                                    background: id === 'coach'
                                        ? isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(78,92,76,0.12)'
                                        : 'transparent',
                                    color: id === 'coach'
                                        ? isDarkMode ? 'white' : '#4A5D4E'
                                        : isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(78,92,76,0.45)',
                                }}
                            >
                                <Icon size={20} />
                                <span className="text-[10px] font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </nav>
            )}
        </div>
    );
};
